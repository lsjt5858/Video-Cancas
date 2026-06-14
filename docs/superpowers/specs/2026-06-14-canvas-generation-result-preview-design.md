# Canvas Generation Result Preview Design

## Goal

Preview generated image and video results directly inside shot and prompt nodes.

## Scope

- Derive result previews from linked shot image/video URLs.
- Fall back to the latest completed generation task `resultUrl` when shot URLs are missing.
- Render image thumbnails and video previews in canvas node cards.
- Let users click a preview to open the generated result URL in a new tab.
- Prevent preview clicks from triggering node drag or selection.

## Out Of Scope

- Rich modal preview.
- Candidate selection.
- Result replacement or deletion.
- Persisting task result URLs to backend task storage.

## Frontend Design

`canvasGenerationResults.ts` creates a normalized preview list from a shot and its generation tasks. Shot-level URLs are authoritative because they represent the current selected result. Completed task URLs are used as a fallback so recent generation output can still be shown before result writeback is expanded.

`CanvasNodeCard` renders previews before progress and action buttons. Image previews use the image URL directly. Video previews use a muted metadata preload and use the image result as poster when available.

## Testing

Unit tests cover shot URL precedence, latest completed task fallback, and empty states. The full web suite, production build, and diff whitespace check verify integration.
