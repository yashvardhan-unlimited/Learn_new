from mcp.server.fastmcp import FastMCP

mcp = FastMCP("basic tools")

@mcp.tool()
def add(x: int, y: int) -> int:
    """Add two numbers."""
    return x + y

@mcp.tool()
def subtract(x: int, y: int) -> int:
    """Subtract two numbers."""
    return x - y

@mcp.tool()
def multiply(x: int, y: int) -> int:
    """Multiply two numbers."""
    return x * y

@mcp.tool()
def divide(x: int, y: int) -> float:    
    """Divide two numbers."""
    if y == 0:
        raise ValueError("Cannot divide by zero.")
    return x / y

if __name__ == "__main__":
    mcp.run()
