"""
Flask API – BOM Checker (with complete Swagger docs)
All HTTP signatures & payloads stay identical to the original version, so the
front-end continues to work out-of-the-box.
"""
from __future__ import annotations

import io
import json
import os
import threading
import time
import datetime
from queue import Queue
from typing import Any, Dict, Iterable, List

import pandas as pd
from flasgger import Swagger, swag_from
from flask import Flask, Response, jsonify, request, stream_with_context
from flask_cors import CORS

from core.config import settings
from core.logging import setup_logging
from services.digikey_service import digikey_service
from services.excel_service import clean_excel_file, create_training_data
from services.mouser_service import mouser_service
from services.prediction_service import prediction_service

# ───────────────────────────────────────────────────────── app ──
app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = settings.MAX_CONTENT_LENGTH
CORS(app)  # local dev

logger = setup_logging()
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# ─────────────────────────────────────────── Swagger config ──
swagger_template = {
    "swagger": "2.0",
    "info": {
        "title": "BOM Checker API",
        "description": (
            "Excel-based bill-of-materials upload, column prediction, and real-time "
            "Digi-Key / Mouser part look-ups streamed as NDJSON."
        ),
        "version": "1.0.0",
        "contact": {"email": "support@example.com"},
        "license": {"name": "MIT"},
    },
    "basePath": "/",
    "schemes": ["http", "https"],
    "securityDefinitions": {},
    # ────────────────────────────────  SHARED SCHEMAS  ─────────────────────────
    "definitions": {
        # ──────────────  Upload-/Process-BOM pipeline  ──────────────
        "ColumnPrediction": {
            "type": "object",
            "properties": {
                "primary_category":   {"type": "string"},
                "primary_confidence": {"type": "number", "format": "float"},
                "secondary_category": {"type": "string"},
                "secondary_confidence": {"type": "number", "format": "float"},
            },
        },
        "ColumnData": {
            "type": "object",
            "properties": {
                "name":          {"type": "string"},
                "sample_values": {"type": "array", "items": {"type": "string"}},
                "prediction":    {"$ref": "#/definitions/ColumnPrediction"},
            },
        },
        "UploadResponse": {
            "type": "object",
            "properties": {
                "success":   {"type": "boolean"},
                "file_name": {"type": "string"},
                "columns":   {"type": "array", "items": {"$ref": "#/definitions/ColumnData"}},
                "row_count": {"type": "integer"},
            },
        },
        "ColumnMapping": {
            "type": "object",
            "required": ["name", "mapping"],
            "properties": {
                "name":    {"type": "string"},
                "mapping": {"type": "string"},
            },
        },
        "ProcessBomRequest": {
            "type": "object",
            "required": ["file_name", "columns"],
            "properties": {
                "file_name": {"type": "string"},
                "columns":   {"type": "array", "items": {"$ref": "#/definitions/ColumnMapping"}},
            },
        },
        "BomRow": {
            "type": "object",
            "required": ["row_index", "mpns"],
            "properties": {
                "row_index":   {"type": "integer"},
                "mpns":        {"type": "array", "items": {"type": "string"}},
                "manufacturer":{"type": "string"},
            },
        },
        "ProcessBomResponse": {
            "type": "object",
            "properties": {
                "rows":       {"type": "array", "items": {"$ref": "#/definitions/BomRow"}},
                "total_rows": {"type": "integer"},
            },
        },
        # ──────────────  Part & pricing  ──────────────
        "PriceBreak": {
            "type": "object",
            "properties": {
                "quantity": {"type": "integer"},
                "price":    {"type": "number", "format": "float"},
            },
        },
        "Part": {
            "description": "Single part record returned by Digi-Key or Mouser",
            "type": "object",
            "properties": {
                "mpn":                {"type": "string"},
                "manufacturer":       {"type": "string"},
                "description":        {"type": "string"},
                "status":             {"type": "string"},
                "quantity_available": {"type": "integer"},
                "price":              {"type": "number", "format": "float"},
                "price_breaks": {
                    "type": "array",
                    "items": {"$ref": "#/definitions/PriceBreak"},
                },
                "minimum_order_quantity": {"type": "integer"},
                "lead_time_weeks":        {"type": "integer"},
                "product_status":         {"type": "string"},
                # Vendor-specific extras (all optional)
                "digikey_pn": {"type": "string"},
                "mouser_pn":  {"type": "string"},
                "source":     {"type": "string"},
                "substitutes": {
                    "type": "array",
                    "items": {"$ref": "#/definitions/Part"},
                },
            },
        },
        # ──────────────  NDJSON stream event wrappers  ──────────────
        "StreamProgress": {
            "type": "object",
            "properties": {
                "event": {"type": "string", "enum": ["progress"]},
                "data": {
                    "type": "object",
                    "properties": {
                        "total":            {"type": "integer"},
                        "processed":        {"type": "integer"},
                        "found":            {"type": "integer"},
                        "not_found":        {"type": "integer"},
                        "percent_complete": {"type": "number"},
                    },
                },
            },
        },
        "StreamFound": {
            "type": "object",
            "properties": {
                "event": {"type": "string", "enum": ["found"]},
                "data":  {"$ref": "#/definitions/Part"},
            },
        },
        "StreamNotFound": {
            "type": "object",
            "properties": {
                "event": {"type": "string", "enum": ["not_found"]},
                "data":  {"$ref": "#/definitions/Part"},
            },
        },
        "StreamComplete": {
            "type": "object",
            "properties": {
                "event": {"type": "string", "enum": ["complete"]},
                "data": {
                    "type": "object",
                    "properties": {
                        "total":            {"type": "integer"},
                        "processed":        {"type": "integer"},
                        "found":            {"type": "integer"},
                        "not_found":        {"type": "integer"},
                        "percent_complete": {"type": "number"},
                        "percent_found":    {"type": "number"},
                        "source":           {"type": "string"},
                    },
                },
            },
        },
        "StreamEvent": {
            "description": "One line in the NDJSON response",
            "type": "object",
            "discriminator": "event",
            "oneOf": [
                {"$ref": "#/definitions/StreamProgress"},
                {"$ref": "#/definitions/StreamFound"},
                {"$ref": "#/definitions/StreamNotFound"},
                {"$ref": "#/definitions/StreamComplete"},
            ],
        },
    },
}

