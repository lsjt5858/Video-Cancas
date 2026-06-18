export type ImageAspectRatio = '16:9' | '9:16' | '1:1' | '4:3';
export type ImageStyle = 'cinematic' | 'realistic' | 'anime' | 'concept-art';
export type ImageReferenceMode = 'none' | 'character' | 'scene' | 'prop';

export type ImageGenerationParams = {
  aspectRatio: ImageAspectRatio;
  style: ImageStyle;
  referenceMode: ImageReferenceMode;
  referenceNodeIds: string[];
  negativePrompt: string;
  seed: string;
  candidateCount: number;
};

export type NormalizedImageGenerationParams = Omit<ImageGenerationParams, 'seed'> & {
  seed?: number;
};

export const IMAGE_ASPECT_RATIO_OPTIONS: Array<{ value: ImageAspectRatio; label: string }> = [
  { value: '16:9', label: '横屏 16:9' },
  { value: '9:16', label: '竖屏 9:16' },
  { value: '1:1', label: '方图 1:1' },
  { value: '4:3', label: '经典 4:3' },
];

export const IMAGE_STYLE_OPTIONS: Array<{ value: ImageStyle; label: string }> = [
  { value: 'cinematic', label: '电影感' },
  { value: 'realistic', label: '写实' },
  { value: 'anime', label: '动画' },
  { value: 'concept-art', label: '概念设计' },
];

export const IMAGE_REFERENCE_MODE_OPTIONS: Array<{ value: ImageReferenceMode; label: string }> = [
  { value: 'none', label: '不使用参考' },
  { value: 'character', label: '角色参考' },
  { value: 'scene', label: '场景参考' },
  { value: 'prop', label: '道具参考' },
];

export function createDefaultImageGenerationParams(): ImageGenerationParams {
  return {
    aspectRatio: '16:9',
    style: 'cinematic',
    referenceMode: 'none',
    referenceNodeIds: [],
    negativePrompt: '',
    seed: '',
    candidateCount: 4,
  };
}

export function normalizeImageGenerationParams(
  params: ImageGenerationParams,
): NormalizedImageGenerationParams {
  const parsedSeed = Number.parseInt(params.seed, 10);

  return {
    ...params,
    negativePrompt: params.negativePrompt.trim(),
    referenceNodeIds: Array.from(new Set(params.referenceNodeIds)),
    candidateCount: Math.max(1, Math.min(8, params.candidateCount)),
    ...(Number.isNaN(parsedSeed) ? { seed: undefined } : { seed: parsedSeed }),
  };
}
