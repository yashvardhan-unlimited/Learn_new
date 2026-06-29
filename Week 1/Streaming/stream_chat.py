from openai import OpenAI
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# Initialize OpenAI client
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# Store conversation history
messages = [
    {
        "role": "system",
        "content": "You are a helpful AI assistant."
    }
]

print("=" * 60)
print("OpenAI Streaming Chat CLI")
print("Type 'exit' or 'quit' to stop.")
print("=" * 60)

while True:
    user_input = input("\nYou: ")

    # Exit condition
    if user_input.lower() in ["exit", "quit"]:
        print("\nGoodbye!")
        break

    # Add user message
    messages.append({
        "role": "user",
        "content": user_input
    })

    print("\nAssistant: ", end="", flush=True)

    full_response = ""

    # Streaming response
    stream = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=messages,
        stream=True
    )

    # Print tokens as they arrive
    for chunk in stream:
        content = chunk.choices[0].delta.content

        if content:
            print(content, end="", flush=True)
            full_response += content

    print()

    # Save assistant response
    messages.append({
        "role": "assistant",
        "content": full_response
    })