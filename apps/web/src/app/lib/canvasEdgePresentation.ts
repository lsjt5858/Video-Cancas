export type CanvasEdgePresentation = {
  label: string;
  className: string;
  strokeDasharray?: string;
};

const PRESENTATION_BY_RELATION: Record<string, CanvasEdgePresentation> = {
  story_flow: {
    label: '剧情流',
    className: 'text-slate-500/50',
  },
  generates: {
    label: '生成',
    className: 'text-emerald-500/70',
    strokeDasharray: '7 5',
  },
  uses_asset: {
    label: '资产引用',
    className: 'text-purple-500/70',
    strokeDasharray: '3 4',
  },
  selected_for_timeline: {
    label: '时间线选择',
    className: 'text-orange-500/70',
    strokeDasharray: '10 4 2 4',
  },
};

const DEFAULT_PRESENTATION: CanvasEdgePresentation = {
  label: '',
  className: 'text-muted-foreground/40',
};

export function getCanvasEdgePresentation(relationType: string): CanvasEdgePresentation {
  return PRESENTATION_BY_RELATION[relationType] ?? {
    ...DEFAULT_PRESENTATION,
    label: relationType,
  };
}
