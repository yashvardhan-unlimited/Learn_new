"""Task deadline validation and update semantics."""

from datetime import timezone

from app.models import TaskCreate, TaskUpdate
from app.ai_tools import _format_ist


def test_due_at_is_normalized_to_utc() -> None:
    task = TaskCreate(title="Submit report", due_at="2026-07-05T17:30:00+05:30")

    assert task.due_at is not None
    assert task.due_at.tzinfo == timezone.utc
    assert task.due_at.hour == 12


def test_due_at_can_be_explicitly_cleared() -> None:
    update = TaskUpdate(due_at=None)

    assert update.model_dump(exclude_unset=True) == {"due_at": None}


def test_deadline_output_is_formatted_in_ist() -> None:
    task = TaskCreate(title="Call", due_at="2026-07-05T12:00:00Z")

    assert _format_ist(task.due_at).endswith("05:30 PM IST")
