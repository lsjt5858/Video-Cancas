# Canvas Video Candidates Design

## Goal

Show multiple generated video candidates for a shot directly inside shot and prompt nodes.

## Scope

- Derive video candidates from project `Asset` records linked to the current shot.
- Filter to video assets only and sort candidates by newest first.
- Mark the candidate whose URL matches `shot.videoUrl` as the current selected video.
- Render a compact video candidate list inside canvas node cards.
- Let users click a candidate preview to open the asset URL in a new tab.

## Out Of Scope

- Selecting or replacing the current shot video.
- Deleting video candidates from the canvas node.
- Persisting video result nodes in the backend canvas graph.
- Timeline selection or export flow.

## Frontend Design

`canvasVideoCandidates.ts` normalizes linked video assets into the same presentation shape used by image candidates. Selection is derived from `shot.videoUrl`, keeping the shot-level URL as the current source of truth.

`CanvasView` reads project assets from `AppContext`, passes them to node cards, and renders up to four video candidates for shot and prompt nodes. Candidate preview clicks stop propagation so opening a video does not start node dragging.

## Testing

Unit tests cover shot filtering, video-only filtering, newest-first ordering, thumbnail fallback, current-video marking, display limits, and empty states. The full web test suite, production build, and diff whitespace check verify integration.
