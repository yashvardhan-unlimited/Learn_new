# Task AI Backend

FastAPI backend for authenticated task management, attachments, AI summaries, and
an MCP-backed task chat assistant.

## How to start the app
So It will be done in 3 steps, 
open 3 different terminals and run the below commands respectively in frontend and backend 
``` powershell
Frontend> npm run dev
Backend> uv run --no-sync uvicorn app.main:app --reload
Backend> uv run --no-sync python MCP_Server/server.py
```

## Structure

```text
Backend/
|-- app/
|   |-- main.py             # FastAPI application and router registration
|   |-- config.py           # Environment configuration
|   |-- database.py         # MongoDB client, collections, and indexes
|   |-- models.py           # Stored domain models
|   |-- schemas.py          # HTTP request/response models
|   |-- routes/             # HTTP-only endpoint definitions
|   |-- services/           # Business logic and external orchestration
|   `-- repositories/       # MongoDB persistence operations
|-- MCP_Server/
|   |-- server.py           # stdio MCP process entry point
|   `-- tools/              # MCP tool adapters
|-- tests/                  # Package and integration regression tests
|-- main.py                 # Compatibility application entry point
`-- pyproject.toml          # Canonical dependencies and project metadata
```

Dependencies flow from routes to services to repositories. MCP tools call the
same service functions as the HTTP application, so task behavior has one source
of truth.

## Setup

1. Copy `.env.example` to `.env` and set `JWT_SECRET_KEY`, `MONGO_URI`, and
   `OPENAI_API_KEY`.
2. Install dependencies with `uv sync` (recommended), or
   `python -m pip install -r requirements.txt`.
3. Start MongoDB.
4. In one terminal, start MCP with
   `uv run --no-sync python MCP_Server/server.py`.
5. In another terminal, start FastAPI with
   `uv run --no-sync uvicorn app.main:app --reload`.

The `--no-sync` option is recommended when the project is stored in OneDrive,
which can lock files while uv checks the environment. Run `uv sync` separately
after changing dependencies.
API documentation is available at `http://127.0.0.1:8000/docs`.
The MCP endpoint is `http://127.0.0.1:8001/mcp`; override it with
`MCP_SERVER_URL` when the services run on different hosts.

## Google Calendar and Gmail drafts

Create a Google OAuth web/desktop client, enable the Calendar and Gmail APIs,
and obtain a refresh token with these scopes:

- `https://www.googleapis.com/auth/calendar.events`
- `https://www.googleapis.com/auth/gmail.compose`

Place the downloaded OAuth client at `Backend/credentials.json` (or set
`GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` manually), then set
`GOOGLE_REFRESH_TOKEN` in `.env` and restart the backend. The assistant can create calendar events and
Gmail drafts; it has no Gmail sending scope. Web search needs no credentials.

For per-user authorization, register `http://127.0.0.1:8000/google/callback` as an
authorized redirect URI on the Google OAuth web client. When a user first requests a
Calendar event or Gmail draft, the assistant returns a connection link; Google redirects
back to this endpoint and the user's refresh token is stored with their account.

## Verification

Run the dependency-free regression tests with:

```powershell
uv run python -m unittest discover -s tests -v
```
