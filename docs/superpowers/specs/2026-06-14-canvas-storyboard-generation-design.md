# Canvas Storyboard Generation Design

## Goal

Allow users to generate storyboard shots directly from canvas script or scene nodes.

## Scope

- Add a context menu action for script and scene nodes.
- Reuse the current frontend storyboard generation plan.
- For script nodes, create a new scene and then create planned shots under it.
- For scene nodes, append planned shots to that scene using the next available shot number.
- Rely on the existing `createShot` canvas refresh to materialize new shot nodes.

## Out Of Scope

- LLM-backed script analysis.
- Custom generation parameters.
- Replacing existing shots from the canvas action.
- Background task status tracking.

## Frontend Design

`createStoryboardShotPlan(projectId, startShotNumber)` returns reusable shot plans with deterministic numbering. `createStoryboardGenerationPlan` now composes that helper for the script-level flow.

`ProjectWorkspace` handles `generate_storyboard` from the node context menu. Script nodes create a new scene first. Scene nodes resolve their linked scene and append shots after the current maximum shot number for that scene.

## Testing

Unit tests verify the reusable shot plan numbering and that script/scene nodes expose the enabled context menu action. The full web test suite and production build verify integration.
