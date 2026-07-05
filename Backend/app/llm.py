# os reads configuration values from environment variables.
import os
# OpenAI is the official Python client used to request the task summary.
from openai import OpenAI
# load_dotenv loads variables from a local .env file during development.
from dotenv import load_dotenv

# Load .env before creating the client so OPENAI_API_KEY is available.
load_dotenv()

# The client automatically reads OPENAI_API_KEY from the environment.
client = OpenAI()
# Allow the model to be changed in .env while keeping a sensible default.
MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


def build_summary_prompt(tasks: list[dict]) -> str:
    """Turn the task list into instructions that the AI model can follow."""
    # The f-string inserts the supplied task dictionaries after "Tasks:".
    return f"""You are a precise productivity analyst.

Analyze the task data and return a concise, actionable summary. Base every statement only on the
provided tasks; do not invent deadlines, priorities, progress, or dependencies.

Include:
1. A one- or two-sentence overview of workload and completion status.
2. The most urgent open tasks, ranked using explicit priority and due-date data. Explain briefly
   why each is urgent. If those fields are absent, say that urgency cannot be determined reliably.
3. Overdue or upcoming deadlines, when present.
4. A compact completed-work summary.
5. One concrete recommended next action.

Avoid repeating every task, generic encouragement, and unnecessary headings. Use exact task names
and dates when available.

Tasks:
{tasks}
"""


def stream_task_summary(tasks: list[dict]):
    """Yield summary text pieces as OpenAI generates them."""
    prompt = build_summary_prompt(tasks)

    # stream=True makes the API return events progressively instead of waiting
    # for the entire response to finish.
    stream = client.responses.create(
        model=MODEL,
        input=prompt,
        stream=True,
    )

    # Each event represents one update from the streaming OpenAI response.
    for event in stream:
        # Only text delta events contain the next displayable piece of text.
        if event.type == "response.output_text.delta":
            # yield pauses this generator and hands one chunk to StreamingResponse.
            yield event.delta
