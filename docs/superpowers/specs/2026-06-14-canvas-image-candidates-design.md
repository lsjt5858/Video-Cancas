# Canvas Image Candidates Design

## Goal

Show multiple generated image candidates for a shot directly inside shot and prompt nodes.

## Scope

- Derive image candidates from project `Asset` records linked to the current shot.
- Filter to image assets only and sort candidates by newest first.
- Mark the candidate whose URL matches `shot.imageUrl` as the current selected image.
- Render a compact candidate grid inside canvas node cards.
- Let users click a candidate thumbnail to open the asset URL in a new tab.

## Out Of Scope

- Selecting or replacing the current shot image.
- Deleting candidates from the canvas node.
- Persisting image result nodes in the backend canvas graph.
- Video candidates.

## Frontend Design

`canvasImageCandidates.ts` normalizes linked image assets into a small presentation model for node cards. It keeps selection derived from `shot.imageUrl`, because the shot-level URL is already the current source of truth for the main image result.

`CanvasView` reads project assets from `AppContext`, passes them to each node card, and renders up to six image candidates for shot and prompt nodes. Candidate thumbnail clicks stop propagation so users can preview images without dragging or selecting the node.

## Testing

Unit tests cover shot filtering, image-only filtering, newest-first ordering, thumbnail fallback, current-image marking, display limits, and empty states. The full web test suite, production build, and diff whitespace check verify integration.
