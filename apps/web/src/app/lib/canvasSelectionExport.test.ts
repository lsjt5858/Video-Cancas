import { describe, expect, it } from 'vitest';
import { CanvasNode, Scene, Shot } from '../types';
import { buildCanvasSelectionExport } from './canvasSelectionExport';

const scenes: Scene[] = [
  {
    id: 'scene-1',
    projectId: 'project-1',
    sceneNumber: 1,
    description: '雨夜街头',
    location: '老城区',
    timeOfDay: '夜晚',
    characters: ['林夏'],
  },
];

const shots: Shot[] = [
  {
    id: 'shot-1',
    projectId: 'project-1',
    sceneId: 'scene-1',
    shotNumber: 3,
    description: '林夏撑伞回头',
    shotType: 'medium',
    cameraMovement: 'tracking',
    duration: 4,
    dialogue: '你终于来了。',
    prompt: 'cinematic rainy street, neon light',
    imageUrl: 'https://example.com/shot.png',
    videoUrl: 'https://example.com/shot.mp4',
  },
];

function makeNode(
  id: string,
  nodeType: CanvasNode['nodeType'],
  refId?: string,
  data: CanvasNode['data'] = {},
): CanvasNode {
  return {
    id,
    projectId: 'project-1',
    nodeType,
    title: `${nodeType} title`,
    position: { x: 100, y: 120 },
    size: { width: 260, height: 180 },
    refType: refId ? nodeType : undefined,
    refId,
    data,
  };
}

describe('canvas selection export', () => {
  it('exports selected shot, prompt, and result nodes as rows, JSON, and CSV', () => {
    const exportData = buildCanvasSelectionExport({
      selectedNodeIds: ['shot-node', 'prompt-node', 'image-node'],
      nodes: [
        makeNode('shot-node', 'shot', 'shot-1'),
        makeNode('prompt-node', 'prompt', 'shot-1'),
        makeNode('image-node', 'image_result', undefined, {
          url: 'https://example.com/generated.png',
          thumbnail_url: 'https://example.com/generated-thumb.png',
          shot_id: 'shot-1',
          asset_type: 'image',
        }),
      ],
      scenes,
      shots,
    });

    expect(exportData.rows).toEqual([
      expect.objectContaining({
        nodeId: 'shot-node',
        nodeType: 'shot',
        sceneNumber: 1,
        shotNumber: 3,
        description: '林夏撑伞回头',
        prompt: 'cinematic rainy street, neon light',
        imageUrl: 'https://example.com/shot.png',
        videoUrl: 'https://example.com/shot.mp4',
      }),
      expect.objectContaining({
        nodeId: 'prompt-node',
        nodeType: 'prompt',
        prompt: 'cinematic rainy street, neon light',
      }),
      expect.objectContaining({
        nodeId: 'image-node',
        nodeType: 'image_result',
        resultType: 'image',
        resultUrl: 'https://example.com/generated.png',
        sourceShotId: 'shot-1',
      }),
    ]);
    expect(JSON.parse(exportData.json)).toHaveLength(3);
    expect(exportData.csv).toContain('nodeId,nodeType,title');
    expect(exportData.csv).toContain('"cinematic rainy street, neon light"');
  });

  it('preserves the selection order and skips ids that are not visible', () => {
    const exportData = buildCanvasSelectionExport({
      selectedNodeIds: ['missing-node', 'scene-node'],
      nodes: [makeNode('scene-node', 'scene', 'scene-1')],
      scenes,
      shots,
    });

    expect(exportData.rows.map(row => row.nodeId)).toEqual(['scene-node']);
    expect(exportData.filename).toMatch(/^canvas-selection-/);
  });
});
