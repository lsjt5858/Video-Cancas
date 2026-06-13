# Canvas Scene Collapse Design

## Goal

Reduce visual noise on large canvases by letting users collapse a scene node and temporarily hide its child shot and prompt nodes.

## Scope

- Scene nodes show a collapse/expand control with the number of child shots.
- Collapsing a scene hides shot nodes whose `shot.sceneId` matches the scene.
- Prompt nodes that reference hidden shots are hidden as well.
- Edges connected to hidden nodes are hidden.
- Search, mini map, fit view, selection, and rendered canvas content use the visible graph.

## Out Of Scope

- Persisting collapsed state to the backend.
- Collapsing arbitrary node groups.
- Animating collapse or rerouting hidden edges.

## Frontend Design

Visibility is calculated in `canvasVisibility.ts`. The helper accepts canvas nodes, edges, shots, and collapsed scene IDs, then returns visible nodes, visible edges, and hidden node IDs.

`CanvasView` keeps collapsed scene IDs as local UI state. The scene card control toggles that state, keeps the scene selected, and lets all existing canvas operations operate on `visibleNodes` and `visibleEdges`.

## Testing

`canvasVisibility.test.ts` covers hiding shot/prompt descendants of collapsed scenes and filtering edges connected to hidden nodes. Existing frontend build verifies React integration.

