import { Asset, Shot } from '../types';

export type CanvasVideoCandidate = {
  assetId: string;
  url: string;
  thumbnailUrl: string;
  label: string;
  isSelected: boolean;
  createdAt: number;
};

export function getCanvasVideoCandidates(
  shot?: Shot,
  assets: Asset[] = [],
  limit?: number,
): CanvasVideoCandidate[] {
  if (!shot) {
    return [];
  }

  return assets
    .filter(asset => asset.shotId === shot.id && asset.type === 'video')
    .sort((first, second) => second.createdAt - first.createdAt)
    .slice(0, limit)
    .map((asset, index) => ({
      assetId: asset.id,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl ?? asset.url,
      label: `候选 ${index + 1}`,
      isSelected: asset.url === shot.videoUrl,
      createdAt: asset.createdAt,
    }));
}
