"""
End-to-end: upload ➜ map ➜ stream (Digi-Key mocked).
"""

import io
import json

import pandas as pd
import pytest


@pytest.mark.e2e
def test_upload_and_stream(test_client, monkeypatch):
    # --- build tiny Excel in-memory
    buf = io.BytesIO()
    pd.DataFrame({"ManufacturerPN": ["ABC123"], "Manufacturer": ["Acme"]}).to_excel(
        buf, engine="openpyxl", index=False
    )
    buf.seek(0)

    # --- /api/upload
    r = test_client.post(
        "/api/upload",
        data={"file": (buf, "mini.xlsx")},
        content_type="multipart/form-data",
    )
    assert r.status_code == 200
    file_name = r.json["file_name"]

    # --- /api/process-bom
    cols = [{"name": "ManufacturerPN", "mapping": "ManufacturerPN"}]
    r_map = test_client.post("/api/process-bom", json={"file_name": file_name, "columns": cols})
    rows = r_map.json["rows"]

    # --- monkey-patch DigiKey stream handler
    from backend.app.services.digikey_service import digikey_service

    def fake_row_handler(_row):
        yield "found", {
            "mpn": "ABC123",
            "manufacturer": "Acme",
            "status": "In Stock",
            "price": 0.42,
            "price_breaks": [],
            "source": "DigiKey",
        }
        yield "complete", {"found": 1, "not_found": 0, "percent_found": 100.0}

    monkeypatch.setattr(digikey_service, "row_handler", fake_row_handler, raising=False)

    # --- /api/stream-digikey-results
    r_stream = test_client.post("/api/stream-digikey-results", json={"rows": rows})
    assert r_stream.status_code == 200

    events = [json.loads(l) for l in r_stream.data.decode().splitlines() if l.strip()]

    # at least one event & last is complete
    assert events, "stream returned no data"
    assert events[-1]["event"] == "complete"
