import { describe, expect, it } from 'vitest';
import { Asset } from '../types';
import { createCanvasNodeInputFromAssetDrop } from './canvasAssetDrop';

const baseAsset: Asset = {
  id: 'asset-1',
  projectId: 'project-1',
  shotId: 'shot-1',
  type: 'image',
  url: 'https://example.com/image.png',
  thumbnailUrl: 'https://example.com/thumb.png',
  metadata: {
    width: 1024,
    height: 576,
    prompt: 'A cinematic street shot',
  },
  createdAt: 1781430000000,
};

describe('canvas asset drop', () => {
  it('builds an image result canvas node from a dropped image asset', () => {
    expect(createCanvasNodeInputFromAssetDrop(baseAsset, { x: 420, y: 240 })).toEqual({
      nodeType: 'image_result',
      title: '图片素材',
      position: { x: 420, y: 240 },
      size: { width: 260, height: 180 },
      refType: 'asset',
      refId: 'asset-1',
      data: {
        source: 'asset_library',
        asset_id: 'asset-1',
        shot_id: 'shot-1',
        asset_type: 'image',
        url: 'https://example.com/image.png',
        thumbnail_url: 'https://example.com/thumb.png',
        metadata: {
          width: 1024,
          height: 576,
          prompt: 'A cinematic street shot',
        },
      },
    });
  });

  it('builds a video result canvas node from a dropped video asset', () => {
    const videoAsset: Asset = {
      ...baseAsset,
      id: 'asset-2',
      type: 'video',
      url: 'https://example.com/video.mp4',
      thumbnailUrl: undefined,
      metadata: {
        duration: 4,
        format: 'mp4',
      },
    };

    expect(createCanvasNodeInputFromAssetDrop(videoAsset, { x: 120, y: 80 })).toMatchObject({
      nodeType: 'video_result',
      title: '视频素材',
      position: { x: 120, y: 80 },
      refType: 'asset',
      refId: 'asset-2',
      data: {
        source: 'asset_library',
        asset_id: 'asset-2',
        shot_id: 'shot-1',
        asset_type: 'video',
        url: 'https://example.com/video.mp4',
        thumbnail_url: 'https://example.com/video.mp4',
        metadata: {
          duration: 4,
          format: 'mp4',
        },
      },
    });
  });
});
