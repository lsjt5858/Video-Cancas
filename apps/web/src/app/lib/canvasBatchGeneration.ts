import { CanvasNode, Shot } from '../types';

export type CanvasBatchGenerationType = 'image' | 'video';

export type CanvasBatchGenerationItem = {
  nodeId: string;
  shotId: string;
  shotNumber: number;
  prompt: string;
  isRegeneration: boolean;
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
      isRegeneration: input.type === 'image' ? Boolean(shot.imageUrl) : Boolean(shot.videoUrl),
    });
  });

  return {
    type: input.type,
    items,
    skipped,
  };
}

export function getCanvasBatchGenerationLabel(plan: CanvasBatchGenerationPlan): string {
  const hasRegeneration = plan.items.some(item => item.isRegeneration);
  if (plan.type === 'image') {
    return hasRegeneration ? '批量重新生图' : '批量生图';
  }

  return hasRegeneration ? '批量重新生视频' : '批量生视频';
}
