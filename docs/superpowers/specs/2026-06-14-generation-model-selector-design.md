# Generation Model Selector Design

## Goal

Let users choose generation model strategies before image or video generation flows are wired to real providers.

## Scope

- Define frontend model presets for image and video generation.
- Provide defaults for each generation type.
- Show model selectors for shot and prompt nodes in the canvas inspector.
- Display short model descriptions so users understand the tradeoff.

## Model Groups

Image models:

- `image-fast`: 快速生图
- `image-quality`: 质量生图
- `image-character`: 角色一致性
- `image-scene`: 场景一致性

Video models:

- `video-fast`: 快速生视频
- `video-quality`: 质量生视频
- `video-motion`: 运动增强

## Out Of Scope

- Real provider routing.
- Persisting selected model choices.
- Passing selected models into generation tasks.
- Cost, quota, and availability checks.

## Frontend Design

`generationModels.ts` keeps model definitions and lookup helpers as pure functions. `ProjectWorkspace` renders a `GenerationModelSelectorPanel` in the canvas inspector when the selected node is a `shot` or `prompt` node.

The current selector state is local to the inspector. Later generation buttons can read this state or move it into persisted task input once task APIs exist.

## Testing

Unit tests verify image/video model groups, default models, and model lookup by ID. The full web test suite and production build verify integration with the workspace.
