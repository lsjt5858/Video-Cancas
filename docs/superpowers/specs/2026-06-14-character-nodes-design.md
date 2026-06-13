# Character Nodes Design

## Goal

Add first-class character nodes to the canvas so later character consistency workflows have stable graph anchors.

## Scope

- Read character names from existing structured `Scene.characters`.
- Create one `character` node per unique character name in a project.
- Reuse character nodes using a deterministic UUID derived from project ID and character name.
- Store `character_name` and related `scene_ids` in node data.
- Connect character nodes to related scene nodes with `uses_asset` edges.
- Add frontend type and visual presentation support for `character` nodes.

## Out Of Scope

- LLM character extraction from free-form script text.
- Character profile editing.
- Reference image binding.
- Character library CRUD.

## Backend Design

`sync_project_canvas` collects unique scene character names while syncing scene nodes. For each unique name, it creates or updates a `character` node with `ref_type="character"` and a deterministic UUID ref ID. This makes repeated reads idempotent without adding a new table.

Each character node connects to every scene where that character appears using a `uses_asset` edge.

## Testing

API integration tests verify that canvas sync creates character nodes, stores character metadata, and creates `uses_asset` edges. Frontend tests verify visual presentation for the new node type.

