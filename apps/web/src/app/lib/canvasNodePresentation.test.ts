import { describe, expect, it } from 'vitest';
import { getCanvasNodePresentation } from './canvasNodePresentation';

describe('canvas node presentation', () => {
  it('returns distinct labels and accents for script, scene, and shot nodes', () => {
    expect(getCanvasNodePresentation('script')).toMatchObject({
      label: '剧本',
      accentClassName: 'border-l-violet-500',
    });
    expect(getCanvasNodePresentation('scene')).toMatchObject({
      label: '场景',
      accentClassName: 'border-l-amber-500',
    });
    expect(getCanvasNodePresentation('shot')).toMatchObject({
      label: '镜头',
      accentClassName: 'border-l-blue-500',
    });
  });
});
