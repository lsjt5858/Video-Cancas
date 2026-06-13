# Canvas Alignment Tools Design

## Goal

Extend canvas multi-select into practical layout editing by adding basic alignment and distribution actions.

## Scope

- Show alignment actions when at least two nodes are selected.
- Support left alignment and top alignment.
- Show distribution actions when at least three nodes are selected.
- Support horizontal and vertical distribution.
- Apply positions locally immediately and persist every changed node through the existing canvas node update API.

## Out Of Scope

- Right, bottom, center, or middle alignment.
- Spacing controls.
- Undo/redo.
- Backend schema changes.

## Frontend Design

The layout math stays in `canvasSelection.ts` alongside selection and movement helpers. This keeps alignment behavior independent from React event handling and easy to test.

`CanvasView` renders compact toolbar buttons only when enough nodes are selected. It computes the new positions, calls `moveCanvasNodeLocally` for immediate feedback, then calls `updateCanvasNode` for each changed node to persist the layout.

## Testing

`canvasSelection.test.ts` covers left/top alignment and horizontal/vertical distribution. Existing frontend build verifies TypeScript integration with `CanvasView`.

