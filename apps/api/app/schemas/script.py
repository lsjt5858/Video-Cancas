from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class ScriptUpsert(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    content: str = Field(min_length=1)


class ScriptRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    title: str | None
    content: str
    analysis: dict | None
    version: int
