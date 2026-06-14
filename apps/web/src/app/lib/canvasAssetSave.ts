import { Asset, CanvasNode } from '../types';

export type CanvasResultAssetInput = Omit<Asset, 'id' | 'createdAt'>;

export function canSaveCanvasResultNodeToAssetLibrary(node: CanvasNode): boolean {
  return createAssetInputFromCanvasResultNode(node) !== null;
}

export function createAssetInputFromCanvasResultNode(
  node: CanvasNode,
): CanvasResultAssetInput | null {
  if (node.nodeType !== 'image_result' && node.nodeType !== 'video_result') {
    return null;
  }

  const url = getStringData(node, 'url');
  if (!url) {
    return null;
  }

  const metadata = getMetadata(node);
  const sourceTaskId = getStringData(node, 'task_id');
  const thumbnailUrl = getStringData(node, 'thumbnail_url') ?? url;

  return {
    projectId: node.projectId,
    shotId: getStringData(node, 'shot_id'),
    type: node.nodeType === 'video_result' ? 'video' : 'image',
    url,
    thumbnailUrl,
    metadata: {
      ...metadata,
      sourceCanvasNodeId: node.id,
      ...(sourceTaskId ? { sourceTaskId } : {}),
      source: 'canvas_result_node',
    },
  };
}

function getMetadata(node: CanvasNode): Asset['metadata'] {
  const value = node.data.metadata;
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return {};
  }

  const record = value as Record<string, unknown>;
  return {
    ...(typeof record.width === 'number' ? { width: record.width } : {}),
    ...(typeof record.height === 'number' ? { height: record.height } : {}),
    ...(typeof record.duration === 'number' ? { duration: record.duration } : {}),
    ...(typeof record.format === 'string' ? { format: record.format } : {}),
    ...(typeof record.prompt === 'string' ? { prompt: record.prompt } : {}),
    ...(typeof record.generatedAt === 'number' ? { generatedAt: record.generatedAt } : {}),
  };
}

function getStringData(node: CanvasNode, key: string): string | undefined {
  const value = node.data[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}
