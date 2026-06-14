import { Asset, Shot } from '../types';

export type CanvasImageCandidate = {
  assetId: string;
  url: string;
  thumbnailUrl: string;
  label: string;
  isSelected: boolean;
  createdAt: number;
};

export function getCanvasImageCandidates(
  shot?: Shot,
  assets: Asset[] = [],
  limit?: number,
): CanvasImageCandidate[] {
  if (!shot) {
    return [];
  }

  const candidates = assets
    .filter(asset => asset.shotId === shot.id && asset.type === 'image')
    .sort((first, second) => second.createdAt - first.createdAt)
    .slice(0, limit)
    .map((asset, index) => ({
      assetId: asset.id,
      url: asset.url,
      thumbnailUrl: asset.thumbnailUrl ?? asset.url,
      label: `候选 ${index + 1}`,
      isSelected: asset.url === shot.imageUrl,
      createdAt: asset.createdAt,
    }));

  return candidates;
}
