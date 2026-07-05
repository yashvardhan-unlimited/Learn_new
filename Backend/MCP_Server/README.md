# Task AI MCP server

This Streamable HTTP MCP server exposes the task chatbot operations:

- `create_task`
- `delete_task`
- `update_task`
- `list_tasks`
- `summarize_tasks`
- `execute_task`

Run the server independently from the `Backend` directory:

```powershell
uv run --no-sync python MCP_Server/server.py
```

It listens on `http://127.0.0.1:8001/mcp` by default. FastAPI connects to the
`MCP_SERVER_URL` configured in `Backend/.env`. The backend injects the authenticated
`owner_id`, so the language model cannot select another user's task scope.

To inspect the server with MCP Inspector:

```powershell
uv run mcp dev MCP_Server/server.py
```

The server loads MongoDB and application configuration from `Backend/.env`.
