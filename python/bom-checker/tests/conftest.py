# --- Add this block at the top of tests/conftest.py ---
import sys
from pathlib import Path

# Dynamically add backend/app to PYTHONPATH
backend_root = Path(__file__).resolve().parents[1] / "backend" / "app"
sys.path.insert(0, str(backend_root))
# ------------------------------------------------------

from pathlib import Path
from typing import Iterator

import pytest
from faker import Faker
from flask import Flask

from backend.app.main import app as flask_app          # your real Flask app
from backend.app.services.digikey_service import digikey_service
from backend.app.services.mouser_service import mouser_service


@pytest.fixture(scope="session")
def fake() -> Faker:
    """Faker instance for random strings / numbers."""
    return Faker()


@pytest.fixture(scope="session")
def test_client() -> Flask.test_client:
    """Flask test-client for end-to-end API checks."""
    return flask_app.test_client()


@pytest.fixture(autouse=True)
def _isolate_tokens(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> None:
    """
    Redirect the token / cache directory to a temp location so the test run
    never touches real credentials on disk.
    """
    tmp_tokens = tmp_path / "tokens"
    tmp_tokens.mkdir()
    monkeypatch.setattr(digikey_service, "TOKEN_FILE", tmp_tokens / "dk_token.json", raising=False)
    monkeypatch.setattr(mouser_service, "TOKEN_FILE", tmp_tokens / "ms_token.json", raising=False)
