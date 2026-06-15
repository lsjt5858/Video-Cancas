import { CanvasEdge, CanvasNode } from '../types';

export const CANVAS_SNAPSHOT_STORAGE_KEY = 'video-cancas-canvas-snapshots';
export const MAX_CANVAS_SNAPSHOT_HISTORY = 20;

export type CanvasSnapshot = {
  id: string;
  projectId: string;
  title: string;
  createdAt: number;
  nodeCount: number;
  edgeCount: number;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
};

export type CanvasSnapshotExport = {
  filename: string;
  json: string;
};

type CreateCanvasSnapshotInput = {
  projectId: string;
  title: string;
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  createdAt?: number;
};

export function createCanvasSnapshot(input: CreateCanvasSnapshotInput): CanvasSnapshot {
  const createdAt = input.createdAt ?? Date.now();

  return {
    id: `snapshot-${input.projectId}-${createdAt}`,
    projectId: input.projectId,
    title: input.title,
    createdAt,
    nodeCount: input.nodes.length,
    edgeCount: input.edges.length,
    nodes: input.nodes,
    edges: input.edges,
  };
}

export function prependCanvasSnapshot(
  snapshots: CanvasSnapshot[],
  snapshot: CanvasSnapshot,
  limit = MAX_CANVAS_SNAPSHOT_HISTORY,
): CanvasSnapshot[] {
  return [snapshot, ...snapshots.filter(item => item.id !== snapshot.id)].slice(0, limit);
}

export function getCanvasSnapshotsByProject(
  snapshots: CanvasSnapshot[],
  projectId: string,
): CanvasSnapshot[] {
  return snapshots
    .filter(snapshot => snapshot.projectId === projectId)
    .sort((a, b) => b.createdAt - a.createdAt);
}

export function loadCanvasSnapshots(storage: Storage): CanvasSnapshot[] {
  const raw = storage.getItem(CANVAS_SNAPSHOT_STORAGE_KEY);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter(isCanvasSnapshot) : [];
  } catch {
    return [];
  }
}

export function saveCanvasSnapshot(storage: Storage, snapshot: CanvasSnapshot): CanvasSnapshot[] {
  const snapshots = prependCanvasSnapshot(loadCanvasSnapshots(storage), snapshot);
  storage.setItem(CANVAS_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  return snapshots;
}

export function deleteCanvasSnapshot(storage: Storage, snapshotId: string): CanvasSnapshot[] {
  const snapshots = loadCanvasSnapshots(storage)
    .filter(snapshot => snapshot.id !== snapshotId);
  storage.setItem(CANVAS_SNAPSHOT_STORAGE_KEY, JSON.stringify(snapshots));
  return snapshots;
}

export function buildCanvasSnapshotExport(snapshot: CanvasSnapshot): CanvasSnapshotExport {
  return {
    filename: `canvas-snapshot-${snapshot.projectId}-${snapshot.createdAt}.json`,
    json: JSON.stringify(snapshot, null, 2),
  };
}

function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.id === 'string' &&
    typeof record.projectId === 'string' &&
    typeof record.title === 'string' &&
    typeof record.createdAt === 'number' &&
    Array.isArray(record.nodes) &&
    Array.isArray(record.edges)
  );
}
