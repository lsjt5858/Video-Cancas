import { describe, expect, it } from 'vitest';
import {
  createStoryboardGenerationPlan,
  createStoryboardShotPlan,
} from './storyboardGeneration';

describe('createStoryboardGenerationPlan', () => {
  it('creates a replacement storyboard plan that opens the shots tab', () => {
    const plan = createStoryboardGenerationPlan('project-1');

    expect(plan.targetTab).toBe('shots');
    expect(plan.scene.projectId).toBe('project-1');
    expect(plan.shots).toHaveLength(3);
    expect(plan.shots.map((shot) => shot.shotNumber)).toEqual([1, 2, 3]);
  });

  it('creates shot plans from a requested starting shot number', () => {
    const shots = createStoryboardShotPlan('project-1', 4);

    expect(shots).toHaveLength(3);
    expect(shots.map((shot) => shot.shotNumber)).toEqual([4, 5, 6]);
    expect(shots.every((shot) => shot.projectId === 'project-1')).toBe(true);
  });
});
