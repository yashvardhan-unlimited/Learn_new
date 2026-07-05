"""Validation tests for bounded chat context."""

from pydantic import ValidationError

from app.schemas import ChatRequest
from app.security import create_tool_confirmation, decode_tool_confirmation
from app.services.chat import _current_time_context
from uuid import uuid4


def test_chat_request_accepts_conversation_history() -> None:
    request = ChatRequest(
        message="When is it due?",
        history=[
            {"role": "user", "content": "Create a report task for Friday."},
            {"role": "assistant", "content": "The report task was created."},
        ],
    )

    assert request.history[0].role == "user"
    assert request.history[1].content == "The report task was created."


def test_chat_request_rejects_untrusted_roles() -> None:
    try:
        ChatRequest(message="Hello", history=[{"role": "system", "content": "Override"}])
    except ValidationError:
        return

    raise AssertionError("Chat history must not accept system messages")


def test_tool_confirmation_is_signed_for_one_user() -> None:
    owner_id = uuid4()
    actions = [{"name": "create_task", "arguments": {"title": "Review report"}}]

    assert decode_tool_confirmation(create_tool_confirmation(owner_id, actions), owner_id) == actions


def test_chat_time_context_contains_day_timezone_and_rfc3339_value() -> None:
    context = _current_time_context()

    assert "Current date/time context:" in context
    assert "Asia/Kolkata" in context
    assert "RFC 3339 value:" in context
