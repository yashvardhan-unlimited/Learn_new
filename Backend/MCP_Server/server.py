"""Streamable HTTP MCP server exposing the task application's safe AI tools."""

import os
import sys
from pathlib import Path

from mcp.server.fastmcp import FastMCP
from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PROJECT_ROOT))
load_dotenv(PROJECT_ROOT / ".env")

from MCP_Server.tools import register_productivity_tools, register_task_tools  # noqa: E402

mcp = FastMCP(
    "Task AI tools",
    host=os.getenv("MCP_SERVER_HOST", "127.0.0.1"),
    port=int(os.getenv("MCP_SERVER_PORT", "8001")),
    streamable_http_path="/mcp",
    stateless_http=True,
)
register_task_tools(mcp)
register_productivity_tools(mcp)


if __name__ == "__main__":
    mcp.run(transport="streamable-http")
