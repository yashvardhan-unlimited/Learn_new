"""Environment-based application configuration.

Secrets stay in Backend/.env and are never committed to source control.
"""

import os
import json
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


def _google_oauth_client() -> tuple[str, str]:
    """Load a Google OAuth client file without copying secrets into source or .env."""
    credentials_path = Path(
        os.getenv(
            "GOOGLE_CREDENTIALS_FILE",
            Path(__file__).resolve().parent.parent / "credentials.json",
        )
    ).resolve()
    if not credentials_path.is_file():
        return "", ""
    try:
        payload = json.loads(credentials_path.read_text(encoding="utf-8"))
        client = payload.get("web") or payload.get("installed") or {}
        return client.get("client_id", ""), client.get("client_secret", "")
    except (OSError, json.JSONDecodeError, TypeError):
        return "", ""


_google_client_id, _google_client_secret = _google_oauth_client()


def _required_environment_value(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"Set {name} in Backend/.env before starting the API.")
    return value


@dataclass(frozen=True)
class Settings:
    mongo_uri: str = os.getenv("MONGO_URI", "mongodb://localhost:27017/task_ai")
    jwt_secret_key: str = _required_environment_value("JWT_SECRET_KEY")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    upload_directory: Path = Path(
        os.getenv("UPLOAD_DIRECTORY", Path(__file__).resolve().parent.parent / "uploads")
    ).resolve()
    max_attachment_bytes: int = int(os.getenv("MAX_ATTACHMENT_BYTES", str(10 * 1024 * 1024)))
    frontend_origins: tuple[str, ...] = tuple(
        origin.strip()
        for origin in os.getenv(
            "FRONTEND_ORIGINS",
            "http://localhost:5173,https://learn-new-ecru.vercel.app",
        ).split(",")
        if origin.strip()
    )
    mcp_server_url: str = os.getenv("MCP_SERVER_URL", "http://127.0.0.1:8001/mcp")
    backend_public_url: str = os.getenv("BACKEND_PUBLIC_URL", "http://127.0.0.1:8000")
    frontend_app_url: str = os.getenv("FRONTEND_APP_URL", "http://localhost:5173")
    google_redirect_uri: str = os.getenv("GOOGLE_REDIRECT_URI", "http://127.0.0.1:8000/google/callback")
    default_timezone: str = os.getenv("DEFAULT_TIMEZONE", "Asia/Kolkata")
    google_client_id: str = os.getenv("GOOGLE_CLIENT_ID", _google_client_id)
    google_client_secret: str = os.getenv("GOOGLE_CLIENT_SECRET", _google_client_secret)
    google_refresh_token: str = os.getenv("GOOGLE_REFRESH_TOKEN", "")


settings = Settings()
