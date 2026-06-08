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
def clean_shot_project_rows() -> None:
    delete_test_storyboard_rows()
    delete_test_projects()

    yield

    delete_test_storyboard_rows()
    delete_test_projects()


def delete_test_storyboard_rows() -> None:
    with SessionLocal() as db:
        try:
            db.execute(
                text(
                    """
                    DELETE FROM shots
                    WHERE project_id IN (
                        SELECT id FROM projects
                        WHERE name LIKE 'pytest-project-shots-%'
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
                        WHERE name LIKE 'pytest-project-shots-%'
                    )
                    """
                )
            )
            db.commit()
        except ProgrammingError:
            db.rollback()


def delete_test_projects() -> None:
    with SessionLocal() as db:
        db.execute(delete(Project).where(Project.name.like("pytest-project-shots-%")))
        db.commit()


def create_project(client: TestClient) -> dict:
    response = client.post(
        "/api/projects",
        json={
            "name": f"pytest-project-shots-{uuid4()}",
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
            "description": "开场场景",
            "location": "旧车站",
            "time_of_day": "黄昏",
            "characters": ["母亲", "儿子"],
        },
    )
    assert response.status_code == 201
    return response.json()


def test_create_and_list_project_scenes() -> None:
    client = TestClient(app)
    project = create_project(client)

    scene = create_scene(client, project["id"])

    assert scene["project_id"] == project["id"]
    assert scene["scene_number"] == 1
    assert scene["characters"] == ["母亲", "儿子"]

    list_response = client.get(f"/api/projects/{project['id']}/scenes")
    assert list_response.status_code == 200
    assert list_response.json() == [scene]


def test_update_and_delete_project_scene_removes_its_shots() -> None:
    client = TestClient(app)
    project = create_project(client)
    scene = create_scene(client, project["id"])
    shot_response = client.post(
        f"/api/projects/{project['id']}/shots",
        json={
            "scene_id": scene["id"],
            "shot_number": 1,
            "description": "旧车站远景",
            "shot_type": "wide",
            "camera_movement": "static",
            "duration": 3,
            "prompt": "Wide shot of an old train station at sunset",
        },
    )
    assert shot_response.status_code == 201

    update_response = client.patch(
        f"/api/projects/{project['id']}/scenes/{scene['id']}",
        json={"location": "候车大厅", "characters": ["母亲"]},
    )
    assert update_response.status_code == 200
    assert update_response.json()["location"] == "候车大厅"
    assert update_response.json()["characters"] == ["母亲"]

    delete_response = client.delete(f"/api/projects/{project['id']}/scenes/{scene['id']}")
    assert delete_response.status_code == 204

    scenes_after_delete = client.get(f"/api/projects/{project['id']}/scenes")
    shots_after_delete = client.get(f"/api/projects/{project['id']}/shots")
    assert scenes_after_delete.json() == []
    assert shots_after_delete.json() == []


def test_create_list_update_and_delete_project_shots() -> None:
    client = TestClient(app)
    project = create_project(client)
    scene = create_scene(client, project["id"])

    second_response = client.post(
        f"/api/projects/{project['id']}/shots",
        json={
            "scene_id": scene["id"],
            "shot_number": 2,
            "description": "母亲转身看向站台尽头",
            "shot_type": "medium",
            "camera_movement": "pan",
            "duration": 5,
            "dialogue": "你终于回来了。",
            "prompt": "Medium shot, mother turns to the end of an old station platform",
            "position": {"x": 300, "y": 100},
        },
    )
    first_response = client.post(
        f"/api/projects/{project['id']}/shots",
        json={
            "scene_id": scene["id"],
            "shot_number": 1,
            "description": "旧车站远景",
            "shot_type": "wide",
            "camera_movement": "static",
            "duration": 3,
            "prompt": "Wide shot of an old train station at sunset",
            "position": {"x": 100, "y": 100},
        },
    )

    assert second_response.status_code == 201
    assert first_response.status_code == 201

    list_response = client.get(f"/api/projects/{project['id']}/shots")
    assert list_response.status_code == 200
    shots = list_response.json()
    assert [shot["shot_number"] for shot in shots] == [1, 2]
    assert shots[0]["description"] == "旧车站远景"

    update_response = client.patch(
        f"/api/projects/{project['id']}/shots/{shots[0]['id']}",
        json={"duration": 4, "image_url": "https://example.com/shot-1.png"},
    )
    assert update_response.status_code == 200
    assert update_response.json()["duration"] == 4
    assert update_response.json()["image_url"] == "https://example.com/shot-1.png"

    delete_response = client.delete(f"/api/projects/{project['id']}/shots/{shots[0]['id']}")
    assert delete_response.status_code == 204

    list_after_delete = client.get(f"/api/projects/{project['id']}/shots")
    assert [shot["id"] for shot in list_after_delete.json()] == [shots[1]["id"]]


def test_project_shot_routes_return_404_for_missing_project_and_cross_project_shot() -> None:
    client = TestClient(app)
    first_project = create_project(client)
    second_project = create_project(client)
    scene = create_scene(client, first_project["id"])

    shot_response = client.post(
        f"/api/projects/{first_project['id']}/shots",
        json={
            "scene_id": scene["id"],
            "shot_number": 1,
            "description": "旧车站远景",
            "shot_type": "wide",
            "camera_movement": "static",
            "duration": 3,
            "prompt": "Wide shot of an old train station at sunset",
        },
    )
    assert shot_response.status_code == 201
    shot = shot_response.json()

    missing_project_id = uuid4()
    missing_response = client.get(f"/api/projects/{missing_project_id}/shots")
    cross_project_response = client.patch(
        f"/api/projects/{second_project['id']}/shots/{shot['id']}",
        json={"duration": 9},
    )

    assert missing_response.status_code == 404
    assert missing_response.json()["detail"] == "Project not found"
    assert cross_project_response.status_code == 404
    assert cross_project_response.json()["detail"] == "Shot not found"
