# Canvas Blank Menu Design

## Goal

Let users create standalone canvas nodes directly at a blank canvas position, using the existing canvas node persistence API.

## Scope

- Right-click blank canvas space to open a compact creation menu.
- Create `prompt`, `image_result`, `video_result`, and `export` nodes.
- Place the new node at the clicked canvas coordinate.
- Persist the node with `POST /api/projects/{project_id}/canvas/nodes`.
- Select the newly created node after creation.

## Out Of Scope

- Creating real scene, shot, character, or asset records.
- Linking the new node to an existing shot or generation task.
- Backend schema changes.

## Frontend Design

`canvasBlankMenu.ts` builds default node inputs for blank-area creation. The API client exposes `createCanvasNode`, and `AppContext` stores the returned node in `canvasNodes`.

`CanvasView` tracks the blank-menu screen position and canvas coordinate. Clicking a menu item creates the node and closes the menu.

## Testing

Unit tests cover default blank-menu node input and the `createCanvasNode` API payload mapping.

