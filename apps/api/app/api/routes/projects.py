from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.project import Project
from app.models.script import Script
from app.models.storyboard import Scene, Shot
from app.schemas.project import ProjectCreate, ProjectRead
from app.schemas.script import ScriptRead, ScriptUpsert
from app.schemas.storyboard import (
    SceneCreate,
    SceneRead,
    SceneUpdate,
    ShotCreate,
    ShotRead,
    ShotUpdate,
)

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


@router.get("/{project_id}/scenes", response_model=list[SceneRead])
def list_project_scenes(project_id: UUID, db: Session = Depends(get_db)) -> list[Scene]:
    ensure_project_exists(project_id, db)
    return list(
        db.scalars(
            select(Scene)
            .where(Scene.project_id == project_id)
            .order_by(Scene.scene_number.asc(), Scene.id.asc())
        )
    )


@router.post("/{project_id}/scenes", response_model=SceneRead, status_code=201)
def create_project_scene(
    project_id: UUID,
    payload: SceneCreate,
    db: Session = Depends(get_db),
) -> Scene:
    ensure_project_exists(project_id, db)
    scene = Scene(project_id=project_id, **payload.model_dump())
    db.add(scene)
    db.commit()
    db.refresh(scene)
    return scene


@router.patch("/{project_id}/scenes/{scene_id}", response_model=SceneRead)
def update_project_scene(
    project_id: UUID,
    scene_id: UUID,
    payload: SceneUpdate,
    db: Session = Depends(get_db),
) -> Scene:
    ensure_project_exists(project_id, db)
    scene = get_project_scene_or_404(project_id, scene_id, db)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(scene, field, value)

    db.commit()
    db.refresh(scene)
    return scene


@router.delete("/{project_id}/scenes/{scene_id}", status_code=204)
def delete_project_scene(
    project_id: UUID,
    scene_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    ensure_project_exists(project_id, db)
    scene = get_project_scene_or_404(project_id, scene_id, db)
    db.delete(scene)
    db.commit()


@router.get("/{project_id}/shots", response_model=list[ShotRead])
def list_project_shots(project_id: UUID, db: Session = Depends(get_db)) -> list[Shot]:
    ensure_project_exists(project_id, db)
    return list(
        db.scalars(
            select(Shot)
            .where(Shot.project_id == project_id)
            .order_by(Shot.shot_number.asc(), Shot.id.asc())
        )
    )


@router.post("/{project_id}/shots", response_model=ShotRead, status_code=201)
def create_project_shot(
    project_id: UUID,
    payload: ShotCreate,
    db: Session = Depends(get_db),
) -> Shot:
    ensure_project_exists(project_id, db)
    ensure_scene_belongs_to_project(payload.scene_id, project_id, db)
    shot = Shot(project_id=project_id, **payload.model_dump())
    db.add(shot)
    db.commit()
    db.refresh(shot)
    return shot


@router.patch("/{project_id}/shots/{shot_id}", response_model=ShotRead)
def update_project_shot(
    project_id: UUID,
    shot_id: UUID,
    payload: ShotUpdate,
    db: Session = Depends(get_db),
) -> Shot:
    ensure_project_exists(project_id, db)
    shot = get_project_shot_or_404(project_id, shot_id, db)
    updates = payload.model_dump(exclude_unset=True)

    if "scene_id" in updates:
        ensure_scene_belongs_to_project(updates["scene_id"], project_id, db)

    for field, value in updates.items():
        setattr(shot, field, value)

    db.commit()
    db.refresh(shot)
    return shot


@router.delete("/{project_id}/shots/{shot_id}", status_code=204)
def delete_project_shot(
    project_id: UUID,
    shot_id: UUID,
    db: Session = Depends(get_db),
) -> None:
    ensure_project_exists(project_id, db)
    shot = get_project_shot_or_404(project_id, shot_id, db)
    db.delete(shot)
    db.commit()


def ensure_project_exists(project_id: UUID, db: Session) -> None:
    if db.get(Project, project_id) is None:
        raise HTTPException(status_code=404, detail="Project not found")


def ensure_scene_belongs_to_project(scene_id: UUID, project_id: UUID, db: Session) -> None:
    get_project_scene_or_404(project_id, scene_id, db)


def get_project_scene_or_404(project_id: UUID, scene_id: UUID, db: Session) -> Scene:
    scene = db.get(Scene, scene_id)
    if scene is None or scene.project_id != project_id:
        raise HTTPException(status_code=404, detail="Scene not found")
    return scene


def get_project_shot_or_404(project_id: UUID, shot_id: UUID, db: Session) -> Shot:
    shot = db.get(Shot, shot_id)
    if shot is None or shot.project_id != project_id:
        raise HTTPException(status_code=404, detail="Shot not found")
    return shot
