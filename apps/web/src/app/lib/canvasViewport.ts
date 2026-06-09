import { CanvasNode } from '../types';

type ViewportSize = {
  width: number;
  height: number;
};

export type CanvasViewport = {
  scale: number;
  offsetX: number;
  offsetY: number;
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
