import { describe, expect, it } from 'vitest';
import { getCanvasVideoCandidates } from './canvasVideoCandidates';
import { Asset, Shot } from '../types';

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

function makeAsset(
  id: string,
  type: Asset['type'],
  shotId: string | undefined,
  createdAt: number,
  overrides: Partial<Asset> = {},
): Asset {
  return {
    id,
    projectId: 'project-1',
    shotId,
    type,
    url: `https://example.com/${id}.${type === 'image' ? 'png' : 'mp4'}`,
    metadata: {},
    createdAt,
    ...overrides,
  };
}

describe('canvas video candidates', () => {
  it('returns video assets for the linked shot newest first', () => {
    expect(getCanvasVideoCandidates(makeShot(), [
      makeAsset('old-video', 'video', 'shot-1', 100),
      makeAsset('image', 'image', 'shot-1', 300),
      makeAsset('other-shot-video', 'video', 'shot-2', 400),
      makeAsset('new-video', 'video', 'shot-1', 200),
    ])).toEqual([
      {
        assetId: 'new-video',
        url: 'https://example.com/new-video.mp4',
        thumbnailUrl: 'https://example.com/new-video.mp4',
        label: '候选 1',
        isSelected: false,
        createdAt: 200,
      },
      {
        assetId: 'old-video',
        url: 'https://example.com/old-video.mp4',
        thumbnailUrl: 'https://example.com/old-video.mp4',
        label: '候选 2',
        isSelected: false,
        createdAt: 100,
      },
    ]);
  });

  it('marks the current shot video and uses asset thumbnails', () => {
    expect(getCanvasVideoCandidates(
      makeShot({ videoUrl: 'https://example.com/selected.mp4' }),
      [
        makeAsset('selected', 'video', 'shot-1', 100, {
          url: 'https://example.com/selected.mp4',
          thumbnailUrl: 'https://example.com/poster.png',
        }),
      ],
    )).toEqual([
      {
        assetId: 'selected',
        url: 'https://example.com/selected.mp4',
        thumbnailUrl: 'https://example.com/poster.png',
        label: '候选 1',
        isSelected: true,
        createdAt: 100,
      },
    ]);
  });

  it('limits the displayed candidates when requested', () => {
    expect(getCanvasVideoCandidates(makeShot(), [
      makeAsset('video-1', 'video', 'shot-1', 100),
      makeAsset('video-2', 'video', 'shot-1', 200),
      makeAsset('video-3', 'video', 'shot-1', 300),
    ], 2).map(candidate => candidate.assetId)).toEqual(['video-3', 'video-2']);
  });

  it('returns no candidates without a linked shot', () => {
    expect(getCanvasVideoCandidates(undefined, [
      makeAsset('video', 'video', 'shot-1', 100),
    ])).toEqual([]);
  });
});
