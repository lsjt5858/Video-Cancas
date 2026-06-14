# Canvas Generation Retry Design

## Goal

Allow users to retry failed image or video generation directly from the canvas node failure state.

## Scope

- Add retry metadata to failed canvas generation progress items.
- Show retry buttons for failed image and video tasks.
- Reuse existing node generation actions, `generate_image` and `generate_video`.
- Preserve the existing failure error message in the progress card.
- Prevent retry clicks from triggering node drag or canvas selection.

## Out Of Scope

- Backend retry task APIs.
- Retry history grouping.
- Automatic retry.
- Provider-specific error remediation.

## Frontend Design

`canvasGenerationProgress.ts` maps failed tasks to retry actions:

- failed image task -> `重试生图` / `generate_image`
- failed video task -> `重试生视频` / `generate_video`

`CanvasGenerationProgressList` renders retry buttons when progress items include retry metadata. The button calls the same `onMenuAction` path used by node generation buttons, so later real task wiring only needs to update that shared generation action handler.

## Testing

Unit tests verify that failed progress items include retry action and label metadata. The full web suite, production build, and diff whitespace check verify integration.
