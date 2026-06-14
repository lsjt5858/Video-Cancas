# Canvas Generation Progress Design

## Goal

Show the latest image and video generation status directly inside shot and prompt nodes.

## Scope

- Derive progress items from existing frontend `GenerationTask` state.
- Show the latest task per shot and generation type.
- Support pending, processing, completed, and failed statuses.
- Render progress labels and simple progress bars in canvas node cards.
- Show failure error messages when available.
- Mark simulated ShotList generation tasks as completed or failed after result writeback.

## Out Of Scope

- Backend task persistence.
- Real provider progress percentages.
- WebSocket or polling updates.
- Retry actions.

## Frontend Design

`canvasGenerationProgress.ts` selects the latest task by `shotId` and type, then maps it to creator-facing UI state. `CanvasView` reads project tasks from `AppContext`, passes them into node cards, and renders the latest image/video progress items for linked shot and prompt nodes.

For the current local generation simulation in `ShotList`, task state is updated to `completed` with `resultUrl` after shot writeback succeeds, or `failed` with an error message when writeback fails.

## Testing

Unit tests cover latest task selection, status formatting, and empty task state. The full web suite, production build, and diff whitespace check verify integration.
