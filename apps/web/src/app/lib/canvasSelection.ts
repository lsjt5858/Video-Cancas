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

export type CanvasAlignDirection = 'left' | 'top';
export type CanvasDistributeDirection = 'horizontal' | 'vertical';

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

export function calculateAlignedNodePositions(
  nodes: CanvasNode[],
  selectedNodeIds: string[],
  direction: CanvasAlignDirection,
): Record<string, CanvasPoint> {
  const selectedNodes = getSelectedNodes(nodes, selectedNodeIds);
  if (selectedNodes.length < 2) {
    return {};
  }

  if (direction === 'left') {
    const left = Math.min(...selectedNodes.map(node => node.position.x));
    return Object.fromEntries(
      selectedNodes.map(node => [
        node.id,
        { x: left, y: node.position.y },
      ]),
    );
  }

  const top = Math.min(...selectedNodes.map(node => node.position.y));
  return Object.fromEntries(
    selectedNodes.map(node => [
      node.id,
      { x: node.position.x, y: top },
    ]),
  );
}

export function calculateDistributedNodePositions(
  nodes: CanvasNode[],
  selectedNodeIds: string[],
  direction: CanvasDistributeDirection,
): Record<string, CanvasPoint> {
  const selectedNodes = getSelectedNodes(nodes, selectedNodeIds);
  if (selectedNodes.length < 3) {
    return {};
  }

  const axis = direction === 'horizontal' ? 'x' : 'y';
  const sortedNodes = [...selectedNodes].sort((first, second) => (
    first.position[axis] - second.position[axis]
  ));
  const firstPosition = sortedNodes[0].position[axis];
  const lastPosition = sortedNodes[sortedNodes.length - 1].position[axis];
  const gap = (lastPosition - firstPosition) / (sortedNodes.length - 1);

  return Object.fromEntries(
    sortedNodes.map((node, index) => [
      node.id,
      axis === 'x'
        ? { x: firstPosition + gap * index, y: node.position.y }
        : { x: node.position.x, y: firstPosition + gap * index },
    ]),
  );
}

function getSelectedNodes(nodes: CanvasNode[], selectedNodeIds: string[]): CanvasNode[] {
  const selectedIds = new Set(selectedNodeIds);
  return nodes.filter(node => selectedIds.has(node.id));
}

function rectsIntersect(first: CanvasSelectionRect, second: CanvasSelectionRect): boolean {
  return (
    first.x <= second.x + second.width &&
    first.x + first.width >= second.x &&
    first.y <= second.y + second.height &&
    first.y + first.height >= second.y
  );
}
