import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env if present
load_dotenv()

# Base directories
BASE_DIR = Path(os.environ.get("SUNOPO_BASE_DIR", Path(__file__).parent.resolve()))
EXPORTS_DIR = Path(os.environ.get("SUNOPO_EXPORTS_DIR", BASE_DIR / "exports"))
REPORTS_DIR = Path(os.environ.get("SUNOPO_REPORTS_DIR", BASE_DIR / "reports"))

# Session file path (sensitive)
SESSION_ID_PATH = Path(
    os.environ.get(
        "SUNO_SESSION_ID_PATH", "/Users/blackmamba/suno_downloader/suno_session.txt"
    )
)

# Flask settings
FLASK_HOST = os.environ.get("FLASK_HOST", "0.0.0.0")
FLASK_PORT = int(os.environ.get("FLASK_PORT", "5555"))

# S3 / storage settings
USE_S3 = os.environ.get("SUNOPO_USE_S3", "false").lower() in ("1", "true", "yes")
S3_BUCKET = os.environ.get("SUNOPO_S3_BUCKET")
AWS_REGION = os.environ.get("AWS_REGION", "us-east-1")

# Redis / session settings
REDIS_URL = os.environ.get("REDIS_URL", "redis://localhost:6379/0")
SESSION_TTL_SECONDS = int(os.environ.get("SESSION_TTL_SECONDS", "86400"))  # default 24h
SESSION_FERNET_KEY = os.environ.get("SESSION_FERNET_KEY")  # base64 key for Fernet

# Ensure directories exist
def ensure_dirs():
    EXPORTS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)


# Helper to read session id safely
def read_session_id():
    try:
        return SESSION_ID_PATH.read_text().strip()
    except Exception:
        return None
