import { describe, expect, it } from 'vitest';
import {
  applyNodeSelectionDelta,
  calculateAlignedNodePositions,
  calculateDistributedNodePositions,
  getCanvasNodesInSelection,
  normalizeSelectionRect,
} from './canvasSelection';
import { CanvasNode } from '../types';

function makeNode(
  id: string,
  position: CanvasNode['position'],
  size: CanvasNode['size'] = { width: 100, height: 80 },
): CanvasNode {
  return {
    id,
    projectId: 'project-1',
    nodeType: 'shot',
    title: id,
    position,
    size,
    data: {},
  };
}

describe('canvas selection', () => {
  it('normalizes a selection rectangle dragged in any direction', () => {
    expect(normalizeSelectionRect({ x: 320, y: 240 }, { x: 120, y: 80 })).toEqual({
      x: 120,
      y: 80,
      width: 200,
      height: 160,
    });
  });

  it('selects nodes whose bounds intersect the selection rectangle', () => {
    const nodes = [
      makeNode('inside', { x: 140, y: 100 }),
      makeNode('intersecting', { x: 300, y: 220 }),
      makeNode('outside', { x: 520, y: 420 }),
    ];

    expect(
      getCanvasNodesInSelection(nodes, { x: 120, y: 80, width: 220, height: 180 }),
    ).toEqual(['inside', 'intersecting']);
  });

  it('moves selected nodes by the same delta and leaves unselected nodes unchanged', () => {
    const nodes = [
      makeNode('first', { x: 100, y: 100 }),
      makeNode('second', { x: 260, y: 100 }),
      makeNode('third', { x: 420, y: 100 }),
    ];

    expect(applyNodeSelectionDelta(nodes, ['first', 'second'], { x: 30, y: -20 })).toEqual({
      first: { x: 130, y: 80 },
      second: { x: 290, y: 80 },
    });
  });

  it('aligns selected nodes to the left or top edge of their selection bounds', () => {
    const nodes = [
      makeNode('first', { x: 220, y: 180 }),
      makeNode('second', { x: 100, y: 260 }),
      makeNode('third', { x: 360, y: 120 }),
    ];

    expect(calculateAlignedNodePositions(nodes, ['first', 'second', 'third'], 'left')).toEqual({
      first: { x: 100, y: 180 },
      second: { x: 100, y: 260 },
      third: { x: 100, y: 120 },
    });
    expect(calculateAlignedNodePositions(nodes, ['first', 'second', 'third'], 'top')).toEqual({
      first: { x: 220, y: 120 },
      second: { x: 100, y: 120 },
      third: { x: 360, y: 120 },
    });
  });

  it('distributes selected nodes evenly while keeping the outer nodes fixed', () => {
    const nodes = [
      makeNode('left', { x: 100, y: 100 }),
      makeNode('middle', { x: 220, y: 260 }),
      makeNode('right', { x: 500, y: 180 }),
    ];

    expect(calculateDistributedNodePositions(nodes, ['left', 'middle', 'right'], 'horizontal')).toEqual({
      left: { x: 100, y: 100 },
      middle: { x: 300, y: 260 },
      right: { x: 500, y: 180 },
    });
    expect(calculateDistributedNodePositions(nodes, ['left', 'middle', 'right'], 'vertical')).toEqual({
      left: { x: 100, y: 100 },
      right: { x: 500, y: 180 },
      middle: { x: 220, y: 260 },
    });
  });
});
