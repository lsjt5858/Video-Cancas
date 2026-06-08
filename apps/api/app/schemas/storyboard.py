from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class SceneCreate(BaseModel):
    scene_number: int = Field(ge=1)
    description: str = Field(min_length=1)
    location: str | None = Field(default=None, max_length=255)
    time_of_day: str | None = Field(default=None, max_length=100)
    characters: list[str] = Field(default_factory=list)


class SceneRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    scene_number: int
    description: str
    location: str | None
    time_of_day: str | None
    characters: list[str]


class SceneUpdate(BaseModel):
    scene_number: int | None = Field(default=None, ge=1)
    description: str | None = Field(default=None, min_length=1)
    location: str | None = Field(default=None, max_length=255)
    time_of_day: str | None = Field(default=None, max_length=100)
    characters: list[str] | None = None


class ShotCreate(BaseModel):
    scene_id: UUID
    shot_number: int = Field(ge=1)
    description: str = Field(min_length=1)
    shot_type: str = Field(min_length=1, max_length=50)
    camera_movement: str = Field(min_length=1, max_length=50)
    duration: int = Field(ge=1)
    dialogue: str | None = None
    prompt: str = Field(min_length=1)
    image_url: str | None = None
    video_url: str | None = None
    position: dict | None = None


class ShotUpdate(BaseModel):
    scene_id: UUID | None = None
    shot_number: int | None = Field(default=None, ge=1)
    description: str | None = Field(default=None, min_length=1)
    shot_type: str | None = Field(default=None, min_length=1, max_length=50)
    camera_movement: str | None = Field(default=None, min_length=1, max_length=50)
    duration: int | None = Field(default=None, ge=1)
    dialogue: str | None = None
    prompt: str | None = Field(default=None, min_length=1)
    image_url: str | None = None
    video_url: str | None = None
    position: dict | None = None


class ShotRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    scene_id: UUID
    shot_number: int
    description: str
    shot_type: str
    camera_movement: str
    duration: int
    dialogue: str | None
    prompt: str
    image_url: str | None
    video_url: str | None
    position: dict | None
