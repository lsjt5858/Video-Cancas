import { CanvasNode } from '../types';
import {
  ImageGenerationParams,
  NormalizedImageGenerationParams,
  normalizeImageGenerationParams,
} from './imageGenerationParams';

export const CANVAS_IMAGE_GENERATION_PARAMS_KEY = 'image_generation_params';

export type CanvasBatchStyleUpdate = {
  nodeId: string;
  data: CanvasNode['data'];
};

export type CanvasBatchStyleSkipped = {
  nodeId: string;
  reason: 'unsupported_node';
};

export type CanvasBatchStyleApplicationPlan = {
  params: NormalizedImageGenerationParams;
  updates: CanvasBatchStyleUpdate[];
  skipped: CanvasBatchStyleSkipped[];
};

type CreateCanvasBatchStyleApplicationPlanInput = {
  selectedNodeIds: string[];
  nodes: CanvasNode[];
  params: ImageGenerationParams;
};

export function createCanvasBatchStyleApplicationPlan(
  input: CreateCanvasBatchStyleApplicationPlanInput,
): CanvasBatchStyleApplicationPlan {
  const normalizedParams = normalizeImageGenerationParams(input.params);
  const updates: CanvasBatchStyleUpdate[] = [];
  const skipped: CanvasBatchStyleSkipped[] = [];

  input.selectedNodeIds.forEach((nodeId) => {
    const node = input.nodes.find(item => item.id === nodeId);
    if (!node) return;

    if (node.nodeType !== 'shot' && node.nodeType !== 'prompt') {
      skipped.push({ nodeId, reason: 'unsupported_node' });
      return;
    }

    updates.push({
      nodeId,
      data: {
        ...node.data,
        [CANVAS_IMAGE_GENERATION_PARAMS_KEY]: normalizedParams,
      },
    });
  });

  return {
    params: normalizedParams,
    updates,
    skipped,
  };
}
