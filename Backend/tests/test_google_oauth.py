"""Google OAuth state and route registration tests."""

from uuid import uuid4

from app.main import app
from app.security import create_google_oauth_state, decode_google_oauth_state


def test_google_oauth_state_is_bound_to_user() -> None:
    owner_id = uuid4()

    assert decode_google_oauth_state(create_google_oauth_state(owner_id)) == owner_id


def test_google_oauth_routes_are_registered() -> None:
    paths = app.openapi()["paths"]

    assert "/google/connect" in paths
    assert "/google/callback" in paths
