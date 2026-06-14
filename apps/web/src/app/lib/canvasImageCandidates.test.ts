import { describe, expect, it } from 'vitest';
import { getCanvasImageCandidates } from './canvasImageCandidates';
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

describe('canvas image candidates', () => {
  it('returns image assets for the linked shot newest first', () => {
    expect(getCanvasImageCandidates(makeShot(), [
      makeAsset('old-image', 'image', 'shot-1', 100),
      makeAsset('video', 'video', 'shot-1', 300),
      makeAsset('other-shot-image', 'image', 'shot-2', 400),
      makeAsset('new-image', 'image', 'shot-1', 200),
    ])).toEqual([
      {
        assetId: 'new-image',
        url: 'https://example.com/new-image.png',
        thumbnailUrl: 'https://example.com/new-image.png',
        label: '候选 1',
        isSelected: false,
        createdAt: 200,
      },
      {
        assetId: 'old-image',
        url: 'https://example.com/old-image.png',
        thumbnailUrl: 'https://example.com/old-image.png',
        label: '候选 2',
        isSelected: false,
        createdAt: 100,
      },
    ]);
  });

  it('marks the current shot image and uses asset thumbnails', () => {
    expect(getCanvasImageCandidates(
      makeShot({ imageUrl: 'https://example.com/selected.png' }),
      [
        makeAsset('selected', 'image', 'shot-1', 100, {
          url: 'https://example.com/selected.png',
          thumbnailUrl: 'https://example.com/thumb.png',
        }),
      ],
    )).toEqual([
      {
        assetId: 'selected',
        url: 'https://example.com/selected.png',
        thumbnailUrl: 'https://example.com/thumb.png',
        label: '候选 1',
        isSelected: true,
        createdAt: 100,
      },
    ]);
  });

  it('limits the displayed candidates when requested', () => {
    expect(getCanvasImageCandidates(makeShot(), [
      makeAsset('image-1', 'image', 'shot-1', 100),
      makeAsset('image-2', 'image', 'shot-1', 200),
      makeAsset('image-3', 'image', 'shot-1', 300),
    ], 2).map(candidate => candidate.assetId)).toEqual(['image-3', 'image-2']);
  });

  it('returns no candidates without a linked shot', () => {
    expect(getCanvasImageCandidates(undefined, [
      makeAsset('image', 'image', 'shot-1', 100),
    ])).toEqual([]);
  });
});
