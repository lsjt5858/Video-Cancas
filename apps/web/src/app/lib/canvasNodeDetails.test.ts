import { describe, expect, it } from 'vitest';
import { getCanvasNodeDetails } from './canvasNodeDetails';
import { CanvasNode, Scene, Shot } from '../types';

const scene: Scene = {
  id: 'scene-1',
  projectId: 'project-1',
  sceneNumber: 1,
  description: '母亲等待',
  location: '旧车站',
  timeOfDay: '黄昏',
  characters: ['母亲', '孩子'],
};

const shot: Shot = {
  id: 'shot-1',
  projectId: 'project-1',
  sceneId: 'scene-1',
  shotNumber: 2,
  description: '孩子穿过人群',
  shotType: 'wide',
  cameraMovement: 'tracking',
  duration: 4,
  dialogue: '妈妈，我回来了。',
  prompt: 'A child walks through the crowd at an old station',
};

function makeNode(
  nodeType: CanvasNode['nodeType'],
  refId: string | undefined,
): CanvasNode {
  return {
    id: `${nodeType}-node`,
    projectId: 'project-1',
    nodeType,
    title: nodeType === 'script' ? '旧车站重逢' : undefined,
    position: { x: 640, y: 80 },
    size: { width: 200, height: 180 },
    refType: nodeType,
    refId,
    data: { version: 1 },
  };
}

describe('canvas node details', () => {
  it('builds detail rows for a scene node', () => {
    expect(getCanvasNodeDetails(makeNode('scene', scene.id), [scene], [shot])).toMatchObject({
      title: '场景 1: 母亲等待',
      typeLabel: '场景',
      description: '旧车站 · 黄昏 · 母亲、孩子',
      rows: expect.arrayContaining([
        { label: '场景编号', value: '1' },
        { label: '地点', value: '旧车站' },
        { label: '时间', value: '黄昏' },
        { label: '角色', value: '母亲、孩子' },
      ]),
    });
  });

  it('builds detail rows for a shot node', () => {
    expect(getCanvasNodeDetails(makeNode('shot', shot.id), [scene], [shot])).toMatchObject({
      title: '镜头 2: 孩子穿过人群',
      typeLabel: '镜头',
      rows: expect.arrayContaining([
        { label: '镜头类型', value: 'wide' },
        { label: '运镜', value: 'tracking' },
        { label: '时长', value: '4s' },
        { label: '提示词', value: 'A child walks through the crowd at an old station' },
        { label: '台词', value: '妈妈，我回来了。' },
      ]),
    });
  });

  it('falls back to node metadata when no related entity exists', () => {
    expect(getCanvasNodeDetails(makeNode('script', 'script-1'), [], [])).toMatchObject({
      title: '旧车站重逢',
      typeLabel: '剧本',
      description: '项目剧本入口，后续可联动角色、场景和镜头节点。',
      rows: expect.arrayContaining([
        { label: '节点 ID', value: 'script-node' },
        { label: '位置', value: '640, 80' },
        { label: '尺寸', value: '200 x 180' },
      ]),
    });
  });
});