# ──────────────────────────────────────────── Swagger config ──
swagger_config = {
    "headers": [],
    "specs": [
        {
            "endpoint": "apispec_1",
            "route": "/swagger.json",
            "rule_filter": lambda rule: True,    # all routes
            "model_filter": lambda tag: True,    # all models
        }
    ],
    "static_url_path": "/flasgger_static",
    "swagger_ui": True,
    "specs_route": "/swagger/",              # serve UI at /swagger/
}

swagger = Swagger(
    app,
    template=swagger_template,
    config=swagger_config,
)

# ───────────────────────────────────────────── helpers ──
def _save_tmp_file(name: str, data: bytes) -> str:
    path = os.path.join(UPLOAD_FOLDER, name)
    with open(path, "wb") as fh:
        fh.write(data)
    return path


def _progress_payload(total: int, found: int, not_found: int) -> Dict[str, Any]:
    processed = found + not_found
    return {
        "total": total,
        "processed": processed,
        "found": found,
        "not_found": not_found,
        "percent_complete": round(processed / total * 100, 1) if total else 0,
    }


def _stream_results(rows: List[Dict[str, Any]], search_fn, svc: str) -> Iterable[str]:
    from datetime import datetime

    q: Queue = Queue()
    total = len(rows)
    logger.info("[%s] Stream starting with %s rows", svc, total)

    def worker() -> None:
        found = not_found = 0
        for row in rows:
            for event, payload in search_fn(row):
                q.put({"event": event, "data": payload})
                if event == "found":
                    found += 1
                elif event == "not_found":
                    not_found += 1
                q.put({"event": "progress", "data": _progress_payload(total, found, not_found)})
                time.sleep(1)
        q.put(
            {
                "event": "complete",
                "data": {
                    **_progress_payload(total, found, not_found),
                    "source": svc,
                    "percent_found": round(found / total * 100, 1) if total else 0,
                },
            }
        )
        logger.info("[%s] Worker completed", svc)

    threading.Thread(target=worker, daemon=True).start()
    logger.info("[%s] Thread started — yielding dummy event at %s", svc, datetime.now())
    yield json.dumps({"event": "ready", "data": {}}) + "\n"

    while True:
        msg = q.get()
        yield json.dumps(msg) + "\n"
        if msg["event"] == "complete":
            break


