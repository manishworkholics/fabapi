"""
Mouser API client – **patched 2025-04-26**
  • robust Availability parsing (handles 'None', '', etc.)
  • exceptions inside row_handler no longer kill the worker thread

Mouser API client – **extended 2025-05-14**
  • keeps prior behaviour / helpers untouched
  • adds three fields:
        · minimum_order_quantity
        · lead_time_weeks
        · product_status
"""
from __future__ import annotations

import logging
import os
from typing import Any, Dict, List, Optional

import requests

logger = logging.getLogger(__name__)


# ───────────────────────────────────────────────────────── helpers ──
def _safe_int(val: str | int | None, default: int = 0) -> int:
    """Cast *val* to int; on failure return *default*."""
    try:
        return int(val)
    except (TypeError, ValueError):
        return default


def _parse_lead_weeks(raw: str | None) -> Optional[int]:
    """
    Mouser’s `LeadTime` is usually like `"12 Weeks"` or `"8"`.
    Return the numeric weeks or None.
    """
    if not raw:
        return None
    first = str(raw).split()[0]
    return _safe_int(first, default=None)  # type: ignore[arg-type]


class _MouserService:
    BASE = "https://api.mouser.com/api/v1"
    SEARCH_URL = f"{BASE}/search/keyword"

    def __init__(self) -> None:
        self.api_key = os.getenv("MOUSER_API_KEY", "")
        if not self.api_key:
            logger.warning("MOUSER_API_KEY env var missing – using mock data")

    # ───────────────────────────────────────────────────────── search ──
    def search_by_keyword(
        self, mpn: str, manufacturer: str | None = None
    ) -> Dict[str, Any]:
        if not self.api_key:
            return self._mock_search(mpn, manufacturer)

        payload = {
            "SearchByKeywordRequest": {
                "keyword": mpn,
                "records": 10,
                "startingRecord": 0,
                "searchOptions": "None",
                "searchWithYourSignUpLanguage": "false",
            }
        }
        url = f"{self.SEARCH_URL}?apiKey={self.api_key}"
        r = requests.post(
            url, headers={"Content-Type": "application/json"}, json=payload
        )
        r.raise_for_status()
        return r.json()

    # ─────────────────────────────────────────────────────── format ──
    def process_product(self, p: Dict[str, Any]) -> Dict[str, Any]:
        # stock qty (robust)
        raw_qty = str(p.get("Availability") or "0").split()[0].replace(",", "")
        qty = _safe_int(raw_qty)

        # prices
        price_breaks = [
            {
                "quantity": _safe_int(b.get("Quantity")),
                "price": float(str(b.get("Price", "0")).replace("$", "")),
            }
            for b in (p.get("PriceBreaks") or [])
            if b
        ]
        price = price_breaks[0]["price"] if price_breaks else 0.0

        print(p)

        # NEW additions
        moq = _safe_int(p.get("Min"))
        lead_weeks = _parse_lead_weeks(p.get("LeadTime"))
        status = p.get("LifecycleStatus", "")

        result = {
            "mpn": p.get("MouserPartNumber", ""),
            "manufacturer": p.get("Manufacturer", ""),
            "description": p.get("Description", ""),
            "mouser_pn": p.get("MouserPartNumber", ""),
            "status": "In Stock" if qty else "Out of Stock",
            "quantity_available": qty,
            "price": price,
            "price_breaks": price_breaks,
            # -------- NEW fields -----------------------------------------
            "minimum_order_quantity": moq,
            "lead_time_weeks": lead_weeks,
            "product_status": status,
        }

        print(f'MOUSER RESULT: {result}')

        return result

    # ───────────────────────────────────────────── row handler (stream) ──
    def row_handler(self, row: Dict[str, Any]):
        """
        Generator for one BOM line.  Behaviour unchanged.
        """
        mpns: List[str] = row.get("mpns", [])
        manufacturer: Optional[str] = row.get("manufacturer")

        if not mpns:
            yield "not_found", {
                "mpn": "Unknown",
                "manufacturer": manufacturer,
                "status": "No MPN in BOM row",
                "source": "Mouser",
            }
            return

        best_match: Optional[Dict[str, Any]] = None

        for mpn in mpns:
            try:
                raw = self.search_by_keyword(mpn, manufacturer)
                parts = (
                    raw.get("SearchResults", {}).get("Parts")
                    if "SearchResults" in raw
                    else raw.get("Parts")
                ) or []

                if not parts:
                    continue

                payload = self.process_product(parts[0])
                payload.update({"mpn": mpn, "source": "Mouser"})

                if payload["status"] == "In Stock":
                    yield "found", payload
                    return

                best_match = payload  # first OOS becomes fallback

            except Exception as exc:  # noqa: BLE001
                logger.exception("[Mouser] error for %s", mpn)
                yield "error", {"mpn": mpn, "error": str(exc), "source": "Mouser"}

        # nothing in-stock or every attempt errored
        yield "not_found", best_match or {
            "mpn": mpns[0],
            "manufacturer": manufacturer,
            "status": "Not Found",
            "price": 0.0,
            "description": "Part not found",
            "quantity_available": 0,
            "price_breaks": [],
            "source": "Mouser",
        }

    # ─────────────────────────────────────────────── mock helpers ──
    def _mock_search(self, mpn: str, manufacturer: str | None) -> Dict[str, Any]:
        qty = (hash(mpn) % 2) * 100
        price = round((hash(mpn) % 800) / 100, 2)
        return {
            "SearchResults": {
                "Parts": [
                    {
                        "MouserPartNumber": f"M-{hash(mpn)%999999}",
                        "Manufacturer": manufacturer or "Mock Corp",
                        "Description": f"Mock part for {mpn}",
                        "Availability": f"{qty} In Stock" if qty else "0 In Stock",
                        "Min": "2",
                        "LeadTime": "6 Weeks",
                        "LifecycleStatus": "Active",
                        "PriceBreaks": [
                            {"Quantity": "1", "Price": f"${price}"},
                            {"Quantity": "10", "Price": f"${price*0.9:.2f}"},
                        ],
                    }
                ]
            }
        }


# singleton instance
mouser_service = _MouserService()
