"""Environment-based application configuration.

Secrets stay in Backend/.env and are never committed to source control.
"""

import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


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
        for origin in os.getenv("FRONTEND_ORIGINS", "http://localhost:5173").split(",")
        if origin.strip()
    )


settings = Settings()