# ───────────────────────────────────────────── routes ──
@app.post("/api/upload")
@swag_from(
    {
        "tags": ["BOM"],
        "summary": "Upload an Excel BOM and receive column predictions",
        "consumes": ["multipart/form-data"],
        "parameters": [
            {
                "name": "file",
                "in": "formData",
                "type": "file",
                "required": True,
                "description": ".xlsx or .xls file",
            }
        ],
        "responses": {
            200: {"description": "Success", "schema": {"$ref": "#/definitions/UploadResponse"}},
            400: {"description": "Bad request"},
            500: {"description": "Server error"},
        },
    }
)
def upload_file() -> Response:  # noqa: D401
    """Step 1 – receive Excel, return column predictions."""
    if "file" not in request.files:
        return jsonify({"error": "No file part"}), 400
    file = request.files["file"]
    if not file.filename:
        return jsonify({"error": "No selected file"}), 400
    if not file.filename.endswith((".xlsx", ".xls")):
        return jsonify({"error": "File must be .xlsx or .xls"}), 400

    try:
        raw = file.read()
        _save_tmp_file(file.filename, raw)
        df = clean_excel_file(raw)
        training_df = create_training_data(df, source_file=file.filename)
        preds = prediction_service.get_predictions(training_df["sample_data"].tolist())

        columns = [
            {
                "name": row["column_name"],
                "sample_values": [str(v) for v in df[row["column_name"]].dropna().head(5)],
                "prediction": preds[i],
            }
            for i, row in training_df.iterrows()
        ]
        return jsonify(
            {
                "success": True,
                "file_name": file.filename,
                "columns": columns,
                "row_count": len(df),
            }
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("upload_file failed")
        return jsonify({"error": f"Error processing file: {exc}"}), 500


@app.post("/api/process-bom")
@swag_from(
    {
        "tags": ["BOM"],
        "summary": "Turn user mappings into row objects for streaming",
        "consumes": ["application/json"],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "schema": {"$ref": "#/definitions/ProcessBomRequest"},
                "required": True,
            }
        ],
        "responses": {
            200: {"schema": {"$ref": "#/definitions/ProcessBomResponse"}},
            400: {"description": "Bad request"},
            500: {"description": "Server error"},
        },
    }
)
def process_bom() -> Response:
    """Step 2 – create the row list the front-end will stream later."""
    data = request.get_json(silent=True) or {}
    try:
        result = prediction_service.prepare_rows_for_stream(data["file_name"], data["columns"])
        return jsonify(result)
    except Exception as exc:  # noqa: BLE001
        logger.exception("process_bom failed")
        return jsonify({"error": str(exc)}), 500


