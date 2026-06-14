# Canvas Node Generation Buttons Design

## Goal

Expose direct image and video generation entry points inside shot and prompt node cards.

## Scope

- Show generation buttons only for `shot` and `prompt` nodes with linked shot data.
- Show `生图` and `生视频` when no generated result exists.
- Show `重新生图` and `重新生视频` when the linked shot already has image or video results.
- Reuse existing canvas node action callbacks for `generate_image` and `generate_video`.
- Prevent button clicks from starting node drag or canvas selection.

## Out Of Scope

- Real image/video task creation.
- Progress display inside nodes.
- Retry error handling.
- Provider execution and asset persistence.

## Frontend Design

`canvasNodeGenerationActions.ts` derives card-level action labels from the node type and linked shot state. `CanvasNodeCard` renders these actions below node content and forwards clicks to the existing `onMenuAction` callback.

The implementation keeps the card UI ready for generation tasks while leaving task execution to the later generation pipeline work.

## Testing

Unit tests cover action visibility for supported nodes, regeneration labels when results already exist, and empty actions for unsupported nodes or missing shot data. The full web suite and production build verify integration.
