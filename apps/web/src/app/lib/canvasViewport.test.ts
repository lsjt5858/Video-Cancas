import { describe, expect, it } from 'vitest';
import {
  calculateCenteredView,
  calculateFitView,
  calculateFocusedView,
  calculateMiniMapLayout,
} from './canvasViewport';
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

  it('calculates a view that centers a selected node', () => {
    expect(
      calculateFocusedView(
        makeNode('node-1', { x: 700, y: 420 }, { width: 240, height: 180 }),
        { width: 1000, height: 700 },
        1,
      ),
    ).toEqual({
      scale: 1,
      offsetX: -320,
      offsetY: -160,
    });
  });

  it('calculates minimap layout for canvas nodes', () => {
    expect(
      calculateMiniMapLayout(
        [
          makeNode('node-1', { x: 100, y: 80 }, { width: 200, height: 120 }),
          makeNode('node-2', { x: 700, y: 420 }, { width: 240, height: 180 }),
        ],
        { width: 180, height: 120 },
        12,
      ),
    ).toEqual({
      bounds: {
        minX: 100,
        minY: 80,
        maxX: 940,
        maxY: 600,
        width: 840,
        height: 520,
      },
      scale: 0.18461538461538463,
      offsetX: 12.461538461538453,
      offsetY: 12,
      width: 180,
      height: 120,
    });
  });

  it('calculates a view centered on a world point', () => {
    expect(
      calculateCenteredView(
        { x: 520, y: 340 },
        { width: 1000, height: 700 },
        1,
      ),
    ).toEqual({
      scale: 1,
      offsetX: -20,
      offsetY: 10,
    });
  });
});
