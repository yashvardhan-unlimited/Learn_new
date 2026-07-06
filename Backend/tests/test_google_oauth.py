"""Google OAuth state and route registration tests."""

from uuid import uuid4

from app.main import app
from app.security import create_google_oauth_state, decode_google_oauth_state, decode_google_oauth_state_details
from app.services.google_workspace import CALENDAR_SCOPE


def test_google_oauth_state_is_bound_to_user() -> None:
    owner_id = uuid4()

    state = create_google_oauth_state(owner_id, [CALENDAR_SCOPE], "add_task_reminder", str(owner_id))

    assert decode_google_oauth_state(state) == owner_id
    details = decode_google_oauth_state_details(state)
    assert details["scopes"] == [CALENDAR_SCOPE]
    assert details["action"] == "add_task_reminder"


def test_google_oauth_routes_are_registered() -> None:
    paths = app.openapi()["paths"]

    assert "/google/connect" in paths
    assert "/google/callback" in paths
