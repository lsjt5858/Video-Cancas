# Canvas Context Delete Design

## Goal

Let users delete a single canvas node directly from the node context menu.

## Scope

- Enable the existing `delete_node` context menu item.
- Use the existing `AppContext.deleteCanvasNode` flow.
- Clear the selected canvas node after deletion.
- Show a success toast after the deletion completes.

## Out Of Scope

- Confirmation dialogs.
- Undo and restore.
- Deleting underlying business entities such as scenes or shots.
- Batch server deletion, which is already covered by the multi-select UI calling the same single-node API.

## Frontend Design

The context menu helper now exposes `delete_node` as an enabled destructive action. `ProjectWorkspace` handles the action by selecting the node, calling `deleteCanvasNode(node.id)`, clearing the current selection, and showing a toast.

## Testing

The context menu unit test verifies that deletion is enabled while generation actions remain disabled. The full web unit test suite and production build verify integration.
