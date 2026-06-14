import { describe, expect, it } from 'vitest';
import {
  getDefaultGenerationModel,
  getGenerationModelById,
  getGenerationModelsByType,
} from './generationModels';

describe('generation models', () => {
  it('provides image and video model groups', () => {
    expect(getGenerationModelsByType('image').map(model => model.id)).toEqual([
      'image-fast',
      'image-quality',
      'image-character',
      'image-scene',
    ]);
    expect(getGenerationModelsByType('video').map(model => model.id)).toEqual([
      'video-fast',
      'video-quality',
      'video-motion',
    ]);
  });

  it('returns sensible defaults for each generation type', () => {
    expect(getDefaultGenerationModel('image')).toMatchObject({
      id: 'image-fast',
      type: 'image',
      label: '快速生图',
    });
    expect(getDefaultGenerationModel('video')).toMatchObject({
      id: 'video-fast',
      type: 'video',
      label: '快速生视频',
    });
  });

  it('finds models by id and falls back for unknown ids', () => {
    expect(getGenerationModelById('image-character')?.label).toBe('角色一致性');
    expect(getGenerationModelById('missing-model')).toBeUndefined();
  });
});
