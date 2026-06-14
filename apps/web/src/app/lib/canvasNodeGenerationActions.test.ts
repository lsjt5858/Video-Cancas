import { describe, expect, it } from 'vitest';
import { getCanvasNodeGenerationActions } from './canvasNodeGenerationActions';
import { CanvasNode, Shot } from '../types';

function makeNode(nodeType: CanvasNode['nodeType']): CanvasNode {
  return {
    id: `${nodeType}-node`,
    projectId: 'project-1',
    nodeType,
    title: `${nodeType} title`,
    position: { x: 100, y: 120 },
    size: { width: 220, height: 160 },
    refType: nodeType,
    refId: `${nodeType}-1`,
    data: {},
  };
}

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

describe('canvas node generation actions', () => {
  it('shows image and video generation actions for shot nodes', () => {
    expect(getCanvasNodeGenerationActions(makeNode('shot'), makeShot())).toEqual([
      { action: 'generate_image', label: '生图' },
      { action: 'generate_video', label: '生视频' },
    ]);
  });

  it('shows regeneration labels when the shot already has generated results', () => {
    expect(getCanvasNodeGenerationActions(makeNode('prompt'), makeShot({
      imageUrl: 'https://example.com/image.png',
      videoUrl: 'https://example.com/video.mp4',
    }))).toEqual([
      { action: 'generate_image', label: '重新生图' },
      { action: 'generate_video', label: '重新生视频' },
    ]);
  });

  it('does not show generation actions for unsupported nodes or missing shot data', () => {
    expect(getCanvasNodeGenerationActions(makeNode('scene'), makeShot())).toEqual([]);
    expect(getCanvasNodeGenerationActions(makeNode('shot'))).toEqual([]);
  });
});
