# Image Generation Params Design

## Goal

Expose image generation parameters on shot and prompt nodes before real image provider tasks are connected.

## Scope

- Define supported aspect ratios, image styles, and reference modes.
- Provide default image generation parameters.
- Normalize seed and candidate count for future task payloads.
- Render an image parameter panel in the canvas inspector for shot and prompt nodes.

## Parameters

- Aspect ratio: `16:9`, `9:16`, `1:1`, `4:3`
- Style: cinematic, realistic, anime, concept art
- Reference mode: none, character, scene, prop
- Negative prompt
- Seed
- Candidate count, clamped to 1-8 when normalized

## Out Of Scope

- Persisting parameter selections.
- Sending parameters to a backend generation task.
- Reference asset selection UI.
- Provider-specific advanced controls.

## Frontend Design

`imageGenerationParams.ts` owns option lists, defaults, and normalization. `ProjectWorkspace` keeps local inspector state and renders `ImageGenerationParamsPanel` for shot and prompt nodes.

The panel sits next to the model selector so the later node generation action can read both model choice and image parameters from the same inspector area.

## Testing

Unit tests verify option values, default params, and normalization behavior. The full web test suite and production build verify workspace integration.
