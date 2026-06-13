# Location Nodes Design

## Goal

Add scene asset nodes for locations so later scene consistency workflows have stable graph anchors.

## Scope

- Read location names from existing structured `Scene.location`.
- Create one `location` node per unique location name in a project.
- Reuse location nodes using a deterministic UUID derived from project ID and location name.
- Store `location_name` and related `scene_ids` in node data.
- Connect location nodes to related scene nodes with `uses_asset` edges.
- Add frontend type and visual presentation support for `location` nodes.

## Out Of Scope

- LLM extraction of places from free-form script text.
- Location profile editing.
- Reference image binding.
- Scene asset library CRUD.

## Backend Design

`sync_project_canvas` collects unique non-empty scene locations while syncing scene nodes. For each unique location, it creates or updates a `location` node with `ref_type="location"` and a deterministic UUID ref ID.

Each location node connects to every scene using that location through a `uses_asset` edge.

## Testing

API integration tests verify that canvas sync creates location nodes, stores location metadata, and creates `uses_asset` edges. Frontend tests verify visual presentation for the new node type.

