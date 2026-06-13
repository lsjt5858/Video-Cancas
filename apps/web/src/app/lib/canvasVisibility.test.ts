import { describe, expect, it } from 'vitest';
import { getVisibleCanvasGraph } from './canvasVisibility';
import { CanvasEdge, CanvasNode, Shot } from '../types';

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
    size: { width: 100, height: 80 },
    refType: nodeType,
    refId,
    data: {},
  };
}

function makeShot(id: string, sceneId: string): Shot {
  return {
    id,
    projectId: 'project-1',
    sceneId,
    shotNumber: 1,
    description: id,
    shotType: 'wide',
    cameraMovement: 'static',
    duration: 3,
    prompt: `Prompt for ${id}`,
  };
}

function makeEdge(id: string, sourceNodeId: string, targetNodeId: string): CanvasEdge {
  return {
    id,
    projectId: 'project-1',
    sourceNodeId,
    targetNodeId,
    relationType: 'story_flow',
    data: {},
  };
}

describe('canvas visibility', () => {
  it('hides shot and prompt nodes that belong to collapsed scenes', () => {
    const nodes = [
      makeNode('script-node', 'script', 'script-1'),
      makeNode('scene-1-node', 'scene', 'scene-1'),
      makeNode('scene-2-node', 'scene', 'scene-2'),
      makeNode('shot-1-node', 'shot', 'shot-1'),
      makeNode('prompt-1-node', 'prompt', 'shot-1'),
      makeNode('shot-2-node', 'shot', 'shot-2'),
    ];
    const shots = [
      makeShot('shot-1', 'scene-1'),
      makeShot('shot-2', 'scene-2'),
    ];

    expect(getVisibleCanvasGraph(nodes, [], shots, ['scene-1']).visibleNodes.map(node => node.id)).toEqual([
      'script-node',
      'scene-1-node',
      'scene-2-node',
      'shot-2-node',
    ]);
  });

  it('removes edges connected to hidden nodes', () => {
    const nodes = [
      makeNode('scene-node', 'scene', 'scene-1'),
      makeNode('shot-node', 'shot', 'shot-1'),
      makeNode('prompt-node', 'prompt', 'shot-1'),
      makeNode('export-node', 'export', 'export-1'),
    ];
    const edges = [
      makeEdge('scene-shot', 'scene-node', 'shot-node'),
      makeEdge('shot-prompt', 'shot-node', 'prompt-node'),
      makeEdge('scene-export', 'scene-node', 'export-node'),
    ];
    const shots = [makeShot('shot-1', 'scene-1')];

    expect(getVisibleCanvasGraph(nodes, edges, shots, ['scene-1']).visibleEdges.map(edge => edge.id)).toEqual([
      'scene-export',
    ]);
  });
});
