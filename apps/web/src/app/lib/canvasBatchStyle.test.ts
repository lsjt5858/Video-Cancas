import { describe, expect, it } from 'vitest';
import { CanvasNode } from '../types';
import { createDefaultImageGenerationParams } from './imageGenerationParams';
import { createCanvasBatchStyleApplicationPlan } from './canvasBatchStyle';

function makeNode(
  id: string,
  nodeType: CanvasNode['nodeType'],
  data: CanvasNode['data'] = {},
): CanvasNode {
  return {
    id,
    projectId: 'project-1',
    nodeType,
    title: id,
    position: { x: 0, y: 0 },
    size: { width: 220, height: 160 },
    data,
  };
}

describe('canvas batch style', () => {
  it('builds node updates for selected shot and prompt nodes', () => {
    const params = {
      ...createDefaultImageGenerationParams(),
      style: 'anime' as const,
      aspectRatio: '9:16' as const,
      negativePrompt: ' low quality ',
      seed: '42',
      candidateCount: 12,
    };

    const plan = createCanvasBatchStyleApplicationPlan({
      selectedNodeIds: ['shot-node', 'prompt-node', 'scene-node'],
      nodes: [
        makeNode('shot-node', 'shot', { keep: true }),
        makeNode('prompt-node', 'prompt'),
        makeNode('scene-node', 'scene'),
      ],
      params,
    });

    expect(plan.updates).toEqual([
      {
        nodeId: 'shot-node',
        data: {
          keep: true,
          image_generation_params: {
            aspectRatio: '9:16',
            style: 'anime',
            referenceMode: 'none',
            referenceNodeIds: [],
            negativePrompt: 'low quality',
            seed: 42,
            candidateCount: 8,
          },
        },
      },
      {
        nodeId: 'prompt-node',
        data: {
          image_generation_params: {
            aspectRatio: '9:16',
            style: 'anime',
            referenceMode: 'none',
            referenceNodeIds: [],
            negativePrompt: 'low quality',
            seed: 42,
            candidateCount: 8,
          },
        },
      },
    ]);
    expect(plan.skipped).toEqual([
      { nodeId: 'scene-node', reason: 'unsupported_node' },
    ]);
  });

  it('skips ids that are not visible without reporting them as unsupported', () => {
    const plan = createCanvasBatchStyleApplicationPlan({
      selectedNodeIds: ['missing-node', 'shot-node'],
      nodes: [makeNode('shot-node', 'shot')],
      params: createDefaultImageGenerationParams(),
    });

    expect(plan.updates.map(update => update.nodeId)).toEqual(['shot-node']);
    expect(plan.skipped).toEqual([]);
  });
});