@app.post("/api/stream-digikey-results")
@swag_from(
    {
        "tags": ["Streaming"],
        "summary": "NDJSON stream of Digi-Key look-ups",
        "consumes": ["application/json"],
        "produces": ["application/x-ndjson"],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "rows": {"type": "array", "items": {"$ref": "#/definitions/BomRow"}}
                    },
                    "required": ["rows"],
                },
            }
        ],
        "responses": {
            200: {
                "description": "Continuous NDJSON – one **StreamEvent** per line",
                "schema": {"$ref": "#/definitions/StreamEvent"},
                "examples": {
                    "application/x-ndjson": (
                        '{"event":"ready","data":{}}\n'
                        '{"event":"progress","data":{"total":250,"processed":25,"found":20,"not_found":5,"percent_complete":10}}\n'
                        '{"event":"found","data":{"mpn":"TPS7A4700RGWT","manufacturer":"Texas Instruments","digikey_pn":"TPS7A4700RGWT-ND","description":"LDO Regulator 1 A","status":"In Stock","quantity_available":312,"price":1.02,"price_breaks":[{"quantity":1,"price":1.02},{"quantity":10,"price":0.95}],"minimum_order_quantity":1,"lead_time_weeks":4,"product_status":"Active","source":"DigiKey"}}\n'
                        '{"event":"complete","data":{"total":250,"processed":250,"found":220,"not_found":30,"percent_complete":100,"percent_found":88,"source":"DigiKey"}}\n'
                    )
                },
            },
            400: {"description": "Bad request – malformed body"},
        },
    }
)
def stream_digikey_results() -> Response:
    """Step 3a – stream Digi-Key search results."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows")
    if not rows:
        return jsonify({"error": "Invalid request format"}), 400
    return Response(
        stream_with_context(_stream_results(rows, digikey_service.row_handler, "DigiKey")),
        mimetype="application/x-ndjson",
    )


@app.post("/api/stream-mouser-results")
@swag_from(
    {
        "tags": ["Streaming"],
        "summary": "NDJSON stream of Mouser look-ups",
        "consumes": ["application/json"],
        "produces": ["application/x-ndjson"],
        "parameters": [
            {
                "name": "body",
                "in": "body",
                "required": True,
                "schema": {
                    "type": "object",
                    "properties": {
                        "rows": {"type": "array", "items": {"$ref": "#/definitions/BomRow"}}
                    },
                    "required": ["rows"],
                },
            }
        ],
        "responses": {
            200: {
                "description": "Continuous NDJSON – one **StreamEvent** per line",
                "schema": {"$ref": "#/definitions/StreamEvent"},
                "examples": {
                    "application/x-ndjson": (
                        '{"event":"ready","data":{}}\n'
                        '{"event":"progress","data":{"total":180,"processed":18,"found":12,"not_found":6,"percent_complete":10}}\n'
                        '{"event":"found","data":{"mpn":"SN74LS32N","manufacturer":"Texas Instruments","mouser_pn":"595-SN74LS32N","description":"Quad 2-Input OR Gate","status":"In Stock","quantity_available":5400,"price":0.23,"price_breaks":[{"quantity":1,"price":0.23},{"quantity":100,"price":0.19}],"minimum_order_quantity":1,"lead_time_weeks":8,"product_status":"Active","source":"Mouser"}}\n'
                        '{"event":"complete","data":{"total":180,"processed":180,"found":160,"not_found":20,"percent_complete":100,"percent_found":88.9,"source":"Mouser"}}\n'
                    )
                },
            },
            400: {"description": "Bad request – malformed body"},
        },
    }
)
def stream_mouser_results() -> Response:
    """Step 3b – stream Mouser search results."""
    data = request.get_json(silent=True) or {}
    rows = data.get("rows") or []
    if not rows:
        return jsonify({"error": "Invalid request format"}), 400
    try:
        return Response(
            stream_with_context(_stream_results(rows, mouser_service.row_handler, "Mouser")),
            mimetype="application/x-ndjson",
        )
    except Exception as exc:  # noqa: BLE001
        logger.exception("[Mouser] route failed before streaming")
        return jsonify({"error": str(exc)}), 500

# ────────────────────────────────────────────── health ──
@app.get("/health")
@swag_from(
    {
        "tags": ["Health"],
        "summary": "Check if the API is running",
        "responses": {
            200: {"description": "API is healthy"},
            500: {"description": "API is not healthy"},
        },
    }
)
def health_check() -> Response:
    """Health check endpoint."""
    try:
        # Perform any necessary checks here, e.g., database connection, service availability
        return jsonify({"status": "healthy", "timestamp": datetime.datetime.now()}), 200
    except Exception as exc:  # noqa: BLE001
        logger.exception("Health check failed")
        return jsonify({"status": "unhealthy", "error": str(exc)}), 500


# ───────────────────────────────────────────── run ──
if __name__ == "__main__":
    app.run(
        host=os.environ.get("HOST", "0.0.0.0"),
        port=int(os.environ.get("PORT", 5001)),
        debug=False,
        threaded=True,
        use_reloader=False,
        ssl_context=(
            (os.environ["SSL_CERT"], os.environ["SSL_KEY"])
            if os.environ.get("USE_SSL", "false").lower() == "true"
            else None
        ),
    )

