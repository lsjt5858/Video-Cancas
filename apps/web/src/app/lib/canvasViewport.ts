import { CanvasNode } from '../types';

type ViewportSize = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

export type CanvasViewport = {
  scale: number;
  offsetX: number;
  offsetY: number;
};

export type CanvasBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
};

export type MiniMapLayout = {
  bounds: CanvasBounds;
  scale: number;
  offsetX: number;
  offsetY: number;
  width: number;
  height: number;
};

export function calculateFitView(
  nodes: CanvasNode[],
  viewport: ViewportSize,
  padding = 80,
): CanvasViewport {
  if (nodes.length === 0 || viewport.width <= 0 || viewport.height <= 0) {
    return { scale: 1, offsetX: 0, offsetY: 0 };
  }

  const bounds = nodes.reduce(
    (current, node) => ({
      minX: Math.min(current.minX, node.position.x),
      minY: Math.min(current.minY, node.position.y),
      maxX: Math.max(current.maxX, node.position.x + node.size.width),
      maxY: Math.max(current.maxY, node.position.y + node.size.height),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  const contentWidth = Math.max(bounds.maxX - bounds.minX, 1);
  const contentHeight = Math.max(bounds.maxY - bounds.minY, 1);
  const scale = Math.min(
    2,
    Math.max(
      0.5,
      Math.min(
        (viewport.width - padding * 2) / contentWidth,
        (viewport.height - padding * 2) / contentHeight,
      ),
    ),
  );

  return {
    scale,
    offsetX: (viewport.width - contentWidth * scale) / 2 - bounds.minX * scale,
    offsetY: (viewport.height - contentHeight * scale) / 2 - bounds.minY * scale,
  };
}

export function calculateFocusedView(
  node: CanvasNode,
  viewport: ViewportSize,
  scale: number,
): CanvasViewport {
  const clampedScale = Math.min(2, Math.max(0.5, scale));
  const nodeCenterX = node.position.x + node.size.width / 2;
  const nodeCenterY = node.position.y + node.size.height / 2;

  return {
    scale: clampedScale,
    offsetX: viewport.width / 2 - nodeCenterX * clampedScale,
    offsetY: viewport.height / 2 - nodeCenterY * clampedScale,
  };
}

export function calculateCenteredView(
  point: Point,
  viewport: ViewportSize,
  scale: number,
): CanvasViewport {
  const clampedScale = Math.min(2, Math.max(0.5, scale));

  return {
    scale: clampedScale,
    offsetX: viewport.width / 2 - point.x * clampedScale,
    offsetY: viewport.height / 2 - point.y * clampedScale,
  };
}

export function calculateMiniMapLayout(
  nodes: CanvasNode[],
  size: ViewportSize,
  padding = 12,
): MiniMapLayout | null {
  if (nodes.length === 0 || size.width <= 0 || size.height <= 0) {
    return null;
  }

  const bounds = getCanvasBounds(nodes);
  const availableWidth = Math.max(size.width - padding * 2, 1);
  const availableHeight = Math.max(size.height - padding * 2, 1);
  const scale = Math.min(availableWidth / bounds.width, availableHeight / bounds.height);
  const renderedWidth = bounds.width * scale;
  const renderedHeight = bounds.height * scale;

  return {
    bounds,
    scale,
    offsetX: (size.width - renderedWidth) / 2,
    offsetY: (size.height - renderedHeight) / 2,
    width: size.width,
    height: size.height,
  };
}

function getCanvasBounds(nodes: CanvasNode[]): CanvasBounds {
  const rawBounds = nodes.reduce(
    (current, node) => ({
      minX: Math.min(current.minX, node.position.x),
      minY: Math.min(current.minY, node.position.y),
      maxX: Math.max(current.maxX, node.position.x + node.size.width),
      maxY: Math.max(current.maxY, node.position.y + node.size.height),
    }),
    {
      minX: Number.POSITIVE_INFINITY,
      minY: Number.POSITIVE_INFINITY,
      maxX: Number.NEGATIVE_INFINITY,
      maxY: Number.NEGATIVE_INFINITY,
    },
  );

  return {
    ...rawBounds,
    width: Math.max(rawBounds.maxX - rawBounds.minX, 1),
    height: Math.max(rawBounds.maxY - rawBounds.minY, 1),
  };
}
