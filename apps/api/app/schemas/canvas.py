from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class CanvasPosition(BaseModel):
    x: float
    y: float


class CanvasSize(BaseModel):
    width: float = Field(default=320, gt=0)
    height: float = Field(default=180, gt=0)


class CanvasNodeCreate(BaseModel):
    node_type: str = Field(min_length=1, max_length=50)
    title: str | None = Field(default=None, max_length=255)
    position: CanvasPosition = Field(default_factory=lambda: CanvasPosition(x=0, y=0))
    size: CanvasSize = Field(default_factory=CanvasSize)
    ref_type: str | None = Field(default=None, max_length=50)
    ref_id: UUID | None = None
    data: dict = Field(default_factory=dict)


class CanvasNodeUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=255)
    position: CanvasPosition | None = None
    size: CanvasSize | None = None
    data: dict | None = None


class CanvasNodeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    node_type: str
    title: str | None
    position: CanvasPosition
    size: CanvasSize
    ref_type: str | None
    ref_id: UUID | None
    data: dict


class CanvasEdgeCreate(BaseModel):
    source_node_id: UUID
    target_node_id: UUID
    relation_type: str = Field(min_length=1, max_length=50)
    data: dict = Field(default_factory=dict)


class CanvasEdgeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    project_id: UUID
    source_node_id: UUID
    target_node_id: UUID
    relation_type: str
    data: dict
