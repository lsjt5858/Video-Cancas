from uuid import UUID

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    type: str = "short_drama"
    style: str | None = "realistic_cinematic"
    aspect_ratio: str = "16:9"
    target_duration: int | None = 60


class ProjectRead(BaseModel):
    id: UUID
    name: str
    type: str
    style: str | None
    aspect_ratio: str
    target_duration: int | None
    status: str
