# Canvas Bulk Delete Design

## Goal

Allow users to delete multiple selected canvas nodes in one operation, while keeping frontend state and persisted edge data consistent.

## Scope

- Add a project-scoped canvas node delete API.
- Delete edges connected to the removed node through database cascade rules.
- Add a frontend API client method for node deletion.
- Expose node deletion through `AppContext`.
- Add a multi-select toolbar action for deleting selected visible nodes.
- Clear selection after deletion.

## Out Of Scope

- Undo and restore.
- Confirmation dialogs.
- Deleting linked business entities such as scenes or shots.
- Node context menu delete wiring.
- Batch server endpoint for deleting many nodes in one request.

## Backend Design

`DELETE /api/projects/{project_id}/canvas/nodes/{node_id}` verifies the project exists and that the node belongs to the project before deleting it. Existing foreign key cascade behavior removes any connected `canvas_edges`, so the graph does not retain dangling edges.

## Frontend Design

`deleteCanvasNode(projectId, nodeId)` wraps the backend endpoint. `AppContext.deleteCanvasNode(id)` resolves the node's project, calls the API, removes the node from local state, and filters any connected edges locally.

`CanvasView` shows a destructive `删除选中` action when more than one node is selected. The handler deletes all selected nodes that are currently visible, then clears both multi-selection and the primary selected node.

## Testing

API integration tests verify that deleting a node returns 204, removes the node from the canvas node list, and removes connected edges. Frontend client tests verify the DELETE request shape. The full web unit test suite and production build cover TypeScript integration.
