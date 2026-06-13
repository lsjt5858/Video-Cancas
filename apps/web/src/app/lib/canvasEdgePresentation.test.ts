import { describe, expect, it } from 'vitest';
import { getCanvasEdgePresentation } from './canvasEdgePresentation';

describe('canvas edge presentation', () => {
  it('returns distinct styles for known relation types', () => {
    expect(getCanvasEdgePresentation('story_flow')).toEqual({
      label: '剧情流',
      className: 'text-slate-500/50',
      strokeDasharray: undefined,
    });
    expect(getCanvasEdgePresentation('generates')).toEqual({
      label: '生成',
      className: 'text-emerald-500/70',
      strokeDasharray: '7 5',
    });
    expect(getCanvasEdgePresentation('uses_asset')).toEqual({
      label: '资产引用',
      className: 'text-purple-500/70',
      strokeDasharray: '3 4',
    });
  });

  it('falls back to a neutral style for unknown relation types', () => {
    expect(getCanvasEdgePresentation('custom_relation')).toEqual({
      label: 'custom_relation',
      className: 'text-muted-foreground/40',
      strokeDasharray: undefined,
    });
  });
});
