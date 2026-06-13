# Canvas Node Groups Design

## Goal

Show lightweight visual groups on the canvas so users can understand which nodes belong to the same scene or character workflow.

## Scope

- Build scene groups from scene nodes plus related shot and prompt nodes.
- Build character groups from character nodes and their referenced scene IDs.
- Compute padded bounds from member node positions and sizes.
- Render non-interactive dashed group frames behind canvas nodes.
- Add a toolbar toggle to show or hide node groups.

## Out Of Scope

- Persisting group entities in the database.
- Dragging a group as one unit.
- Collapsing groups.
- Episode-level grouping, because the current scene model does not yet contain episode metadata.

## Frontend Design

`buildCanvasNodeGroups` is a pure helper that derives groups from currently visible nodes, scenes, and shots. It returns group IDs, labels, member node IDs, kind, and padded bounds. `CanvasView` memoizes this result and renders group frames behind nodes when the toolbar toggle is enabled.

Scene groups include the scene node plus shot/prompt nodes whose `refId` maps to shots in that scene. Character groups read `scene_ids` from character node data and include the character node plus scene, shot, and prompt nodes linked to those scenes.

## Testing

Unit tests cover scene grouping, character grouping, member ordering, and bounds calculation. The full web test suite and production build verify integration with the canvas component.
