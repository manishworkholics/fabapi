# tests/test_services.py
# ---------------------------------------------------------------------------
# Common imports
# ---------------------------------------------------------------------------
from __future__ import annotations

import pytest
import requests
from unittest.mock import patch

from backend.app.services.digikey_service import digikey_service
from backend.app.services.mouser_service import mouser_service


# ---------------------------------------------------------------------------
# Fixture: canonical Digi-Key payload (legacy + new fields)
# ---------------------------------------------------------------------------
@pytest.fixture
def dk_ok_response() -> dict:
    """
    Minimal yet representative Digi-Key response used by all DK tests.
    Includes MOQ and lead-time so new assertions pass.
    """
    return {
        "Products": [
            {
                "ManufacturerPartNumber": "ABC123",
                "Manufacturer": {"Name": "Acme"},
                "Description": {"ProductDescription": "Widget"},
                "ManufacturerLeadWeeks": "5",          
                "ProductStatus": {"Status": "Active"},  
                "ProductVariations": [
                    {
                        "DigiKeyProductNumber": "P-ABC123-ND",
                        "MinimumOrderQuantity": 3,       # new field
                        "StandardPricing": [
                            {"BreakQuantity": 1, "UnitPrice": 0.25},
                            {"BreakQuantity": 10, "UnitPrice": 0.22},
                        ],
                    }
                ],
                "QuantityAvailable": 42,
            }
        ]
    }


# ---------------------------------------------------------------------------
# Digi-Key – existing behaviour still works
# ---------------------------------------------------------------------------
def test_digikey_process_product(dk_ok_response):
    prod = dk_ok_response["Products"][0]
    out = digikey_service.process_product(prod)

    # legacy checks
    assert out["status"] == "In Stock"
    assert out["price_breaks"][1]["quantity"] == 10

    # new fields
    assert out["minimum_order_quantity"] == 3
    assert out["lead_time_weeks"] == 5
    assert out["product_status"] == "Active" 


@patch.object(requests, "post")
def test_digikey_search(mon_post, dk_ok_response):
    mon_post.return_value.status_code = 200
    mon_post.return_value.json.return_value = dk_ok_response

    # pretend we have a real token so service does *not* fall back to mock
    with patch.object(digikey_service, "get_token", return_value="real_token"):
        res = digikey_service.search_by_part_number("ABC123")

    assert res["Products"][0]["ManufacturerPartNumber"] == "ABC123"


def test_process_product_includes_new_fields(monkeypatch, dk_ok_response):
    """
    Patches search_by_part_number so we don't hit the network.
    Only verifies MOQ & lead-time are now present.
    """
    monkeypatch.setattr(
        digikey_service, "search_by_part_number", lambda *_a, **_k: dk_ok_response
    )

    processed = digikey_service.process_product(dk_ok_response["Products"][0])

    # --- legacy keys ---------------------------------------------------- #
    assert processed["mpn"] == "ABC123"
    assert processed["quantity_available"] == 42

    # --- NEW keys ------------------------------------------------------- #
    assert processed["minimum_order_quantity"] == 3
    assert processed["lead_time_weeks"] == 5
    assert processed["product_status"] == "Active" 


# ---------------------------------------------------------------------------
# Mouser (unchanged)
# ---------------------------------------------------------------------------
@patch.object(requests, "post")
def test_mouser_keyword(mon_post):
    fake_api = {
    "SearchResults": {
        "Parts": [
            {
                "ManufacturerPartNumber": "DEF456",
                "Manufacturer": "Foo",
                "Description": "Bar",
                "Availability": "100 In Stock",
                "Min": "5",                      # ← new
                "LeadTime": "8 Weeks",           # ← new
                "LifecycleStatus": "Active",     # ← new
                "PriceBreaks": [{"Quantity": 0, "Price": "$0.10"}],
            }
        ]
    }
}

    mon_post.return_value.status_code = 200
    mon_post.return_value.json.return_value = fake_api

    mouser_service.api_key = "dummy-key"
    res = mouser_service.search_by_keyword("DEF456")

    part = res["SearchResults"]["Parts"][0]
    assert part["ManufacturerPartNumber"] == "DEF456"
    assert mouser_service.process_product(part)["minimum_order_quantity"] == 5
    assert mouser_service.process_product(part)["lead_time_weeks"] == 8
    assert mouser_service.process_product(part)["product_status"] == "Active"
