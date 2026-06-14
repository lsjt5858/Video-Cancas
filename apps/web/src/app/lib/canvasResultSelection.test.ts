import { describe, expect, it } from 'vitest';
import {
  getCanvasResultSelectionButtonState,
  getCanvasResultSelectionUpdate,
} from './canvasResultSelection';

describe('canvas result selection', () => {
  it('builds shot updates for image and video selections', () => {
    expect(getCanvasResultSelectionUpdate('image', 'https://example.com/image.png')).toEqual({
      imageUrl: 'https://example.com/image.png',
    });
    expect(getCanvasResultSelectionUpdate('video', 'https://example.com/video.mp4')).toEqual({
      videoUrl: 'https://example.com/video.mp4',
    });
  });

  it('labels selectable and selected image candidates', () => {
    expect(getCanvasResultSelectionButtonState('image', false)).toEqual({
      label: '设为主图',
      disabled: false,
    });
    expect(getCanvasResultSelectionButtonState('image', true)).toEqual({
      label: '当前主图',
      disabled: true,
    });
  });

  it('labels selectable and selected video candidates', () => {
    expect(getCanvasResultSelectionButtonState('video', false)).toEqual({
      label: '设为当前视频',
      disabled: false,
    });
    expect(getCanvasResultSelectionButtonState('video', true)).toEqual({
      label: '当前视频',
      disabled: true,
    });
  });
});
