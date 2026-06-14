# Canvas Result Selection Design

## Goal

Allow users to choose one image or video candidate as the current result for a shot from the canvas node card.

## Scope

- Add selection button state for image and video candidates.
- Persist selected image candidates to `shot.imageUrl`.
- Persist selected video candidates to `shot.videoUrl`.
- Disable selection buttons for candidates that are already current.
- Show success and failure toasts for selection writes.

## Out Of Scope

- Deleting unselected candidates.
- Maintaining separate selected asset reference IDs.
- Timeline insertion.
- Bulk candidate selection.

## Frontend Design

`canvasResultSelection.ts` owns the small pure rules for result selection: which `Shot` field to update and how to label/disable selection buttons. `CanvasView` uses the existing `updateShot` context method, so selection goes through the same API-backed persistence path as the shot property panel.

Candidate thumbnails still open the asset URL in a new tab. Selection uses separate buttons to avoid mixing preview navigation with state-changing actions.

## Testing

Unit tests cover image and video update payloads plus button states for selected and selectable candidates. The full web test suite, production build, and diff whitespace check verify integration.
