# Canvas Multi Select Design

## Goal

Add the first usable batch-operation foundation to the custom canvas: users can select multiple nodes with a marquee rectangle and drag the selected nodes together.

## Scope

- Hold Shift and drag on blank canvas space to draw a selection rectangle.
- Select all canvas nodes whose bounds intersect the rectangle.
- Show selected nodes with the existing selected-node ring.
- Drag any selected node to move the whole selection by the same delta.
- Persist all moved selected node positions through the existing `updateCanvasNode` API.

## Out Of Scope

- Batch delete.
- Alignment tools.
- Grouping.
- Batch generation.
- Backend schema changes.

## Frontend Design

The geometry logic lives in `canvasSelection.ts` so the behavior is testable without browser event setup. `CanvasView` owns the transient interaction state: selected node IDs, selection start/current points, drag start point, and drag start node snapshots.

The existing single-selected node remains the primary node used by the right-side inspector. Multi-select is a local canvas interaction layer; it does not change the inspector contract or backend data model.

## Testing

Unit tests cover rectangle normalization, intersecting-node selection, and applying a shared movement delta to selected nodes. Existing build and test commands verify TypeScript integration.

