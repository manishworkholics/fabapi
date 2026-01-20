"""
Prediction service – refactored for clarity and smaller surface-area.

• Still loads a scikit-learn OneVsRestClassifier (joblib file)
• Falls back to “Model not loaded” if the file is missing
• Provides the same .get_predictions(list[str]) signature used elsewhere
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Union

import joblib
import numpy as np
import pandas as pd

from core.config import settings
from utils.model_compat import simple_tokenizer, standard_preprocessor  # keep legacy helpers

logger = logging.getLogger(__name__)


class _PredictionService:
    """
    Thin wrapper around a pre-trained OneVsRestClassifier.
    Tries several fallback locations so that the dev environment is forgiving.
    """

    MODEL_CANDIDATES = [
        Path(settings.MODEL_PATH),  # path from settings
        Path.cwd() / "models" / "column_classifier_model.joblib",
        Path.cwd() / "backend" / "models" / "column_classifier_model.joblib",
        Path(__file__).parent.parent / "models" / "column_classifier_model.joblib",
    ]

    def __init__(self, model_path: Optional[Union[str, Path]] = None) -> None:
        self._model = None
        self._model_path = Path(model_path) if model_path else None
        self._load_model()

    # ---------------------------------------------------------------- private
    def _load_model(self) -> None:
        """
        Locate and un-pickle the model file.  If not found, keep self._model = None
        so that callers receive dummy predictions rather than exceptions.
        """
        # make custom preprocessors visible for joblib deserialisation hacks
        sys.modules["__main__"].standard_preprocessor = standard_preprocessor
        sys.modules["__main__"].simple_tokenizer = simple_tokenizer

        search_paths: Sequence[Path] = (
            [self._model_path] if self._model_path else self.MODEL_CANDIDATES
        )

        for path in search_paths:
            if path and path.is_file():
                try:
                    logger.info("Loading column-classifier model from %s", path)
                    self._model = joblib.load(path)
                    self._classes = list(self._model.classes_)
                    return
                except Exception:
                    logger.exception("Failed to load model at %s – trying next location", path)

        logger.warning("Column-classifier model not found – system will run in mock mode")

    @staticmethod
    def _softmax(scores: np.ndarray) -> np.ndarray:
        """
        Convert decision_function outputs into ‘confidence-like’ probabilities.
        Not mathematically perfect for SVMs, but good enough for UI ranking.
        """
        e = np.exp(scores - scores.max())
        return e / e.sum()

    # ---------------------------------------------------------------- public
    def get_predictions(self, samples: List[str]) -> List[Dict[str, Any]]:
        """
        Return top-two category guesses for each input text.
        """
        if self._model is None:
            return [
                {
                    "primary_category": "Model not loaded",
                    "primary_confidence": 0.0,
                    "secondary_category": "Model not loaded",
                    "secondary_confidence": 0.0,
                }
                for _ in samples
            ]

        # preprocess input text
        cleaned = [standard_preprocessor(s) for s in samples]

        try:
            decision_matrix = self._model.decision_function(cleaned)  # shape (n_samples, n_classes)
        except Exception as exc:
            logger.exception("Model prediction failed")
            return [
                {
                    "primary_category": f"Error: {exc}",
                    "primary_confidence": 0.0,
                    "secondary_category": "Error",
                    "secondary_confidence": 0.0,
                }
                for _ in samples
            ]

        results: List[Dict[str, Any]] = []
        for scores in decision_matrix:
            probs = self._softmax(scores)
            top2 = probs.argsort()[-2:][::-1]  # indices sorted high→low

            results.append(
                {
                    "primary_category": self._classes[top2[0]],
                    "primary_confidence": round(float(probs[top2[0]]), 4),
                    "secondary_category": self._classes[top2[1]],
                    "secondary_confidence": round(float(probs[top2[1]]), 4),
                }
            )
        return results
        # ---------------------------------------------------------------- public helper for /process-bom
    def prepare_rows_for_stream(
        self, file_name: str, columns: List[Dict[str, str]]
    ) -> Dict[str, Any]:
        """
        Build the compact row-array the front-end will later stream to
        /stream-digikey-results and /stream-mouser-results.

        Args
        ----
        file_name : name of the uploaded Excel file (already saved in uploads/)
        columns   : [{name:str, mapping:str}, …] – mapping chosen by the user

        Returns
        -------
        {
          "rows": [
             {"row_index": int, "mpns": [str,…], "manufacturer": str|None},
             …
          ],
          "total_rows": int
        }
        """
        from services.excel_service import clean_excel_file  # local import to avoid cycle

        path = Path(__file__).parent.parent / "uploads" / file_name
        if not path.exists():
            raise FileNotFoundError(f"Uploaded file not found at {path}")

        df = clean_excel_file(path.read_bytes())

        # Build lookup of canonical → original column names
        mapping = {m["mapping"]: m["name"] for m in columns}

        print(f'Mapping: {mapping}')

        mpn_col = mapping.get("ManufacturerPN")
        manu_col = mapping.get("Manufacturer")
        qty_col  = mapping.get("Quantity")  
        ref_col  = mapping.get("Reference")

        if not mpn_col:
            raise ValueError("No ManufacturerPN column in mapping")

        rows = []
        for idx, row in df.iterrows():
            mpn_cell = row.get(mpn_col)
            if mpn_cell is None or (isinstance(mpn_cell, float) and np.isnan(mpn_cell)):
                continue

            # Allow multiple MPNs separated by comma / space
            mpns = [m.strip() for m in str(mpn_cell).split(",") if m.strip()]
            manuf = str(row.get(manu_col)).strip() if manu_col and row.get(manu_col) else None

            qty_val = None
            if qty_col and qty_col in row and pd.notna(row[qty_col]):
                try:
                    qty_val = int(float(row[qty_col]))
                except ValueError:
                    qty_val = None          # fall back if “10 pcs” etc.
            
            rows.append({
                "row_index":   int(idx),
                "mpns":        mpns,
                "manufacturer": manuf,
                "quantity":     qty_val or 1,   # default to 1 if blank/unparseable
                "reference":    (row[ref_col] if ref_col and row.get(ref_col) is not None else None)
            })

            print(f'rows are: {rows}')

        return {"rows": rows, "total_rows": len(rows)}



# singleton instance – imported elsewhere
prediction_service = _PredictionService()
