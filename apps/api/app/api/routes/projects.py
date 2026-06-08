from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import delete, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.canvas import CanvasEdge, CanvasNode
from app.models.project import Project
from app.models.script import Script
from app.models.storyboard import Scene, Shot
from app.schemas.canvas import (
    CanvasEdgeCreate,
    CanvasEdgeRead,
    CanvasNodeCreate,
    CanvasNodeRead,
    CanvasNodeUpdate,
)
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


@router.delete("/{project_id}", status_code=204)
def delete_project(project_id: UUID, db: Session = Depends(get_db)) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")
    db.delete(project)
    db.commit()


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
    shot_ids = list(
        db.scalars(select(Shot.id).where(Shot.project_id == project_id, Shot.scene_id == scene_id))
    )
    if shot_ids:
        db.execute(
            delete(CanvasNode).where(
                CanvasNode.project_id == project_id,
                CanvasNode.ref_type == "shot",
                CanvasNode.ref_id.in_(shot_ids),
            )
        )
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
    db.execute(
        delete(CanvasNode).where(
            CanvasNode.project_id == project_id,
            CanvasNode.ref_type == "shot",
            CanvasNode.ref_id == shot_id,
        )
    )
    db.delete(shot)
    db.commit()


@router.get("/{project_id}/canvas/nodes", response_model=list[CanvasNodeRead])
def list_project_canvas_nodes(project_id: UUID, db: Session = Depends(get_db)) -> list[dict]:
    ensure_project_exists(project_id, db)
    sync_shot_canvas_nodes(project_id, db)
    nodes = db.scalars(
        select(CanvasNode)
        .where(CanvasNode.project_id == project_id)
        .order_by(CanvasNode.created_at.asc(), CanvasNode.id.asc())
    )
    return [serialize_canvas_node(node) for node in nodes]


@router.post("/{project_id}/canvas/nodes", response_model=CanvasNodeRead, status_code=201)
def create_project_canvas_node(
    project_id: UUID,
    payload: CanvasNodeCreate,
    db: Session = Depends(get_db),
) -> dict:
    ensure_project_exists(project_id, db)
    node = CanvasNode(
        project_id=project_id,
        node_type=payload.node_type,
        title=payload.title,
        position_x=payload.position.x,
        position_y=payload.position.y,
        width=payload.size.width,
        height=payload.size.height,
        ref_type=payload.ref_type,
        ref_id=payload.ref_id,
        data=payload.data,
    )
    db.add(node)
    db.commit()
    db.refresh(node)
    return serialize_canvas_node(node)


@router.patch("/{project_id}/canvas/nodes/{node_id}", response_model=CanvasNodeRead)
def update_project_canvas_node(
    project_id: UUID,
    node_id: UUID,
    payload: CanvasNodeUpdate,
    db: Session = Depends(get_db),
) -> dict:
    ensure_project_exists(project_id, db)
    node = get_project_canvas_node_or_404(project_id, node_id, db)
    updates = payload.model_dump(exclude_unset=True)

    if "title" in updates:
        node.title = payload.title
    if payload.position is not None:
        node.position_x = payload.position.x
        node.position_y = payload.position.y
    if payload.size is not None:
        node.width = payload.size.width
        node.height = payload.size.height
    if payload.data is not None:
        node.data = payload.data

    db.commit()
    db.refresh(node)
    return serialize_canvas_node(node)


@router.get("/{project_id}/canvas/edges", response_model=list[CanvasEdgeRead])
def list_project_canvas_edges(project_id: UUID, db: Session = Depends(get_db)) -> list[CanvasEdge]:
    ensure_project_exists(project_id, db)
    return list(
        db.scalars(
            select(CanvasEdge)
            .where(CanvasEdge.project_id == project_id)
            .order_by(CanvasEdge.created_at.asc(), CanvasEdge.id.asc())
        )
    )


@router.post("/{project_id}/canvas/edges", response_model=CanvasEdgeRead, status_code=201)
def create_project_canvas_edge(
    project_id: UUID,
    payload: CanvasEdgeCreate,
    db: Session = Depends(get_db),
) -> CanvasEdge:
    ensure_project_exists(project_id, db)
    get_project_canvas_node_or_404(project_id, payload.source_node_id, db)
    get_project_canvas_node_or_404(project_id, payload.target_node_id, db)
    edge = CanvasEdge(project_id=project_id, **payload.model_dump())
    db.add(edge)
    db.commit()
    db.refresh(edge)
    return edge


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


def get_project_canvas_node_or_404(
    project_id: UUID,
    node_id: UUID,
    db: Session,
) -> CanvasNode:
    node = db.get(CanvasNode, node_id)
    if node is None or node.project_id != project_id:
        raise HTTPException(status_code=404, detail="Canvas node not found")
    return node


def sync_shot_canvas_nodes(project_id: UUID, db: Session) -> None:
    existing_shot_node_refs = set(
        db.scalars(
            select(CanvasNode.ref_id).where(
                CanvasNode.project_id == project_id,
                CanvasNode.ref_type == "shot",
            )
        )
    )
    shots = db.scalars(
        select(Shot)
        .where(Shot.project_id == project_id)
        .order_by(Shot.shot_number.asc(), Shot.id.asc())
    )

    has_new_nodes = False
    for index, shot in enumerate(shots):
        if shot.id in existing_shot_node_refs:
            continue

        position = shot.position or {
            "x": 100 + (index % 5) * 250,
            "y": 100 + (index // 5) * 200,
        }
        db.add(
            CanvasNode(
                project_id=project_id,
                node_type="shot",
                title=f"镜头 {shot.shot_number}",
                position_x=float(position["x"]),
                position_y=float(position["y"]),
                width=200,
                height=180,
                ref_type="shot",
                ref_id=shot.id,
                data={"shot_id": str(shot.id), "scene_id": str(shot.scene_id)},
            )
        )
        has_new_nodes = True

    if has_new_nodes:
        db.commit()


def serialize_canvas_node(node: CanvasNode) -> dict:
    return {
        "id": node.id,
        "project_id": node.project_id,
        "node_type": node.node_type,
        "title": node.title,
        "position": {"x": node.position_x, "y": node.position_y},
        "size": {"width": node.width, "height": node.height},
        "ref_type": node.ref_type,
        "ref_id": node.ref_id,
        "data": node.data,
    }
