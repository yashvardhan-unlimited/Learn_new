"""MongoDB connection and shared database helpers."""

from fastapi import HTTPException
from pymongo import ASCENDING, MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

from app.config import settings


mongo_client = MongoClient(settings.mongo_uri, serverSelectionTimeoutMS=5000)
database = mongo_client.get_default_database(default="task_ai")
tasks_collection: Collection = database["tasks"]
users_collection: Collection = database["users"]


def ensure_indexes() -> None:
    """Create database constraints and query indexes during application startup."""
    _migrate_legacy_usernames()
    users_collection.create_index("username", unique=True)
    users_collection.create_index("id", unique=True)
    tasks_collection.create_index("id", unique=True)
    tasks_collection.create_index([("owner_id", ASCENDING), ("created_at", ASCENDING)])


def _migrate_legacy_usernames() -> None:
    """Copy old email-based user identifiers into the new username field."""
    legacy_users = users_collection.find(
        {"username": {"$exists": False}, "email": {"$type": "string"}},
        {"_id": 0, "id": 1, "email": 1},
    )
    for legacy_user in legacy_users:
        username = legacy_user["email"].strip().lower()
        users_collection.update_one(
            {"id": legacy_user["id"], "username": {"$exists": False}},
            {"$set": {"username": username}},
        )


def database_unavailable(error: PyMongoError) -> HTTPException:
    """Convert low-level Mongo errors into a safe API response."""
    return HTTPException(
        status_code=503,
        detail="Local MongoDB is unavailable. Make sure the MongoDB service is running.",
    )
