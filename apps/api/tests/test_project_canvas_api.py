from pathlib import Path
import sys
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete, text
from sqlalchemy.exc import ProgrammingError


API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.project import Project  # noqa: E402


@pytest.fixture(autouse=True)
def clean_canvas_project_rows() -> None:
    delete_test_canvas_rows()
    delete_test_storyboard_rows()
    delete_test_projects()

    yield

    delete_test_canvas_rows()
    delete_test_storyboard_rows()
    delete_test_projects()


def delete_test_canvas_rows() -> None:
    with SessionLocal() as db:
        try:
            db.execute(
                text(
                    """
                    DELETE FROM canvas_edges
                    WHERE project_id IN (
                        SELECT id FROM projects
                        WHERE name LIKE 'pytest-project-canvas-%'
                    )
                    """
                )
            )
            db.execute(
                text(
                    """
                    DELETE FROM canvas_nodes
                    WHERE project_id IN (
                        SELECT id FROM projects
                        WHERE name LIKE 'pytest-project-canvas-%'
                    )
                    """
                )
            )
            db.commit()
        except ProgrammingError:
            db.rollback()


def delete_test_storyboard_rows() -> None:
    with SessionLocal() as db:
        try:
            db.execute(
                text(
                    """
                    DELETE FROM shots
                    WHERE project_id IN (
                        SELECT id FROM projects
                        WHERE name LIKE 'pytest-project-canvas-%'
                    )
                    """
                )
            )
            db.execute(
                text(
                    """
                    DELETE FROM scenes
                    WHERE project_id IN (
                        SELECT id FROM projects
                        WHERE name LIKE 'pytest-project-canvas-%'
                    )
                    """
                )
            )
            db.commit()
        except ProgrammingError:
            db.rollback()


def delete_test_projects() -> None:
    with SessionLocal() as db:
        db.execute(delete(Project).where(Project.name.like("pytest-project-canvas-%")))
        db.commit()


def create_project(client: TestClient) -> dict:
    response = client.post(
        "/api/projects",
        json={
            "name": f"pytest-project-canvas-{uuid4()}",
            "type": "short_drama",
            "style": "realistic_cinematic",
            "aspect_ratio": "16:9",
            "target_duration": 60,
        },
    )
    assert response.status_code == 201
    return response.json()


def create_scene(client: TestClient, project_id: str) -> dict:
    response = client.post(
        f"/api/projects/{project_id}/scenes",
        json={
            "scene_number": 1,
            "description": "旧车站",
            "location": "站台",
            "time_of_day": "黄昏",
            "characters": ["母亲"],
        },
    )
    assert response.status_code == 201
    return response.json()


def create_shot(client: TestClient, project_id: str, scene_id: str) -> dict:
    response = client.post(
        f"/api/projects/{project_id}/shots",
        json={
            "scene_id": scene_id,
            "shot_number": 1,
            "description": "母亲站在旧车站月台",
            "shot_type": "wide",
            "camera_movement": "static",
            "duration": 4,
            "prompt": "Wide shot of a mother waiting on an old station platform",
            "position": {"x": 320, "y": 180},
        },
    )
    assert response.status_code == 201
    return response.json()


def test_canvas_nodes_sync_existing_shots_and_persist_position_updates() -> None:
    client = TestClient(app)
    project = create_project(client)
    scene = create_scene(client, project["id"])
    shot = create_shot(client, project["id"], scene["id"])

    list_response = client.get(f"/api/projects/{project['id']}/canvas/nodes")

    assert list_response.status_code == 200
    nodes = list_response.json()
    assert len(nodes) == 1
    assert nodes[0]["node_type"] == "shot"
    assert nodes[0]["ref_type"] == "shot"
    assert nodes[0]["ref_id"] == shot["id"]
    assert nodes[0]["position"] == {"x": 320, "y": 180}

    update_response = client.patch(
        f"/api/projects/{project['id']}/canvas/nodes/{nodes[0]['id']}",
        json={"position": {"x": 640, "y": 260}},
    )
    assert update_response.status_code == 200
    assert update_response.json()["position"] == {"x": 640, "y": 260}

    list_after_update = client.get(f"/api/projects/{project['id']}/canvas/nodes")
    assert list_after_update.json()[0]["position"] == {"x": 640, "y": 260}


def test_canvas_edges_can_be_created_between_project_nodes() -> None:
    client = TestClient(app)
    project = create_project(client)
    first_node = client.post(
        f"/api/projects/{project['id']}/canvas/nodes",
        json={
            "node_type": "script",
            "title": "剧本",
            "position": {"x": 80, "y": 120},
        },
    ).json()
    second_node = client.post(
        f"/api/projects/{project['id']}/canvas/nodes",
        json={
            "node_type": "export",
            "title": "导出",
            "position": {"x": 420, "y": 120},
        },
    ).json()

    create_edge_response = client.post(
        f"/api/projects/{project['id']}/canvas/edges",
        json={
            "source_node_id": first_node["id"],
            "target_node_id": second_node["id"],
            "relation_type": "workflow",
        },
    )

    assert create_edge_response.status_code == 201
    edge = create_edge_response.json()
    assert edge["source_node_id"] == first_node["id"]
    assert edge["target_node_id"] == second_node["id"]

    list_response = client.get(f"/api/projects/{project['id']}/canvas/edges")
    assert list_response.status_code == 200
    assert list_response.json() == [edge]


def test_deleting_scene_removes_its_canvas_shot_nodes() -> None:
    client = TestClient(app)
    project = create_project(client)
    scene = create_scene(client, project["id"])
    create_shot(client, project["id"], scene["id"])

    nodes_before_delete = client.get(f"/api/projects/{project['id']}/canvas/nodes").json()
    assert len(nodes_before_delete) == 1

    delete_response = client.delete(f"/api/projects/{project['id']}/scenes/{scene['id']}")
    assert delete_response.status_code == 204

    nodes_after_delete = client.get(f"/api/projects/{project['id']}/canvas/nodes")
    assert nodes_after_delete.status_code == 200
    assert nodes_after_delete.json() == []
