# Video Generation Params Design

## Goal

Expose video generation parameters on shot and prompt nodes before real video provider tasks are connected.

## Scope

- Define supported durations, camera motion options, frame modes, and reference video modes.
- Provide default video generation parameters.
- Normalize free text motion prompts for future task payloads.
- Render a video parameter panel in the canvas inspector for shot and prompt nodes.

## Parameters

- Duration: 3, 5, 8, 12 seconds
- Camera motion: auto, static, pan, tracking, dolly
- First frame mode: none, current image, uploaded reference
- Last frame mode: none, current image, uploaded reference
- Reference video mode: none, style, motion
- Motion prompt

## Out Of Scope

- Persisting parameter selections.
- Sending parameters to a backend generation task.
- Uploading first/last frame assets.
- Provider-specific advanced controls.

## Frontend Design

`videoGenerationParams.ts` owns option lists, defaults, and normalization. `ProjectWorkspace` keeps local inspector state and renders `VideoGenerationParamsPanel` for shot and prompt nodes.

The panel is colocated with model and image parameter selection so later generation buttons can use a single inspector state source.

## Testing

Unit tests verify option values, default params, and motion prompt normalization. The full web test suite and production build verify workspace integration.
