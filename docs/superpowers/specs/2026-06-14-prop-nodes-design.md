# Prop Nodes Design

## Goal

Add prop nodes to the canvas as a first step toward prop-aware image and video generation references.

## Scope

- Extract explicit prop markers from scene and shot text.
- Supported markers: `道具：A、B` and `props: A, B`.
- Create one `prop` node per unique prop name in a project.
- Reuse prop nodes using a deterministic UUID derived from project ID and prop name.
- Store `prop_name`, related `scene_ids`, and related `shot_ids` in node data.
- Connect prop nodes to related scene or shot nodes with `uses_asset` edges.
- Add frontend type and visual presentation support for `prop` nodes.

## Out Of Scope

- LLM extraction of implicit props from free-form script text.
- Prop profile editing.
- Reference image binding.
- Prop library CRUD.

## Backend Design

`sync_project_canvas` scans scene descriptions and shot description/prompt/dialogue fields for explicit prop markers. For each unique prop, it creates or updates a `prop` node with `ref_type="prop"` and a deterministic UUID ref ID.

Scene-level prop references connect to scene nodes. Shot-level prop references connect to shot nodes.

## Testing

API integration tests verify prop node creation, metadata, and `uses_asset` edges for scene-level and shot-level prop markers. Frontend tests verify visual presentation for the new node type.

