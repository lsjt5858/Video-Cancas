import { describe, expect, it } from 'vitest';
import {
  IMAGE_ASPECT_RATIO_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  createDefaultImageGenerationParams,
  normalizeImageGenerationParams,
} from './imageGenerationParams';

describe('image generation params', () => {
  it('provides supported aspect ratio and style options', () => {
    expect(IMAGE_ASPECT_RATIO_OPTIONS.map(option => option.value)).toEqual([
      '16:9',
      '9:16',
      '1:1',
      '4:3',
    ]);
    expect(IMAGE_STYLE_OPTIONS.map(option => option.value)).toEqual([
      'cinematic',
      'realistic',
      'anime',
      'concept-art',
    ]);
  });

  it('creates default params for image generation', () => {
    expect(createDefaultImageGenerationParams()).toEqual({
      aspectRatio: '16:9',
      style: 'cinematic',
      referenceMode: 'none',
      negativePrompt: '',
      seed: '',
      candidateCount: 4,
    });
  });

  it('normalizes numeric params into valid ranges', () => {
    expect(normalizeImageGenerationParams({
      ...createDefaultImageGenerationParams(),
      seed: '42',
      candidateCount: 12,
    })).toMatchObject({
      seed: 42,
      candidateCount: 8,
    });
  });
});
