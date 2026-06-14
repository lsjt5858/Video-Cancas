import { describe, expect, it } from 'vitest';
import { getCanvasGenerationResultPreviews } from './canvasGenerationResults';
import { GenerationTask, Shot } from '../types';

function makeShot(overrides: Partial<Shot> = {}): Shot {
  return {
    id: 'shot-1',
    projectId: 'project-1',
    sceneId: 'scene-1',
    shotNumber: 1,
    description: '角色走进房间',
    shotType: 'medium',
    cameraMovement: 'tracking',
    duration: 5,
    prompt: 'A character walks into a room',
    ...overrides,
  };
}

function makeTask(
  id: string,
  type: GenerationTask['type'],
  createdAt: number,
  resultUrl?: string,
): GenerationTask {
  return {
    id,
    projectId: 'project-1',
    shotId: 'shot-1',
    type,
    status: resultUrl ? 'completed' : 'processing',
    prompt: `${type} prompt`,
    createdAt,
    resultUrl,
  };
}

describe('canvas generation result previews', () => {
  it('prefers shot result urls over task result urls', () => {
    expect(getCanvasGenerationResultPreviews(
      makeShot({
        imageUrl: 'https://example.com/shot-image.png',
        videoUrl: 'https://example.com/shot-video.mp4',
      }),
      [
        makeTask('image-task', 'image', 100, 'https://example.com/task-image.png'),
        makeTask('video-task', 'video', 100, 'https://example.com/task-video.mp4'),
      ],
    )).toEqual([
      {
        type: 'image',
        label: '图片结果',
        url: 'https://example.com/shot-image.png',
        thumbnailUrl: 'https://example.com/shot-image.png',
      },
      {
        type: 'video',
        label: '视频结果',
        url: 'https://example.com/shot-video.mp4',
        thumbnailUrl: 'https://example.com/shot-image.png',
      },
    ]);
  });

  it('uses the latest completed task result when shot urls are missing', () => {
    expect(getCanvasGenerationResultPreviews(makeShot(), [
      makeTask('old-image', 'image', 100, 'https://example.com/old-image.png'),
      makeTask('new-image', 'image', 200, 'https://example.com/new-image.png'),
      makeTask('processing-video', 'video', 300),
    ])).toEqual([
      {
        type: 'image',
        label: '图片结果',
        url: 'https://example.com/new-image.png',
        thumbnailUrl: 'https://example.com/new-image.png',
      },
    ]);
  });

  it('returns no previews when there are no completed results', () => {
    expect(getCanvasGenerationResultPreviews(makeShot(), [
      makeTask('processing-image', 'image', 100),
    ])).toEqual([]);
  });
});
