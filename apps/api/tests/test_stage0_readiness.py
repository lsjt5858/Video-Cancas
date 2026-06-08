from pathlib import Path
import sys

from fastapi.testclient import TestClient


API_ROOT = Path(__file__).resolve().parents[1]
REPO_ROOT = API_ROOT.parents[1]

sys.path.insert(0, str(API_ROOT))

from app.main import app  # noqa: E402


def test_health_check_reports_api_status() -> None:
    client = TestClient(app)

    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok", "service": "api"}


def test_alembic_project_migration_is_configured() -> None:
    alembic_ini = REPO_ROOT / "apps" / "api" / "alembic.ini"
    env_py = REPO_ROOT / "apps" / "api" / "alembic" / "env.py"
    versions_dir = REPO_ROOT / "apps" / "api" / "alembic" / "versions"

    assert alembic_ini.exists()
    assert env_py.exists()

    migration_files = list(versions_dir.glob("*.py"))
    assert migration_files

    migration_text = "\n".join(path.read_text() for path in migration_files)
    assert "create_table" in migration_text
    assert "projects" in migration_text
    assert "created_at" in migration_text
    assert "updated_at" in migration_text


def test_project_model_matches_initial_project_table() -> None:
    from app.models.project import Project

    columns = Project.__table__.columns

    assert "created_at" in columns
    assert "updated_at" in columns
