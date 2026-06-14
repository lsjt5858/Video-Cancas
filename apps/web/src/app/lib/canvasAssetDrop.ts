import { Asset, CanvasNode } from '../types';
import { CanvasNodeCreateInput } from './canvasBlankMenu';

export const CANVAS_ASSET_MIME_TYPE = 'application/x-video-cancas-asset';

export type CanvasAssetDragData = Pick<
  Asset,
  'id' | 'projectId' | 'shotId' | 'type' | 'url' | 'thumbnailUrl' | 'metadata'
>;

const TITLE_BY_ASSET_TYPE: Record<Asset['type'], string> = {
  image: '图片素材',
  video: '视频素材',
};

const NODE_TYPE_BY_ASSET_TYPE: Record<Asset['type'], CanvasNode['nodeType']> = {
  image: 'image_result',
  video: 'video_result',
};

const SIZE_BY_ASSET_TYPE: Record<Asset['type'], CanvasNode['size']> = {
  image: { width: 260, height: 180 },
  video: { width: 260, height: 180 },
};

export function createCanvasAssetDragData(asset: Asset): CanvasAssetDragData {
  return {
    id: asset.id,
    projectId: asset.projectId,
    shotId: asset.shotId,
    type: asset.type,
    url: asset.url,
    thumbnailUrl: asset.thumbnailUrl,
    metadata: asset.metadata,
  };
}

export function parseCanvasAssetDragData(rawData: string): CanvasAssetDragData | null {
  if (!rawData) return null;

  try {
    const data = JSON.parse(rawData) as Partial<CanvasAssetDragData>;
    if (
      typeof data.id !== 'string' ||
      typeof data.projectId !== 'string' ||
      (data.type !== 'image' && data.type !== 'video') ||
      typeof data.url !== 'string'
    ) {
      return null;
    }

    return {
      id: data.id,
      projectId: data.projectId,
      shotId: typeof data.shotId === 'string' ? data.shotId : undefined,
      type: data.type,
      url: data.url,
      thumbnailUrl: typeof data.thumbnailUrl === 'string' ? data.thumbnailUrl : undefined,
      metadata: isRecord(data.metadata) ? data.metadata : {},
    };
  } catch {
    return null;
  }
}

export function createCanvasNodeInputFromAssetDrop(
  asset: CanvasAssetDragData,
  position: CanvasNode['position'],
): CanvasNodeCreateInput {
  const thumbnailUrl = asset.thumbnailUrl ?? asset.url;

  return {
    nodeType: NODE_TYPE_BY_ASSET_TYPE[asset.type],
    title: TITLE_BY_ASSET_TYPE[asset.type],
    position,
    size: SIZE_BY_ASSET_TYPE[asset.type],
    refType: 'asset',
    refId: asset.id,
    data: {
      source: 'asset_library',
      asset_id: asset.id,
      shot_id: asset.shotId,
      asset_type: asset.type,
      url: asset.url,
      thumbnail_url: thumbnailUrl,
      metadata: asset.metadata,
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
