import { describe, expect, it } from 'vitest';
import { searchCanvasNodes } from './canvasSearch';
import { CanvasNode, Scene, Shot } from '../types';

const nodes: CanvasNode[] = [
  {
    id: 'script-node',
    projectId: 'project-1',
    nodeType: 'script',
    title: '旧车站重逢',
    position: { x: 80, y: 80 },
    size: { width: 260, height: 180 },
    refType: 'script',
    refId: 'script-1',
    data: {},
  },
  {
    id: 'scene-node',
    projectId: 'project-1',
    nodeType: 'scene',
    title: '场景 1',
    position: { x: 360, y: 80 },
    size: { width: 240, height: 160 },
    refType: 'scene',
    refId: 'scene-1',
    data: {},
  },
  {
    id: 'shot-node',
    projectId: 'project-1',
    nodeType: 'shot',
    title: '镜头 2',
    position: { x: 640, y: 80 },
    size: { width: 200, height: 180 },
    refType: 'shot',
    refId: 'shot-1',
    data: {},
  },
];

const scenes: Scene[] = [
  {
    id: 'scene-1',
    projectId: 'project-1',
    sceneNumber: 1,
    description: '母亲等待',
    location: '旧车站',
    timeOfDay: '黄昏',
    characters: ['母亲', '孩子'],
  },
];

const shots: Shot[] = [
  {
    id: 'shot-1',
    projectId: 'project-1',
    sceneId: 'scene-1',
    shotNumber: 2,
    description: '孩子穿过人群',
    shotType: 'wide',
    cameraMovement: 'tracking',
    duration: 4,
    prompt: 'A child walks through the crowd at an old station',
  },
];

describe('canvas search', () => {
  it('matches scene location, character, shot number, shot prompt, and node title', () => {
    expect(searchCanvasNodes('旧车站', nodes, scenes, shots).map(result => result.node.id)).toEqual([
      'script-node',
      'scene-node',
    ]);
    expect(searchCanvasNodes('母亲', nodes, scenes, shots).map(result => result.node.id)).toEqual([
      'scene-node',
    ]);
    expect(searchCanvasNodes('镜头 2', nodes, scenes, shots).map(result => result.node.id)).toEqual([
      'shot-node',
    ]);
    expect(searchCanvasNodes('old station', nodes, scenes, shots).map(result => result.node.id)).toEqual([
      'shot-node',
    ]);
  });

  it('returns an empty result for a blank query', () => {
    expect(searchCanvasNodes('  ', nodes, scenes, shots)).toEqual([]);
  });
});
