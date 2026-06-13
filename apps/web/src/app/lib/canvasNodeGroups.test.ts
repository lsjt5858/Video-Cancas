import { describe, expect, it } from 'vitest';
import { buildCanvasNodeGroups } from './canvasNodeGroups';
import { CanvasNode, Scene, Shot } from '../types';

function makeNode(
  id: string,
  nodeType: CanvasNode['nodeType'],
  refId: string,
  position: CanvasNode['position'],
  data: Record<string, unknown> = {},
): CanvasNode {
  return {
    id,
    projectId: 'project-1',
    nodeType,
    title: id,
    position,
    size: { width: 100, height: 80 },
    refType: nodeType,
    refId,
    data,
  };
}

function makeScene(id: string, sceneNumber: number, characters: string[] = []): Scene {
  return {
    id,
    projectId: 'project-1',
    sceneNumber,
    description: id,
    location: 'Studio',
    timeOfDay: 'Day',
    characters,
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

describe('canvas node groups', () => {
  it('builds scene groups around scene, shot, and prompt nodes', () => {
    const groups = buildCanvasNodeGroups({
      nodes: [
        makeNode('scene-node', 'scene', 'scene-1', { x: 100, y: 100 }),
        makeNode('shot-node', 'shot', 'shot-1', { x: 360, y: 120 }),
        makeNode('prompt-node', 'prompt', 'shot-1', { x: 620, y: 140 }),
        makeNode('other-scene-node', 'scene', 'scene-2', { x: 100, y: 400 }),
      ],
      scenes: [makeScene('scene-1', 1), makeScene('scene-2', 2)],
      shots: [makeShot('shot-1', 'scene-1')],
      includeKinds: ['scene'],
    });

    expect(groups).toEqual([
      {
        id: 'scene-scene-1',
        kind: 'scene',
        label: '场景 1',
        nodeIds: ['scene-node', 'shot-node', 'prompt-node'],
        bounds: { x: 76, y: 76, width: 668, height: 168 },
      },
    ]);
  });

  it('builds character groups from character node scene references', () => {
    const groups = buildCanvasNodeGroups({
      nodes: [
        makeNode('character-node', 'character', 'character-1', { x: 40, y: 80 }, {
          character_name: 'Alice',
          scene_ids: ['scene-1'],
        }),
        makeNode('scene-node', 'scene', 'scene-1', { x: 300, y: 100 }),
        makeNode('shot-node', 'shot', 'shot-1', { x: 560, y: 120 }),
      ],
      scenes: [makeScene('scene-1', 1, ['Alice'])],
      shots: [makeShot('shot-1', 'scene-1')],
      includeKinds: ['character'],
    });

    expect(groups).toEqual([
      {
        id: 'character-character-node',
        kind: 'character',
        label: '角色：Alice',
        nodeIds: ['character-node', 'scene-node', 'shot-node'],
        bounds: { x: 16, y: 56, width: 668, height: 168 },
      },
    ]);
  });
});
