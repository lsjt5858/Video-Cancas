import { describe, expect, it } from 'vitest';
import { calculateFitView } from './canvasViewport';
import { CanvasNode } from '../types';

const makeNode = (
  id: string,
  position: CanvasNode['position'],
  size: CanvasNode['size'],
): CanvasNode => ({
  id,
  projectId: 'project-1',
  nodeType: 'shot',
  position,
  size,
  data: {},
});

describe('canvas viewport', () => {
  it('calculates a view that fits all nodes with padding', () => {
    expect(
      calculateFitView(
        [
          makeNode('node-1', { x: 100, y: 80 }, { width: 200, height: 120 }),
          makeNode('node-2', { x: 700, y: 420 }, { width: 240, height: 180 }),
        ],
        { width: 1000, height: 700 },
        80,
      ),
    ).toEqual({
      scale: 1,
      offsetX: -20,
      offsetY: 10,
    });
  });

  it('returns the default view when there are no nodes', () => {
    expect(calculateFitView([], { width: 1000, height: 700 }, 80)).toEqual({
      scale: 1,
      offsetX: 0,
      offsetY: 0,
    });
  });
});
