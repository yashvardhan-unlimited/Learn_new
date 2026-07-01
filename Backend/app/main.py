from contextlib import asynccontextmanager

from fastapi import FastAPI
# CORS allows the React frontend (running on another port) to call this API.
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.database import ensure_indexes
from app.routes import attachments, auth, tasks


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Unique indexes enforce username and UUID integrity in MongoDB.
    ensure_indexes()
    yield

# Create the FastAPI application. The title appears in the automatic API docs.
app = FastAPI(title="Task AI API", lifespan=lifespan)

# In development, Vite serves the frontend from http://localhost:5173 while
# FastAPI normally runs on http://localhost:8000. Browsers require this CORS
# permission before JavaScript from the frontend can call the backend.
app.add_middleware(
    CORSMiddleware,
    # Only the local Vite frontend is allowed to make browser requests.
    allow_origins=list(settings.frontend_origins),
    # "*" permits GET, POST, PUT, DELETE, and other HTTP methods.
    allow_methods=["*"],
    # "*" permits headers such as Content-Type: application/json.
    allow_headers=["*"],
)

# Routers keep authentication, task, and attachment endpoints separate.
app.include_router(auth.router)
app.include_router(tasks.router)
app.include_router(attachments.router)


# A decorator tells FastAPI which URL and HTTP method use the function below.
@app.get("/")
def root():
    # Returning a dictionary makes FastAPI send a JSON response.
    return {"message": "Task AI API is running"}
