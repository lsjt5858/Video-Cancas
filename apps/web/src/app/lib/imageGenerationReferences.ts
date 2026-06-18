import { CanvasNode } from '../types';
import {
  ImageGenerationParams,
  ImageReferenceMode,
} from './imageGenerationParams';

export type ImageReferenceCandidate = {
  nodeId: string;
  label: string;
  nodeType: CanvasNode['nodeType'];
};

const NODE_TYPES_BY_REFERENCE_MODE: Record<ImageReferenceMode, CanvasNode['nodeType'][]> = {
  none: [],
  character: ['character'],
  scene: ['location', 'scene'],
  prop: ['prop'],
};

export function getImageReferenceCandidates(
  nodes: CanvasNode[],
  referenceMode: ImageReferenceMode,
): ImageReferenceCandidate[] {
  const nodeTypes = NODE_TYPES_BY_REFERENCE_MODE[referenceMode];
  if (nodeTypes.length === 0) {
    return [];
  }

  return nodes
    .filter(node => nodeTypes.includes(node.nodeType))
    .map(node => ({
      nodeId: node.id,
      nodeType: node.nodeType,
      label: getImageReferenceCandidateLabel(node),
    }));
}

export function createImageGenerationParamsForReferenceMode(
  params: ImageGenerationParams,
  referenceMode: ImageReferenceMode,
  nodes: CanvasNode[],
): ImageGenerationParams {
  const candidateNodeIds = new Set(
    getImageReferenceCandidates(nodes, referenceMode).map(candidate => candidate.nodeId),
  );

  return {
    ...params,
    referenceMode,
    referenceNodeIds: params.referenceNodeIds.filter(nodeId => candidateNodeIds.has(nodeId)),
  };
}

export function toggleImageReferenceNode(
  params: ImageGenerationParams,
  nodeId: string,
): ImageGenerationParams {
  const referenceNodeIds = params.referenceNodeIds.includes(nodeId)
    ? params.referenceNodeIds.filter(item => item !== nodeId)
    : [...params.referenceNodeIds, nodeId];

  return {
    ...params,
    referenceNodeIds,
  };
}

function getImageReferenceCandidateLabel(node: CanvasNode): string {
  if (typeof node.title === 'string' && node.title.trim()) {
    return node.title.trim();
  }

  if (node.nodeType === 'character' && typeof node.data.character_name === 'string') {
    return `角色：${node.data.character_name}`;
  }

  if (node.nodeType === 'location' && typeof node.data.location_name === 'string') {
    return `地点：${node.data.location_name}`;
  }

  if (node.nodeType === 'prop' && typeof node.data.prop_name === 'string') {
    return `道具：${node.data.prop_name}`;
  }

  return node.id;
}
