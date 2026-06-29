from typing import List
from pydantic import BaseModel
from datetime import date

class ActionItem(BaseModel):
    task: str
    owner: str
    deadline: date
    priority: str


class MeetingOutput(BaseModel):
    summary: str
    action_items: List[ActionItem]
    decisions: List[str]
    open_questions: List[str]