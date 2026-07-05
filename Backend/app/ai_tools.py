"""Safe task operations exposed to the AI chat agent."""

from dataclasses import asdict, dataclass
from uuid import UUID

from app.models import Task, TaskCreate, TaskUpdate
from app.repositories.tasks import find_task, insert_task, list_tasks, update_task
from app.services.attachments import delete_task_and_files


@dataclass
class ToolResult:
    message: str
    action_taken: bool = False
    redirect_url: str | None = None

    def as_dict(self) -> dict:
        return asdict(self)


def create_task_tool(
    owner_id: UUID,
    title: str,
    description: str = "",
    priority: str = "medium",
    status: str = "pending",
    due_at: str | None = None,
) -> ToolResult:
    task = insert_task(
        TaskCreate(title=title, description=description, priority=priority, status=status, due_at=due_at),
        owner_id,
    )
    deadline = f" Due {task.due_at.isoformat()}." if task.due_at else ""
    return ToolResult(f'Created a {task.priority}-priority task: {task.title}.{deadline}', True)


def delete_task_tool(owner_id: UUID, task_query: str) -> ToolResult:
    task, error = _single_matching_task(owner_id, task_query)
    if error:
        return ToolResult(error)
    delete_task_and_files(task.id, owner_id)
    return ToolResult(f'Deleted the task "{task.title}".', True)


def update_task_tool(
    owner_id: UUID,
    task_query: str,
    status: str | None = None,
    priority: str | None = None,
    due_at: str | None = None,
    clear_due_at: bool = False,
) -> ToolResult:
    task, error = _single_matching_task(owner_id, task_query)
    if error:
        return ToolResult(error)
    if status is None and priority is None and due_at is None and not clear_due_at:
        return ToolResult("Please specify the status, priority, or due date/time to update.")
    update_values: dict = {}
    if status is not None:
        update_values["status"] = status
    if priority is not None:
        update_values["priority"] = priority
    if due_at is not None or clear_due_at:
        update_values["due_at"] = None if clear_due_at else due_at
    update_data = TaskUpdate(**update_values)
    updated = update_task(task.id, update_data, owner_id)
    changes = []
    if status is not None:
        changes.append(f"status to {updated.status.replace('_', ' ')}")
    if priority is not None:
        changes.append(f"priority to {updated.priority}")
    if clear_due_at:
        changes.append("due date removed")
    elif due_at is not None:
        changes.append(f"due date to {updated.due_at.isoformat()}")
    return ToolResult(f'Updated "{updated.title}": set {" and ".join(changes)}.', True)


def list_tasks_tool(owner_id: UUID) -> ToolResult:
    tasks = list_tasks(owner_id)
    if not tasks:
        return ToolResult("You have no tasks.")
    lines = [
        f'- {task.title} ({task.priority}, {task.status.replace("_", " ")}'
        f'{f", due {task.due_at.isoformat()}" if task.due_at else ""})'
        for task in tasks
    ]
    return ToolResult("Your tasks are:\n" + "\n".join(lines))


def summarize_tasks_tool(owner_id: UUID) -> ToolResult:
    tasks = list_tasks(owner_id)
    if not tasks:
        return ToolResult("You have no tasks to summarize.")
    counts = {status: sum(task.status == status for task in tasks) for status in ("pending", "in_progress", "completed")}
    open_tasks = [task for task in tasks if task.status != "completed"]
    dated_tasks = sorted((task for task in open_tasks if task.due_at), key=lambda task: task.due_at)
    urgent = dated_tasks[0] if dated_tasks else next((task for task in open_tasks if task.priority == "high"), None)
    summary = (
        f"""You currently have {len(tasks)} in total tasks: {counts['pending']} pending, 
        {counts['in_progress']} in progress, and {counts['completed']} completed."""
    )
    if urgent:
        due = f", due {urgent.due_at.isoformat()}" if urgent.due_at else ""
        summary += f' The most urgent open task is "{urgent.title}"{due}.'
    return ToolResult(summary)


def execute_task_tool(owner_id: UUID, task_query: str) -> ToolResult:
    task, error = _single_matching_task(owner_id, task_query)
    if error:
        return ToolResult(error)
    return execute_task(str(task.id), owner_id)


def execute_task(task_id: str, owner_id: UUID) -> ToolResult:
    """Dispatch supported task types without performing irreversible actions."""
    task = find_task(UUID(task_id), owner_id)
    searchable = f"{task.title} {task.description}".lower()
    if "email" in searchable or "mail" in searchable:
        return draft_mail_tool(task)
    return ToolResult(f'Execution is not available yet for the task "{task.title}."')


def draft_mail_tool(task: Task) -> ToolResult:
    # This deliberately prepares no external message and never sends email.
    return ToolResult("I prepared an email draft using the draft_mail tool placeholder.", True)


def _single_matching_task(owner_id: UUID, query: str) -> tuple[Task | None, str | None]:
    query = query.strip().lower()
    if not query:
        return None, "Please specify which task you mean."
    tasks = list_tasks(owner_id)
    try:
        task_id = UUID(query)
        matches = [task for task in tasks if task.id == task_id]
    except ValueError:
        # Prefer phrase matches; token matching handles requests such as "the JWT task".
        phrase_matches = [task for task in tasks if query in f"{task.title} {task.description}".lower()]
        words = {word for word in query.split() if len(word) > 2 and word not in {"the", "task", "about"}}
        matches = phrase_matches or [
            task for task in tasks
            if words and words.issubset(set(f"{task.title} {task.description}".lower().split()))
        ]
    if not matches:
        return None, f'I could not find a task matching "{query}."'
    if len(matches) > 1:
        names = ", ".join(f'"{task.title}"' for task in matches)
        return None, f"Multiple tasks match: {names}. Which one do you mean?"
    return matches[0], None
