import { CanvasNode, Shot } from '../types';

export type CanvasBatchGenerationType = 'image' | 'video';

export type CanvasBatchGenerationItem = {
  nodeId: string;
  shotId: string;
  shotNumber: number;
  prompt: string;
};

export type CanvasBatchGenerationSkippedReason =
  | 'unsupported_node'
  | 'missing_shot'
  | 'missing_image';

export type CanvasBatchGenerationSkipped = {
  nodeId: string;
  reason: CanvasBatchGenerationSkippedReason;
};

export type CanvasBatchGenerationPlan = {
  type: CanvasBatchGenerationType;
  items: CanvasBatchGenerationItem[];
  skipped: CanvasBatchGenerationSkipped[];
};

type CreateCanvasBatchGenerationPlanInput = {
  type: CanvasBatchGenerationType;
  selectedNodeIds: string[];
  nodes: CanvasNode[];
  shots: Shot[];
};

export function createCanvasBatchGenerationPlan(
  input: CreateCanvasBatchGenerationPlanInput,
): CanvasBatchGenerationPlan {
  const items: CanvasBatchGenerationItem[] = [];
  const skipped: CanvasBatchGenerationSkipped[] = [];
  const plannedShotIds = new Set<string>();

  input.selectedNodeIds.forEach((nodeId) => {
    const node = input.nodes.find(item => item.id === nodeId);
    if (!node) return;

    if (node.nodeType !== 'shot' && node.nodeType !== 'prompt') {
      skipped.push({ nodeId, reason: 'unsupported_node' });
      return;
    }

    const shot = node.refId
      ? input.shots.find(item => item.id === node.refId)
      : undefined;
    if (!shot) {
      skipped.push({ nodeId, reason: 'missing_shot' });
      return;
    }

    if (plannedShotIds.has(shot.id)) {
      return;
    }

    if (input.type === 'video' && !shot.imageUrl) {
      skipped.push({ nodeId, reason: 'missing_image' });
      return;
    }

    plannedShotIds.add(shot.id);
    items.push({
      nodeId,
      shotId: shot.id,
      shotNumber: shot.shotNumber,
      prompt: shot.prompt,
    });
  });

  return {
    type: input.type,
    items,
    skipped,
  };
}
