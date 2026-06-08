import { CanvasNode } from '../types';

type CanvasNodePresentation = {
  label: string;
  accentClassName: string;
  badgeClassName: string;
};

const PRESENTATION_BY_TYPE: Partial<Record<CanvasNode['nodeType'], CanvasNodePresentation>> = {
  script: {
    label: '剧本',
    accentClassName: 'border-l-violet-500',
    badgeClassName: 'bg-violet-50 text-violet-700 border-violet-200',
  },
  scene: {
    label: '场景',
    accentClassName: 'border-l-amber-500',
    badgeClassName: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  shot: {
    label: '镜头',
    accentClassName: 'border-l-blue-500',
    badgeClassName: 'bg-blue-50 text-blue-700 border-blue-200',
  },
};

const DEFAULT_PRESENTATION: CanvasNodePresentation = {
  label: '节点',
  accentClassName: 'border-l-slate-400',
  badgeClassName: 'bg-slate-50 text-slate-700 border-slate-200',
};

export function getCanvasNodePresentation(
  nodeType: CanvasNode['nodeType'],
): CanvasNodePresentation {
  return PRESENTATION_BY_TYPE[nodeType] ?? DEFAULT_PRESENTATION;
}
