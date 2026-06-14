import { describe, expect, it } from 'vitest';
import { CanvasNode, Shot } from '../types';
import {
  createCanvasBatchGenerationPlan,
  getCanvasBatchGenerationLabel,
} from './canvasBatchGeneration';

function makeNode(
  id: string,
  nodeType: CanvasNode['nodeType'],
  refId?: string,
): CanvasNode {
  return {
    id,
    projectId: 'project-1',
    nodeType,
    title: id,
    position: { x: 0, y: 0 },
    size: { width: 220, height: 160 },
    refType: refId ? 'shot' : undefined,
    refId,
    data: {},
  };
}

function makeShot(id: string, overrides: Partial<Shot> = {}): Shot {
  return {
    id,
    projectId: 'project-1',
    sceneId: 'scene-1',
    shotNumber: Number(id.replace('shot-', '')),
    description: `镜头 ${id}`,
    shotType: 'medium',
    cameraMovement: 'static',
    duration: 4,
    prompt: `prompt ${id}`,
    ...overrides,
  };
}

describe('canvas batch generation', () => {
  it('creates a unique image generation plan from selected shot and prompt nodes', () => {
    const plan = createCanvasBatchGenerationPlan({
      type: 'image',
      selectedNodeIds: ['shot-node-1', 'prompt-node-1', 'scene-node'],
      nodes: [
        makeNode('shot-node-1', 'shot', 'shot-1'),
        makeNode('prompt-node-1', 'prompt', 'shot-1'),
        makeNode('scene-node', 'scene', 'scene-1'),
      ],
      shots: [makeShot('shot-1')],
    });

    expect(plan.items).toEqual([
      {
        nodeId: 'shot-node-1',
        shotId: 'shot-1',
        shotNumber: 1,
        prompt: 'prompt shot-1',
        isRegeneration: false,
      },
    ]);
    expect(plan.skipped).toEqual([
      { nodeId: 'scene-node', reason: 'unsupported_node' },
    ]);
  });

  it('skips video generation when selected shots have no image input', () => {
    const plan = createCanvasBatchGenerationPlan({
      type: 'video',
      selectedNodeIds: ['shot-node-1', 'shot-node-2'],
      nodes: [
        makeNode('shot-node-1', 'shot', 'shot-1'),
        makeNode('shot-node-2', 'shot', 'shot-2'),
      ],
      shots: [
        makeShot('shot-1', { imageUrl: 'https://example.com/shot-1.png' }),
        makeShot('shot-2'),
      ],
    });

    expect(plan.items.map(item => item.shotId)).toEqual(['shot-1']);
    expect(plan.skipped).toEqual([
      { nodeId: 'shot-node-2', reason: 'missing_image' },
    ]);
  });

  it('uses regeneration labels when any planned shot already has a result', () => {
    const imagePlan = createCanvasBatchGenerationPlan({
      type: 'image',
      selectedNodeIds: ['shot-node-1', 'shot-node-2'],
      nodes: [
        makeNode('shot-node-1', 'shot', 'shot-1'),
        makeNode('shot-node-2', 'shot', 'shot-2'),
      ],
      shots: [
        makeShot('shot-1'),
        makeShot('shot-2', { imageUrl: 'https://example.com/existing.png' }),
      ],
    });
    const videoPlan = createCanvasBatchGenerationPlan({
      type: 'video',
      selectedNodeIds: ['shot-node-2'],
      nodes: [makeNode('shot-node-2', 'shot', 'shot-2')],
      shots: [
        makeShot('shot-2', {
          imageUrl: 'https://example.com/existing.png',
          videoUrl: 'https://example.com/existing.mp4',
        }),
      ],
    });

    expect(getCanvasBatchGenerationLabel(imagePlan)).toBe('批量重新生图');
    expect(getCanvasBatchGenerationLabel(videoPlan)).toBe('批量重新生视频');
  });
});
