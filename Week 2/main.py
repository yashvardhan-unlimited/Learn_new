from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class User(BaseModel):
    name: str
    age: int

@app.get("/")
def root():
    return {"message": "Hello, World!"}

users = [{"name": "Alice", "age": 30}, {"name": "Bob", "age": 25}]


@app.get("/users")
def get_users():
    return users

@app.post("/users")
def create_user(user: User):
    users.append(user)
    return user