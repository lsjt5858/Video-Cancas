import { describe, expect, it } from 'vitest';
import {
  getCanvasGenerationProgressItems,
  getLatestGenerationTaskByType,
} from './canvasGenerationProgress';
import { GenerationTask } from '../types';

function makeTask(
  id: string,
  type: GenerationTask['type'],
  status: GenerationTask['status'],
  createdAt: number,
  overrides: Partial<GenerationTask> = {},
): GenerationTask {
  return {
    id,
    projectId: 'project-1',
    shotId: 'shot-1',
    type,
    status,
    prompt: `${type} prompt`,
    createdAt,
    ...overrides,
  };
}

describe('canvas generation progress', () => {
  it('selects the latest generation task by type for a shot', () => {
    const tasks = [
      makeTask('old-image', 'image', 'completed', 100),
      makeTask('new-image', 'image', 'processing', 200),
      makeTask('video', 'video', 'pending', 150),
    ];

    expect(getLatestGenerationTaskByType(tasks, 'shot-1', 'image')?.id).toBe('new-image');
    expect(getLatestGenerationTaskByType(tasks, 'shot-1', 'video')?.id).toBe('video');
  });

  it('formats pending, processing, completed, and failed progress states', () => {
    const items = getCanvasGenerationProgressItems([
      makeTask('pending-image', 'image', 'pending', 100),
      makeTask('processing-video', 'video', 'processing', 200),
      makeTask('completed-image', 'image', 'completed', 300),
      makeTask('failed-video', 'video', 'failed', 400, { error: 'Provider timeout' }),
    ], 'shot-1');

    expect(items).toEqual([
      { taskId: 'completed-image', type: 'image', label: '图片生成完成', tone: 'success', progressLabel: '100%' },
      { taskId: 'failed-video', type: 'video', label: '视频生成失败', tone: 'error', progressLabel: '失败', description: 'Provider timeout' },
    ]);
  });

  it('returns no progress items when the shot has no generation tasks', () => {
    expect(getCanvasGenerationProgressItems([], 'shot-1')).toEqual([]);
  });
});
