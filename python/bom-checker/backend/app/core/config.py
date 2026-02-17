import os
from pathlib import Path

# Check if dotenv is available, and if so, load environment variables from .env file
try:
    from dotenv import load_dotenv
    # Look for .env file in project root (3 directories up from this file)
    env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
    if env_path.exists():
        print(f"Loading environment from: {env_path}")
        load_dotenv(dotenv_path=env_path)
    else:
        print(f"No .env file found at {env_path}")
except ImportError:
    print("python-dotenv not installed, skipping .env loading")

# Simple settings class without pydantic dependency
class Settings:
    """Application settings."""
    
    # App configuration
    APP_NAME = "BOM Checker"
    DEBUG = True
    
    # Paths - point directly to where the model is based on your folder structure
    BASE_DIR = Path(__file__).resolve().parent.parent.parent
    MODEL_PATH = BASE_DIR / "models" / "column_classifier_model.joblib"
    
    # File settings
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max upload
    
    # DigiKey API settings (from environment)
    DIGIKEY_CLIENT_ID = os.getenv("DIGIKEY_CLIENT_ID", "")
    DIGIKEY_CLIENT_SECRET = os.getenv("DIGIKEY_CLIENT_SECRET", "")
    DIGIKEY_SANDBOX_MODE = os.getenv("DIGIKEY_SANDBOX_MODE", "True").lower() == "true"
    
    # Mouser API settings (from environment)
    MOUSER_API_KEY = os.getenv("MOUSER_API_KEY", "")
    
    # Print DigiKey credentials status for debugging (without revealing secrets)
    @classmethod
    def debug_credentials(cls):
        has_client_id = bool(cls.DIGIKEY_CLIENT_ID)
        has_client_secret = bool(cls.DIGIKEY_CLIENT_SECRET)
        has_mouser_api_key = bool(cls.MOUSER_API_KEY)
        
        print(f"DigiKey Client ID loaded: {has_client_id}")
        print(f"DigiKey Client Secret loaded: {has_client_secret}")
        print(f"DigiKey Sandbox Mode: {cls.DIGIKEY_SANDBOX_MODE}")
        print(f"Mouser API Key loaded: {has_mouser_api_key}")

# Create global settings object
settings = Settings()

# Debug credentials loading
settings.debug_credentials()