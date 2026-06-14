import { describe, expect, it } from 'vitest';
import { CanvasEdge, CanvasNode } from '../types';
import {
  createCanvasSnapshot,
  prependCanvasSnapshot,
} from './canvasSnapshot';

const nodes: CanvasNode[] = [
  {
    id: 'node-1',
    projectId: 'project-1',
    nodeType: 'shot',
    title: '镜头 1',
    position: { x: 100, y: 120 },
    size: { width: 220, height: 160 },
    refType: 'shot',
    refId: 'shot-1',
    data: { prompt: 'rainy street' },
  },
];

const edges: CanvasEdge[] = [
  {
    id: 'edge-1',
    projectId: 'project-1',
    sourceNodeId: 'node-1',
    targetNodeId: 'node-2',
    relationType: 'story_flow',
    data: {},
  },
];

describe('canvas snapshot', () => {
  it('creates a serializable project canvas snapshot', () => {
    expect(createCanvasSnapshot({
      projectId: 'project-1',
      title: '手动快照',
      nodes,
      edges,
      createdAt: 1781430000000,
    })).toEqual({
      id: 'snapshot-project-1-1781430000000',
      projectId: 'project-1',
      title: '手动快照',
      createdAt: 1781430000000,
      nodeCount: 1,
      edgeCount: 1,
      nodes,
      edges,
    });
  });

  it('prepends snapshots and keeps the newest limited history', () => {
    const first = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'first',
      nodes,
      edges: [],
      createdAt: 1,
    });
    const second = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'second',
      nodes,
      edges,
      createdAt: 2,
    });

    expect(prependCanvasSnapshot([first], second, 1)).toEqual([second]);
  });
});
