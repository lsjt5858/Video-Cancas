import { describe, expect, it } from 'vitest';
import {
  VIDEO_CAMERA_MOTION_OPTIONS,
  VIDEO_DURATION_OPTIONS,
  createDefaultVideoGenerationParams,
  normalizeVideoGenerationParams,
} from './videoGenerationParams';

describe('video generation params', () => {
  it('provides supported duration and motion options', () => {
    expect(VIDEO_DURATION_OPTIONS.map(option => option.value)).toEqual([3, 5, 8, 12]);
    expect(VIDEO_CAMERA_MOTION_OPTIONS.map(option => option.value)).toEqual([
      'auto',
      'static',
      'pan',
      'tracking',
      'dolly',
    ]);
  });

  it('creates default params for video generation', () => {
    expect(createDefaultVideoGenerationParams()).toEqual({
      duration: 5,
      cameraMotion: 'auto',
      firstFrameMode: 'current_image',
      lastFrameMode: 'none',
      referenceVideoMode: 'none',
      motionPrompt: '',
    });
  });

  it('normalizes free text fields', () => {
    expect(normalizeVideoGenerationParams({
      ...createDefaultVideoGenerationParams(),
      motionPrompt: '  slow push in  ',
    })).toMatchObject({
      motionPrompt: 'slow push in',
    });
  });
});
