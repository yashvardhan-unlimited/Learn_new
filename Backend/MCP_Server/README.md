# Task AI MCP server

This stdio MCP server exposes the task chatbot operations:

- `create_task`
- `delete_task`
- `update_task`
- `list_tasks`
- `summarize_tasks`
- `execute_task`

FastAPI imports this FastMCP registry and invokes its validated tools in-process.
The deployment uses one Python process and exposes no MCP network port. The backend
injects the authenticated `owner_id`, so the language model cannot select another
user's task scope. Running `server.py` directly still exposes the same registry over
stdio for local MCP inspection.

To inspect the server with MCP Inspector:

```powershell
uv run mcp dev MCP_Server/server.py
```

The server loads MongoDB and application configuration from `Backend/.env`.
