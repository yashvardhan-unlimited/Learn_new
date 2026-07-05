"""Task deadline validation and update semantics."""

from datetime import timezone

from app.models import TaskCreate, TaskUpdate


def test_due_at_is_normalized_to_utc() -> None:
    task = TaskCreate(title="Submit report", due_at="2026-07-05T17:30:00+05:30")

    assert task.due_at is not None
    assert task.due_at.tzinfo == timezone.utc
    assert task.due_at.hour == 12


def test_due_at_can_be_explicitly_cleared() -> None:
    update = TaskUpdate(due_at=None)

    assert update.model_dump(exclude_unset=True) == {"due_at": None}
