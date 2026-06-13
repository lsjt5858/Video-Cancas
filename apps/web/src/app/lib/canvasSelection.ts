import { CanvasNode } from '../types';

export type CanvasPoint = {
  x: number;
  y: number;
};

export type CanvasSelectionRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export function normalizeSelectionRect(
  start: CanvasPoint,
  end: CanvasPoint,
): CanvasSelectionRect {
  return {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  };
}

export function getCanvasNodesInSelection(
  nodes: CanvasNode[],
  selectionRect: CanvasSelectionRect,
): string[] {
  return nodes
    .filter(node => rectsIntersect(
      selectionRect,
      {
        x: node.position.x,
        y: node.position.y,
        width: node.size.width,
        height: node.size.height,
      },
    ))
    .map(node => node.id);
}

export function applyNodeSelectionDelta(
  nodes: CanvasNode[],
  selectedNodeIds: string[],
  delta: CanvasPoint,
): Record<string, CanvasPoint> {
  const selectedIds = new Set(selectedNodeIds);

  return Object.fromEntries(
    nodes
      .filter(node => selectedIds.has(node.id))
      .map(node => [
        node.id,
        {
          x: node.position.x + delta.x,
          y: node.position.y + delta.y,
        },
      ]),
  );
}

function rectsIntersect(first: CanvasSelectionRect, second: CanvasSelectionRect): boolean {
  return (
    first.x <= second.x + second.width &&
    first.x + first.width >= second.x &&
    first.y <= second.y + second.height &&
    first.y + first.height >= second.y
  );
}
