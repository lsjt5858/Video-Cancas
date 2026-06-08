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
def clean_script_project_rows() -> None:
    delete_test_scripts()
    delete_test_projects()

    yield

    delete_test_scripts()
    delete_test_projects()


def delete_test_scripts() -> None:
    with SessionLocal() as db:
        try:
            db.execute(
                text(
                    """
                    DELETE FROM scripts
                    WHERE project_id IN (
                        SELECT id FROM projects
                        WHERE name LIKE 'pytest-project-script-%'
                    )
                    """
                )
            )
            db.commit()
        except ProgrammingError:
            db.rollback()


def delete_test_projects() -> None:
    with SessionLocal() as db:
        db.execute(delete(Project).where(Project.name.like("pytest-project-script-%")))
        db.commit()


def create_project(client: TestClient) -> dict:
    response = client.post(
        "/api/projects",
        json={
            "name": f"pytest-project-script-{uuid4()}",
            "type": "short_drama",
            "style": "realistic_cinematic",
            "aspect_ratio": "16:9",
            "target_duration": 60,
        },
    )
    assert response.status_code == 201
    return response.json()


def test_put_project_script_creates_and_get_reads_current_script() -> None:
    client = TestClient(app)
    project = create_project(client)

    save_response = client.put(
        f"/api/projects/{project['id']}/script",
        json={"title": "第一版剧本", "content": "第一幕：主角进入旧车站。"},
    )

    assert save_response.status_code == 200
    saved_script = save_response.json()
    assert saved_script["project_id"] == project["id"]
    assert saved_script["title"] == "第一版剧本"
    assert saved_script["content"] == "第一幕：主角进入旧车站。"
    assert saved_script["version"] == 1

    read_response = client.get(f"/api/projects/{project['id']}/script")
    assert read_response.status_code == 200
    assert read_response.json() == saved_script


def test_put_project_script_updates_current_script_version() -> None:
    client = TestClient(app)
    project = create_project(client)

    first_response = client.put(
        f"/api/projects/{project['id']}/script",
        json={"title": "第一版剧本", "content": "旧内容"},
    )
    second_response = client.put(
        f"/api/projects/{project['id']}/script",
        json={"title": "第二版剧本", "content": "新内容"},
    )

    assert first_response.status_code == 200
    assert second_response.status_code == 200
    assert second_response.json()["id"] == first_response.json()["id"]
    assert second_response.json()["title"] == "第二版剧本"
    assert second_response.json()["content"] == "新内容"
    assert second_response.json()["version"] == 2


def test_project_script_returns_404_for_missing_project() -> None:
    client = TestClient(app)
    missing_project_id = uuid4()

    get_response = client.get(f"/api/projects/{missing_project_id}/script")
    put_response = client.put(
        f"/api/projects/{missing_project_id}/script",
        json={"title": "不存在", "content": "不会保存"},
    )

    assert get_response.status_code == 404
    assert get_response.json()["detail"] == "Project not found"
    assert put_response.status_code == 404
    assert put_response.json()["detail"] == "Project not found"
