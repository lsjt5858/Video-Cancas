# Prompt Nodes Design

## Goal

Add a minimal prompt-node workflow to the existing canvas so each shot can expose its prompt as a first-class node. This extends the current `script -> scene -> shot` canvas graph into `script -> scene -> shot -> prompt` without introducing real LLM or generation tasks yet.

## Scope

- Backend canvas sync creates one `prompt` node for each shot that has a non-empty `prompt`.
- Backend canvas sync creates a `generates` edge from the shot node to the prompt node.
- Prompt nodes are persisted in `canvas_nodes` and reused on subsequent reads.
- Frontend renders prompt nodes with distinct visual treatment, searchable prompt text, card summary, and detail panel content.
- Existing shot, scene, drag, and `story_flow` behavior remains unchanged.

## Out Of Scope

- Calling an LLM provider.
- Editing prompt nodes independently from shot prompts.
- Creating image or video result nodes.
- Queueing generation tasks or showing generation progress.

## Backend Design

`sync_project_canvas` continues to be the single source for derived project canvas nodes. After creating or finding each shot node, it checks whether `shot.prompt.strip()` is non-empty. If true, it creates or reuses a node keyed by `("prompt", shot.id)` with `node_type="prompt"`, `ref_type="shot"`, and `ref_id=shot.id`.

The prompt node stores lightweight metadata in `data`, including `shot_id`, `scene_id`, and `prompt`. Its default position is to the right of the shot node, following the current grid layout. The sync also creates a `generates` edge from the shot node to the prompt node using the existing `ensure_canvas_edge` helper.

## Frontend Design

The existing `CanvasNode` type already includes `prompt`, so changes stay localized:

- `canvasNodePresentation` adds a prompt label and color.
- `CanvasView` resolves prompt nodes through their referenced shot, then displays the shot prompt as the node description.
- `canvasSearch` indexes prompt text so users can locate prompt nodes by generation keywords.
- `canvasNodeDetails` adds prompt-specific rows and dialog sections.

## Testing

- Add an API test proving canvas sync creates prompt nodes and `generates` edges from shot nodes.
- Add frontend unit tests for prompt-node presentation, details, and search.
- Run the focused tests first to observe failure, then implement the minimal code needed to pass.

