import { describe, expect, it } from 'vitest';
import { CanvasNode } from '../types';
import {
  createAssetInputFromCanvasResultNode,
  canSaveCanvasResultNodeToAssetLibrary,
} from './canvasAssetSave';

function makeResultNode(
  nodeType: 'image_result' | 'video_result',
  data: CanvasNode['data'],
): CanvasNode {
  return {
    id: `${nodeType}-node`,
    projectId: 'project-1',
    nodeType,
    title: nodeType === 'image_result' ? '图片结果' : '视频结果',
    position: { x: 100, y: 120 },
    size: { width: 260, height: 180 },
    data,
  };
}

describe('canvas asset save', () => {
  it('builds an asset input from an image result node and keeps source tracing', () => {
    const node = makeResultNode('image_result', {
      url: 'https://example.com/image.png',
      thumbnail_url: 'https://example.com/thumb.png',
      shot_id: 'shot-1',
      task_id: 'task-1',
      metadata: {
        width: 1024,
        height: 576,
        prompt: 'cinematic city',
      },
    });

    expect(createAssetInputFromCanvasResultNode(node)).toEqual({
      projectId: 'project-1',
      shotId: 'shot-1',
      type: 'image',
      url: 'https://example.com/image.png',
      thumbnailUrl: 'https://example.com/thumb.png',
      metadata: {
        width: 1024,
        height: 576,
        prompt: 'cinematic city',
        sourceCanvasNodeId: 'image_result-node',
        sourceTaskId: 'task-1',
        source: 'canvas_result_node',
      },
    });
  });

  it('uses the video url as fallback thumbnail and rejects result nodes without urls', () => {
    const videoNode = makeResultNode('video_result', {
      url: 'https://example.com/video.mp4',
      shot_id: 'shot-2',
      metadata: {
        duration: 5,
        format: 'mp4',
      },
    });

    expect(createAssetInputFromCanvasResultNode(videoNode)).toMatchObject({
      type: 'video',
      url: 'https://example.com/video.mp4',
      thumbnailUrl: 'https://example.com/video.mp4',
      metadata: {
        duration: 5,
        format: 'mp4',
        sourceCanvasNodeId: 'video_result-node',
      },
    });

    const emptyNode = makeResultNode('image_result', {});
    expect(canSaveCanvasResultNodeToAssetLibrary(emptyNode)).toBe(false);
    expect(createAssetInputFromCanvasResultNode(emptyNode)).toBeNull();
  });
});
