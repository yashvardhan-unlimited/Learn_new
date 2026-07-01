"""Task-summary streaming business logic."""

from uuid import UUID

from fastapi.responses import StreamingResponse

from app.llm import stream_task_summary
from app.repositories.tasks import list_tasks


def stream_user_task_summary(owner_id: UUID) -> StreamingResponse:
    tasks = list_tasks(owner_id)
    stream = (
        stream_task_summary([task.model_dump(mode="json") for task in tasks])
        if tasks
        else iter(["No tasks found to summarize."])
    )
    return StreamingResponse(stream, media_type="text/plain")
