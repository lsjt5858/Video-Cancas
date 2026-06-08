from pathlib import Path
import sys
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete


API_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_ROOT))

from app.db.session import SessionLocal  # noqa: E402
from app.main import app  # noqa: E402
from app.models.project import Project  # noqa: E402


@pytest.fixture(autouse=True)
def clean_project_rows() -> None:
    with SessionLocal() as db:
        db.execute(delete(Project).where(Project.name.like("pytest-project-api-%")))
        db.commit()

    yield

    with SessionLocal() as db:
        db.execute(delete(Project).where(Project.name.like("pytest-project-api-%")))
        db.commit()


def test_create_project_persists_and_can_be_read_back() -> None:
    client = TestClient(app)
    project_name = f"pytest-project-api-{uuid4()}"

    create_response = client.post(
        "/api/projects",
        json={
            "name": project_name,
            "type": "short_drama",
            "style": "realistic_cinematic",
            "aspect_ratio": "9:16",
            "target_duration": 90,
        },
    )

    assert create_response.status_code == 201
    created_project = create_response.json()
    assert created_project["name"] == project_name
    assert created_project["status"] == "draft"

    list_response = client.get("/api/projects")
    assert list_response.status_code == 200
    listed_projects = list_response.json()
    assert any(project["id"] == created_project["id"] for project in listed_projects)

    detail_response = client.get(f"/api/projects/{created_project['id']}")
    assert detail_response.status_code == 200
    assert detail_response.json() == created_project


def test_get_project_returns_404_for_missing_project() -> None:
    client = TestClient(app)

    response = client.get(f"/api/projects/{uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Project not found"
