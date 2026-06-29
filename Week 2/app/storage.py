import json
from pathlib import Path
from app.models import Task, TaskCreate

DATA_FILE = Path("tasks.json")


def load_tasks() -> list[Task]:
    if not DATA_FILE.exists():
        return []

    try:
        with open(DATA_FILE, "r", encoding="utf-8") as file:
            data = json.load(file)

        return [Task(**item) for item in data]
    except json.JSONDecodeError:
        # Handles 0-byte or corrupted files safely
        return []


def save_tasks(tasks: list[Task]) -> None:
    with open(DATA_FILE, "w", encoding="utf-8") as file:
        json.dump(
            [task.model_dump(mode="json") for task in tasks],
            file,
            indent=2,
        )


def create_task(task_data: TaskCreate) -> Task:
    tasks = load_tasks()
    task = Task(**task_data.model_dump())
    tasks.append(task)
    save_tasks(tasks)
    return task

def delete_task(task_id: int) -> bool:
    tasks = load_tasks()
    for id, task in enumerate(tasks):
        if id == task_id - 1:
            tasks.pop(id)
            save_tasks(tasks)
            return True
    return False