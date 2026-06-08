from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.script import Script
from app.schemas.project import ProjectCreate, ProjectRead
from app.schemas.script import ScriptRead, ScriptUpsert

router = APIRouter()


@router.get("", response_model=list[ProjectRead])
def list_projects(db: Session = Depends(get_db)) -> list[Project]:
    return list(db.scalars(select(Project).order_by(Project.created_at.desc(), Project.id.desc())))


@router.post("", response_model=ProjectRead, status_code=201)
def create_project(payload: ProjectCreate, db: Session = Depends(get_db)) -> Project:
    project = Project(
        name=payload.name,
        type=payload.type,
        style=payload.style,
        aspect_ratio=payload.aspect_ratio,
        target_duration=payload.target_duration,
        status="draft",
    )
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


@router.get("/{project_id}", response_model=ProjectRead)
def get_project(project_id: UUID, db: Session = Depends(get_db)) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.get("/{project_id}/script", response_model=ScriptRead)
def get_project_script(project_id: UUID, db: Session = Depends(get_db)) -> Script:
    ensure_project_exists(project_id, db)
    script = db.scalar(select(Script).where(Script.project_id == project_id))
    if script is None:
        raise HTTPException(status_code=404, detail="Script not found")
    return script


@router.put("/{project_id}/script", response_model=ScriptRead)
def upsert_project_script(
    project_id: UUID,
    payload: ScriptUpsert,
    db: Session = Depends(get_db),
) -> Script:
    ensure_project_exists(project_id, db)
    script = db.scalar(select(Script).where(Script.project_id == project_id))

    if script is None:
        script = Script(
            project_id=project_id,
            title=payload.title,
            content=payload.content,
            version=1,
        )
        db.add(script)
    else:
        script.title = payload.title
        script.content = payload.content
        script.version += 1

    db.commit()
    db.refresh(script)
    return script


def ensure_project_exists(project_id: UUID, db: Session) -> None:
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")
