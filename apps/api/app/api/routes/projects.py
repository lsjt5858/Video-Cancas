from uuid import UUID, uuid4

from fastapi import APIRouter

from app.schemas.project import ProjectCreate, ProjectRead

router = APIRouter()


@router.get("", response_model=list[ProjectRead])
def list_projects() -> list[ProjectRead]:
    return []


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate) -> ProjectRead:
    return ProjectRead(
        id=uuid4(),
        name=payload.name,
        type=payload.type,
        style=payload.style,
        aspect_ratio=payload.aspect_ratio,
        target_duration=payload.target_duration,
        status="draft",
    )


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: UUID) -> ProjectRead:
    return ProjectRead(
        id=project_id,
        name="Demo Project",
        type="short_drama",
        style="realistic_cinematic",
        aspect_ratio="16:9",
        target_duration=60,
        status="draft",
    )
