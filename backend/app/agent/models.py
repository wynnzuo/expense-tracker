from typing import Literal

from pydantic import BaseModel


SourceType = Literal["text", "voice"]


class AgentRequest(BaseModel):
    input: str
    source: SourceType = "text"
    conversationId: str = ""


class ResumeRequest(BaseModel):
    threadId: str
    source: SourceType = "text"
    conversationId: str = ""
    input: str = ""
