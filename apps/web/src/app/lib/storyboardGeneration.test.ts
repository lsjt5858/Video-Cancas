import { describe, expect, it } from 'vitest';
import { createStoryboardGenerationPlan } from './storyboardGeneration';

describe('createStoryboardGenerationPlan', () => {
  it('creates a replacement storyboard plan that opens the shots tab', () => {
    const plan = createStoryboardGenerationPlan('project-1');

    expect(plan.targetTab).toBe('shots');
    expect(plan.scene.projectId).toBe('project-1');
    expect(plan.shots).toHaveLength(3);
    expect(plan.shots.map((shot) => shot.shotNumber)).toEqual([1, 2, 3]);
  });
});
