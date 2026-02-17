"""
DigiKey API client – extended with MOQ & lead-time support.

Public surface (unchanged):
    • get_token()
    • search_by_part_number()
    • search_substitute()
    • process_product()
    • row_handler()
Exports a singleton: digikey_service
"""

from __future__ import annotations

import json
import logging
import os
import time
from typing import Any, Dict, List, Optional, Tuple

import requests
from core.config import settings

logger = logging.getLogger(__name__)


class _DigiKeyService:
    BASE = (
        "https://api-sandbox.digikey.com"
        if settings.DIGIKEY_SANDBOX_MODE
        else "https://api.digikey.com"
    )
    TOKEN_FILE = os.path.join(
        os.path.dirname(__file__), "..", "tokens", "digikey_access_token.json"
    )
    SEARCH_URL = f"{BASE}/products/v4/search/keyword"

    # ------------------------------------------------------------------ init #
    def __init__(self) -> None:
        os.makedirs(os.path.dirname(self.TOKEN_FILE), exist_ok=True)
        self.client_id: str = settings.DIGIKEY_CLIENT_ID or ""
        self.client_secret: str = settings.DIGIKEY_CLIENT_SECRET or ""
        self._access: Optional[str] = None
        self._expiry: float = 0.0
        self._load_cached_token()

    # ----------------------------------------------------------- token cache #
    def _load_cached_token(self) -> None:
        try:
            if os.path.exists(self.TOKEN_FILE):
                tok = json.loads(open(self.TOKEN_FILE).read())
                self._access = tok["access_token"]
                self._expiry = tok["created_at"] + tok["expires_in"]
        except Exception:  # noqa: BLE001
            logger.exception("Failed to load cached DigiKey token")

    def _cache_token(self, token: Dict[str, Any]) -> None:
        token["created_at"] = int(time.time())
        with open(self.TOKEN_FILE, "w") as fh:
            json.dump(token, fh, indent=2)
        self._access = token["access_token"]
        self._expiry = token["created_at"] + token["expires_in"]

    # --------------------------------------------------------------- public #
    def get_token(self) -> str:
        """Return a valid access-token (cached, refreshed or simulated)."""
        if self._access and time.time() < self._expiry - 300:
            return self._access
        if not (self.client_id and self.client_secret):
            # prototype fallback (no credentials set)
            self._access = "simulated_token"
            self._expiry = time.time() + 3600
            return self._access

        data = {
            "client_id": self.client_id,
            "client_secret": self.client_secret,
            "grant_type": "client_credentials",
        }
        r = requests.post(f"{self.BASE}/v1/oauth2/token", data=data, timeout=20)
        r.raise_for_status()
        self._cache_token(r.json())
        return self._access

    # ---------------------------------------------------------------- search #
    def search_by_part_number(
        self, mpn: str, manufacturer: str | None = None
    ) -> Dict[str, Any]:
        """
        Exact-match part search (1 API call).  Unchanged behaviour.
        """
        if self.get_token() == "simulated_token":
            return self._mock_part_data(mpn, manufacturer)

        payload = {
            "Keywords": f"{manufacturer or ''} {mpn}".strip(),
            "RecordCount": 20,
            "ExactManufacturerPartNumber": True,
            "SearchOptions": ["ManufacturerPartSearch"],
        }
        r = requests.post(
            self.SEARCH_URL,
            headers={
                "Authorization": f"Bearer {self._access}",
                "X-DIGIKEY-Client-Id": self.client_id,
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=20,
        )
        print(f'Digikey request posted: {r}')
        if r.status_code == 401:  # token expired – one retry
            self._access = None
            return self.search_by_part_number(mpn, manufacturer)
        return r.json()

    # -------------------------------------------------------- substitute api #
    def search_substitute(
        self, digikey_pn: str, max_results: int = 5
    ) -> Optional[List[Dict[str, Any]]]:
        """Return up to *max_results* substitute parts for the given DK number."""
        token = self.get_token()
        if token == "simulated_token":
            return self._mock_substitutes(digikey_pn, max_results)

        try:
            url = f"{self.BASE}/products/v4/search/{digikey_pn}/substitutions"
            headers = {
                "Authorization": f"Bearer {token}",
                "X-DIGIKEY-Client-Id": self.client_id,
                "Content-Type": "application/json",
            }
            r = requests.get(url, headers=headers, timeout=20)
            if r.status_code == 401:
                self._access = None
                return self.search_substitute(digikey_pn, max_results)
            r.raise_for_status()
            data = r.json()
            products = (
                data.get("ProductSubstitutes") or data.get("Products") or []
            )[:max_results]
            return [self.process_product(p) for p in products]
        except Exception as exc:  # noqa: BLE001
            logger.exception("DigiKey substitute search failed: %s", exc)
            return None

    # ------------------------------------------------ helper: price breaks #
    def _extract_price_breaks(
        self, p: Dict[str, Any], variation: Optional[Dict[str, Any]]
    ) -> Tuple[List[Dict[str, Any]], float]:
        """Return (price_breaks, unit_price) tuple from product JSON."""
        std_pricing = (
            (variation or {}).get("StandardPricing")
            or p.get("StandardPricing")
            or []
        )
        price_breaks: List[Dict[str, Any]] = []
        for br in std_pricing:
            price_breaks.append(
                {
                    "quantity": br.get("BreakQuantity", 0),
                    "price": float(br.get("UnitPrice", 0) or 0),
                }
            )
        # fall-back: no StandardPricing → single break from UnitPrice
        if not price_breaks and p.get("UnitPrice"):
            unit = float(p["UnitPrice"] or 0)
            if unit:
                price_breaks.append({"quantity": 1, "price": unit})
        unit_price = price_breaks[0]["price"] if price_breaks else 0.0
        return price_breaks, unit_price

    # ------------------------------------------------------ public process #
    def process_product(self, p: Dict[str, Any]) -> Dict[str, Any]:
        """
        Trim Digi-Key product JSON to the fields our UI expects.

        **New keys added**: ``minimum_order_quantity``, ``lead_time_weeks``.
        """
        # ---- description --------------------------------------------------
        desc = (
            p.get("Description")
            or p.get("Description", {}).get("ProductDescription")
            or p.get("ProductDescription")
            or ""
        )
        if isinstance(desc, dict):
            desc = desc.get("ProductDescription", "") or str(desc)

        # ---- price / breaks ----------------------------------------------
        variation = (p.get("ProductVariations") or [{}])[0] if p.get("ProductVariations") else None
        price_breaks, unit_price = self._extract_price_breaks(p, variation)

        # ---- stock / extras ----------------------------------------------
        qty_available = int(p.get("QuantityAvailable", 0) or 0)

        result = {
            # -------- legacy fields -----------------------
            "mpn": self._extract_mpn(p),
            "manufacturer": (
                p.get("Manufacturer", {}).get("Name")
                or p.get("Manufacturer", {}).get("Value")
                or ""
            ),
            "description": desc,
            "digikey_pn": (variation or {}).get("DigiKeyProductNumber", "")
            or p.get("DigiKeyProductNumber", ""),
            "status": "In Stock" if qty_available else "Out of Stock",
            "quantity_available": qty_available,
            "price": unit_price,
            "price_breaks": price_breaks,
            # -------- NEW fields --------------------------
            "minimum_order_quantity": (variation or {}).get("MinimumOrderQuantity", 0),
            "lead_time_weeks": self._parse_int(p.get("ManufacturerLeadWeeks")),
            "product_status": p.get("ProductStatus", {}).get("Status", ""),
        }

        print(result)

        return result

    # ------------------------------------------------------------ row helper #
    def row_handler(self, row: Dict[str, Any]):
        """Yield ('found' | 'not_found', data) for a single BOM spreadsheet row."""
        mpns: list[str] = row["mpns"]
        manufacturer = row.get("manufacturer")
        best: Optional[Dict[str, Any]] = None

        for mpn in mpns:
            res = self.search_by_part_number(mpn, manufacturer)
            print(f'Digikey request : {res}')
            product = (res.get("Products") or [None])[0]
            if not product:
                continue
            formatted = self.process_product(product)
            formatted["mpn"] = mpn
            formatted["source"] = "DigiKey"
            if formatted["status"] == "In Stock":
                yield "found", formatted
                return
            if best is None:
                best = formatted  # remember first OOS candidate

        # nothing in-stock → fetch substitutes for *best*
        if best and best.get("digikey_pn"):
            subs = self.search_substitute(best["digikey_pn"], max_results=5) or []
            best["substitutes"] = subs

        yield "not_found", best or {
            "mpn": mpns[0] if mpns else "Unknown",
            "manufacturer": manufacturer or "",
            "status": "Not Found",
            "price": 0.0,
            "description": "Part not found",
            "quantity_available": 0,
            "price_breaks": [],
            "source": "DigiKey",
        }

    # ---------------------------------------------------- misc helpers ---- #
    @staticmethod
    def _extract_mpn(p: Dict[str, Any]) -> str:
        """Return the best-guess part number field name present in *p*."""
        return (
            p.get("ManufacturerPartNumber")
            or p.get("ManufacturerProductNumber")
            or p.get("MPN")
            or ""
        )

    @staticmethod
    def _parse_int(value: Any) -> Optional[int]:
        """Return int(value) or None if conversion fails."""
        try:
            return int(str(value).strip())
        except (TypeError, ValueError):
            return None

    # ------------------------------------------------------ mock / prototype #
    def _mock_part_data(self, mpn: str, manufacturer: str | None) -> Dict[str, Any]:
        price = round((hash(mpn) % 1000) / 100, 2)
        return {
            "Products": [
                {
                    "ManufacturerProductNumber": mpn,
                    "Manufacturer": {"Name": manufacturer or "Mock Inc"},
                    "Description": f"Mock description for {mpn}",
                    "DigiKeyProductNumber": f"DK-{hash(mpn) % 99999}",
                    "QuantityAvailable": (hash(mpn) % 2) * 50,
                    "UnitPrice": price,
                    # NEW mock extras
                    "ManufacturerLeadWeeks": "4",
                    "ProductVariations": [
                        {
                            "MinimumOrderQuantity": 1,
                            "StandardPricing": [
                                {"BreakQuantity": 1, "UnitPrice": price},
                                {"BreakQuantity": 10, "UnitPrice": round(price * 0.9, 2)},
                            ],
                        }
                    ],
                }
            ]
        }

    def _mock_substitutes(self, digikey_pn: str, n: int) -> List[Dict[str, Any]]:
        """Generate *n* fake substitute parts."""
        subs: List[Dict[str, Any]] = []
        for i in range(n):
            mpn = f"SUB-{digikey_pn}-{i}"
            subs.append(
                {
                    "ManufacturerProductNumber": mpn,
                    "Manufacturer": {"Name": "MockSub"},
                    "Description": f"Substitute for {digikey_pn}",
                    "QuantityAvailable": 100 + i,
                    "UnitPrice": 0.05 * (i + 1),
                    "ManufacturerLeadWeeks": str(2 + i),
                    "ProductVariations": [{"MinimumOrderQuantity": 1}],
                }
            )
        return subs


# --------------------------------------------------------------- singleton #
digikey_service = _DigiKeyService()
