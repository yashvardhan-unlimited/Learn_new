# Task AI MCP server

This stdio MCP server exposes the task chatbot operations:

- `create_task`
- `delete_task`
- `update_task`
- `list_tasks`
- `summarize_tasks`
- `execute_task`

FastAPI starts this server automatically as a subprocess for each chat request.
It communicates over stdin/stdout and does not expose a network port. The backend
injects the authenticated `owner_id`, so the language model cannot select another
user's task scope.

To inspect the server with MCP Inspector:

```powershell
uv run mcp dev MCP_Server/server.py
```

The server loads MongoDB and application configuration from `Backend/.env`.
