 
from fastapi import FastAPI
from fastapi.responses import StreamingResponse

from app.models import Task, TaskCreate
from app.storage import create_task, load_tasks, delete_task
from app.llm import stream_task_summary

app = FastAPI(title="Task AI API")


@app.get("/")
def root():
    return {"message": "Task AI API is running"}


@app.post("/tasks", response_model=Task)
def add_task(task: TaskCreate):
    return create_task(task)


@app.get("/tasks", response_model=list[Task])
def list_tasks():
    return load_tasks()

@app.get("/tasks/{task_id}")
def get_task(task_id: int):
    tasks = load_tasks()
    for id, task in enumerate(tasks):
        if id == task_id - 1:
            return task
    return {"message": "Task not found."}

@app.delete("/tasks/{task_id}")
def delete(task_id: int):
    if delete_task(task_id):
        return {"message": "Task deleted successfully."}
    return {"message": "Task not found."}

@app.post("/tasks/summarize")
def summarize_tasks():
    tasks = load_tasks()

    if not tasks:
        return {"message": "No tasks found to summarize."}

    task_dicts = [task.model_dump(mode="json") for task in tasks]

    return StreamingResponse(
        stream_task_summary(task_dicts),
        media_type="text/plain",
    )