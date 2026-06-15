import { describe, expect, it } from 'vitest';
import { CanvasEdge, CanvasNode } from '../types';
import {
  createCanvasSnapshot,
  deleteCanvasSnapshot,
  getCanvasSnapshotsByProject,
  loadCanvasSnapshots,
  prependCanvasSnapshot,
  saveCanvasSnapshot,
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

  it('loads and saves snapshots through storage', () => {
    const storage = new MemoryStorage();
    const snapshot = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'stored',
      nodes,
      edges,
      createdAt: 3,
    });

    expect(saveCanvasSnapshot(storage, snapshot)).toEqual([snapshot]);
    expect(loadCanvasSnapshots(storage)).toEqual([snapshot]);
  });

  it('returns snapshots for one project in newest-first order', () => {
    const projectSnapshot = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'older',
      nodes,
      edges,
      createdAt: 10,
    });
    const otherProjectSnapshot = createCanvasSnapshot({
      projectId: 'project-2',
      title: 'other',
      nodes: [],
      edges: [],
      createdAt: 20,
    });
    const newestProjectSnapshot = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'newer',
      nodes,
      edges: [],
      createdAt: 30,
    });

    expect(getCanvasSnapshotsByProject([
      projectSnapshot,
      otherProjectSnapshot,
      newestProjectSnapshot,
    ], 'project-1')).toEqual([
      newestProjectSnapshot,
      projectSnapshot,
    ]);
  });

  it('deletes one snapshot from storage and keeps the remaining history', () => {
    const storage = new MemoryStorage();
    const first = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'first',
      nodes,
      edges,
      createdAt: 1,
    });
    const second = createCanvasSnapshot({
      projectId: 'project-1',
      title: 'second',
      nodes,
      edges: [],
      createdAt: 2,
    });
    saveCanvasSnapshot(storage, first);
    saveCanvasSnapshot(storage, second);

    expect(deleteCanvasSnapshot(storage, first.id)).toEqual([second]);
    expect(loadCanvasSnapshots(storage)).toEqual([second]);
  });
});

class MemoryStorage implements Storage {
  private values = new Map<string, string>();

  get length() {
    return this.values.size;
  }

  clear(): void {
    this.values.clear();
  }

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  key(index: number): string | null {
    return Array.from(this.values.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}
