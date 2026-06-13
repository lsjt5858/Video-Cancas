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
            "description": "旧车站。道具：怀表",
            "location": "站台",
            "time_of_day": "黄昏",
            "characters": ["母亲"],
        },
    )
    assert response.status_code == 201
    return response.json()


def upsert_script(client: TestClient, project_id: str) -> dict:
    response = client.put(
        f"/api/projects/{project_id}/script",
        json={
            "title": "旧车站重逢",
            "content": "母亲在旧车站等待离散多年的孩子。",
        },
    )
    assert response.status_code == 200
    return response.json()


def create_shot(client: TestClient, project_id: str, scene_id: str) -> dict:
    response = client.post(
        f"/api/projects/{project_id}/shots",
        json={
            "scene_id": scene_id,
            "shot_number": 1,
            "description": "母亲站在旧车站月台，道具：旧皮箱",
            "shot_type": "wide",
            "camera_movement": "static",
            "duration": 4,
            "prompt": "Wide shot of a mother waiting on an old station platform",
            "position": {"x": 320, "y": 180},
        },
    )
    assert response.status_code == 201
    return response.json()


def test_canvas_syncs_script_scene_and_shot_nodes_with_story_flow_edges() -> None:
    client = TestClient(app)
    project = create_project(client)
    script = upsert_script(client, project["id"])
    scene = create_scene(client, project["id"])
    shot = create_shot(client, project["id"], scene["id"])

    list_response = client.get(f"/api/projects/{project['id']}/canvas/nodes")

    assert list_response.status_code == 200
    nodes = list_response.json()
    nodes_by_ref = {(node["ref_type"], node["ref_id"]): node for node in nodes}
    assert ("script", script["id"]) in nodes_by_ref
    assert ("scene", scene["id"]) in nodes_by_ref
    assert ("shot", shot["id"]) in nodes_by_ref
    assert ("prompt", shot["id"]) in nodes_by_ref
    character_nodes = [node for node in nodes if node["node_type"] == "character"]
    assert len(character_nodes) == 1
    assert character_nodes[0]["title"] == "角色：母亲"
    assert character_nodes[0]["data"]["character_name"] == "母亲"
    assert character_nodes[0]["data"]["scene_ids"] == [scene["id"]]
    location_nodes = [node for node in nodes if node["node_type"] == "location"]
    assert len(location_nodes) == 1
    assert location_nodes[0]["title"] == "地点：站台"
    assert location_nodes[0]["data"]["location_name"] == "站台"
    assert location_nodes[0]["data"]["scene_ids"] == [scene["id"]]
    prop_nodes = sorted(
        [node for node in nodes if node["node_type"] == "prop"],
        key=lambda node: node["title"],
    )
    assert [node["title"] for node in prop_nodes] == ["道具：怀表", "道具：旧皮箱"]
    assert prop_nodes[0]["data"]["prop_name"] == "怀表"
    assert prop_nodes[0]["data"]["scene_ids"] == [scene["id"]]
    assert prop_nodes[1]["data"]["prop_name"] == "旧皮箱"
    assert prop_nodes[1]["data"]["shot_ids"] == [shot["id"]]
    assert nodes_by_ref[("script", script["id"])]["position"] == {"x": 80, "y": 80}
    assert nodes_by_ref[("scene", scene["id"])]["position"] == {"x": 360, "y": 80}
    assert nodes_by_ref[("shot", shot["id"])]["position"] == {"x": 640, "y": 80}
    assert nodes_by_ref[("prompt", shot["id"])]["node_type"] == "prompt"
    assert nodes_by_ref[("prompt", shot["id"])]["title"] == "镜头 1 提示词"
    assert nodes_by_ref[("prompt", shot["id"])]["data"]["prompt"] == shot["prompt"]

    edges_response = client.get(f"/api/projects/{project['id']}/canvas/edges")
    assert edges_response.status_code == 200
    edges = edges_response.json()
    script_node = nodes_by_ref[("script", script["id"])]
    scene_node = nodes_by_ref[("scene", scene["id"])]
    shot_node = nodes_by_ref[("shot", shot["id"])]
    prompt_node = nodes_by_ref[("prompt", shot["id"])]
    character_node = character_nodes[0]
    location_node = location_nodes[0]
    watch_node, suitcase_node = prop_nodes
    assert {
        "source_node_id": script_node["id"],
        "target_node_id": scene_node["id"],
        "relation_type": "story_flow",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]
    assert {
        "source_node_id": scene_node["id"],
        "target_node_id": shot_node["id"],
        "relation_type": "story_flow",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]
    assert {
        "source_node_id": shot_node["id"],
        "target_node_id": prompt_node["id"],
        "relation_type": "generates",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]
    assert {
        "source_node_id": character_node["id"],
        "target_node_id": scene_node["id"],
        "relation_type": "uses_asset",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]
    assert {
        "source_node_id": location_node["id"],
        "target_node_id": scene_node["id"],
        "relation_type": "uses_asset",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]
    assert {
        "source_node_id": watch_node["id"],
        "target_node_id": scene_node["id"],
        "relation_type": "uses_asset",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]
    assert {
        "source_node_id": suitcase_node["id"],
        "target_node_id": shot_node["id"],
        "relation_type": "uses_asset",
    } in [
        {
            "source_node_id": edge["source_node_id"],
            "target_node_id": edge["target_node_id"],
            "relation_type": edge["relation_type"],
        }
        for edge in edges
    ]

    update_response = client.patch(
        f"/api/projects/{project['id']}/canvas/nodes/{shot_node['id']}",
        json={"position": {"x": 640, "y": 260}},
    )
    assert update_response.status_code == 200
    assert update_response.json()["position"] == {"x": 640, "y": 260}

    list_after_update = client.get(f"/api/projects/{project['id']}/canvas/nodes")
    updated_nodes_by_ref = {
        (node["ref_type"], node["ref_id"]): node for node in list_after_update.json()
    }
    assert updated_nodes_by_ref[("shot", shot["id"])]["position"] == {"x": 640, "y": 260}


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
    shot = create_shot(client, project["id"], scene["id"])

    nodes_before_delete = client.get(f"/api/projects/{project['id']}/canvas/nodes").json()
    assert any(node["ref_id"] == scene["id"] for node in nodes_before_delete)

    delete_response = client.delete(f"/api/projects/{project['id']}/scenes/{scene['id']}")
    assert delete_response.status_code == 204

    nodes_after_delete = client.get(f"/api/projects/{project['id']}/canvas/nodes")
    assert nodes_after_delete.status_code == 200
    assert all(node["ref_id"] != scene["id"] for node in nodes_after_delete.json())
    assert all(node["ref_id"] != shot["id"] for node in nodes_after_delete.json())


def test_deleting_shot_removes_its_canvas_and_prompt_nodes() -> None:
    client = TestClient(app)
    project = create_project(client)
    scene = create_scene(client, project["id"])
    shot = create_shot(client, project["id"], scene["id"])

    nodes_before_delete = client.get(f"/api/projects/{project['id']}/canvas/nodes").json()
    assert any(node["ref_type"] == "shot" and node["ref_id"] == shot["id"] for node in nodes_before_delete)
    assert any(
        node["ref_type"] == "prompt" and node["ref_id"] == shot["id"]
        for node in nodes_before_delete
    )

    delete_response = client.delete(f"/api/projects/{project['id']}/shots/{shot['id']}")
    assert delete_response.status_code == 204

    nodes_after_delete = client.get(f"/api/projects/{project['id']}/canvas/nodes")
    assert nodes_after_delete.status_code == 200
    assert all(node["ref_id"] != shot["id"] for node in nodes_after_delete.json())
