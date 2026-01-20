# BOM Checker 🛠️📋

A full-stack prototype for validating a Bill-of-Materials (BOM):

- **Upload** an Excel file
- **Auto-classify** its columns with an ML model
- Query **Digi-Key** _and_ **Mouser** APIs in real-time (with substitutes)
- **Stream** progress & results to the browser
- **Export** a consolidated CSV

## Features

- Vanilla HTML/CSS/JS frontend with no build step
- Separate result panes for Digi-Key (top) and Mouser (bottom)
- Flask API with modular services and typed helpers
- Unified streaming engine with soft-mock fallback
- ML column classification with LinearSVC + TF-IDF
- Pytest suite with unit, service, and E2E coverage
- Hot-reload friendly development with 75%+ test coverage

## Project Layout

```
BOM-CHECKER/
├── backend/
│   ├── app/
│   │   ├── core/            # config & logging
│   │   ├── services/        # excel_service, prediction_service, digikey_service, mouser_service, …
│   │   ├── utils/           # model_compat, sanitize, …
│   │   ├── uploads/         # temp Excel files
│   │   ├── tokens/          # cached API tokens
│   │   └── main.py          # Flask entry-point
│   └── requirements.txt     # runtime deps
├── frontend/                # static assets
│   ├── index.html
│   ├── style.css
│   └── main.js
├── tests/                   # pytest suite (unit + E2E)
├── requirements-dev.txt     # pytest, faker, requests-mock, coverage, …
├── pytest.ini
└── README.md
```

## Setup Instructions

### Prerequisites

- Python 3.8+ (3.10+ recommended)
- Node.js (optional — only if you prefer npm serve)

### Backend Setup

1. Create & activate virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate   # Windows: .venv\Scripts\activate
   ```
2. Install dependencies:
   ```bash
   pip install -r backend/app/requirements.txt
   pip install -r requirements-dev.txt
   ```
3. Set up API credentials (optional for real API calls):
   ```bash
   export DIGIKEY_CLIENT_ID=xxx
   export DIGIKEY_CLIENT_SECRET=yyy
   export MOUSER_API_KEY=zzz
   ```
   If unset, the services return mock data so you can work offline.

### Running the Application

1. Start the backend server:

   ```bash
   python backend/app/main.py
   ```

   The Flask API will be live at `http://localhost:5000`

2. Enable SSL locally:

   ```bash
   USE_SSL=true SSL_CERT=cert.pem SSL_KEY=key.pem python backend/app/main.py
   ```

3. Serve the frontend files:

   ```bash
   cd frontend
   python -m http.server 8000
   ```

4. Open your browser to `http://localhost:8000`

## Running Tests ✅

- Run all tests:
  ```bash
  pytest
  ```
- Run unit and service tests only:
  ```bash
  pytest -m "not e2e"
  ```
- Run end-to-end (E2E) tests:
  ```bash
  pytest -m e2e
  ```
- Run with quiet output:
  ```bash
  pytest -q
  ```

## Developer Notes

- **Streaming**: Digi-Key and Mouser results are streamed as NDJSON via `/api/stream-*` endpoints.
- **Mocking**: When API keys are missing, mocked data is returned for safe local testing.
- **Test config**: `tests/conftest.py` injects `backend/app/` into PYTHONPATH so you don't need packaging.
- **Uploads**: Excel files are stored in `backend/app/uploads/` and are temporary.
- **Tokens**: OAuth tokens are cached in `backend/app/tokens/`.
