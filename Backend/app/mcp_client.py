"""Client bridge between the FastAPI chat agent and the task MCP server."""

from contextlib import asynccontextmanager
from copy import deepcopy
from typing import AsyncIterator
from uuid import UUID

from mcp.server.fastmcp.exceptions import ToolError

from app.ai_tools import ToolResult
from MCP_Server.server import mcp


class TaskMCPClient:
    def __init__(self, owner_id: UUID):
        self.owner_id = owner_id

    async def openai_tools(self) -> list[dict]:
        registered_tools = await mcp.list_tools()
        tools = []
        for tool in registered_tools:
            schema = deepcopy(tool.inputSchema)
            schema.get("properties", {}).pop("owner_id", None)
            schema["required"] = [name for name in schema.get("required", []) if name != "owner_id"]
            tools.append({"type": "function", "function": {"name": tool.name, "description": tool.description or "", "parameters": schema}})
        return tools

    async def call(self, name: str, arguments: dict) -> ToolResult:
        # Auth context is injected here and is never exposed to the model.
        try:
            payload = await mcp._tool_manager.call_tool(
                name,
                {**arguments, "owner_id": str(self.owner_id)},
                convert_result=False,
            )
        except ToolError as error:
            return ToolResult(f"The task tool could not complete that request: {error}")
        return ToolResult(message=payload["message"], action_taken=payload.get("action_taken", False), redirect_url=payload.get("redirect_url"))


@asynccontextmanager
async def task_mcp_client(owner_id: UUID) -> AsyncIterator[TaskMCPClient]:
    yield TaskMCPClient(owner_id)

            
