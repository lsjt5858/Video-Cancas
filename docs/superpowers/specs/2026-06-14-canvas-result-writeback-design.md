# Canvas Result Writeback Design

## Goal

Persist the selected canvas candidate back to the linked shot so storyboard data and node previews stay consistent.

## Scope

- Image candidate selection writes to `shots.image_url` through the existing shot update API.
- Video candidate selection writes to `shots.video_url` through the existing shot update API.
- Canvas node previews derive from the updated `Shot` record after the context refresh.
- Existing linked assets keep their `shotId`, preserving candidate provenance.

## Out Of Scope

- Adding separate selected asset ID columns.
- Creating backend asset reference tables.
- Timeline clip creation.
- Bulk writeback.

## Frontend Design

Result writeback is implemented through the canvas result selection flow. `CanvasView` calls `updateShot` with the payload from `canvasResultSelection.ts`, so selection follows the same API persistence path used by the shot inspector and shot list.

Because current `Asset` records already include `shotId`, choosing a URL updates the storyboard-facing result while keeping candidate history available in the asset list.

## Testing

The result selection unit tests validate the exact shot update payloads for images and videos. The full web test suite, production build, and diff whitespace check were run for the integration.
