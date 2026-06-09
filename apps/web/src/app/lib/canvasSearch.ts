import { CanvasNode, Scene, Shot } from '../types';
import { getCanvasNodePresentation } from './canvasNodePresentation';

export type CanvasSearchResult = {
  node: CanvasNode;
  title: string;
  description: string;
};

export function searchCanvasNodes(
  query: string,
  nodes: CanvasNode[],
  scenes: Scene[],
  shots: Shot[],
): CanvasSearchResult[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) {
    return [];
  }

  return nodes
    .map(node => buildSearchResult(node, scenes, shots))
    .filter(result => normalizeText([
      result.title,
      result.description,
      result.node.title,
      result.node.nodeType,
    ].join(' ')).includes(normalizedQuery));
}

function buildSearchResult(
  node: CanvasNode,
  scenes: Scene[],
  shots: Shot[],
): CanvasSearchResult {
  const scene = node.refId ? scenes.find(item => item.id === node.refId) : undefined;
  const shot = node.refId ? shots.find(item => item.id === node.refId) : undefined;

  if (node.nodeType === 'scene' && scene) {
    return {
      node,
      title: `场景 ${scene.sceneNumber}: ${scene.description}`,
      description: [scene.location, scene.timeOfDay, scene.characters.join('、')]
        .filter(Boolean)
        .join(' · '),
    };
  }

  if (node.nodeType === 'shot' && shot) {
    return {
      node,
      title: `镜头 ${shot.shotNumber}: ${shot.description}`,
      description: [shot.shotType, `${shot.duration}s`, shot.prompt, shot.dialogue]
        .filter(Boolean)
        .join(' · '),
    };
  }

  return {
    node,
    title: node.title || getCanvasNodePresentation(node.nodeType).label,
    description: getCanvasNodePresentation(node.nodeType).label,
  };
}

function normalizeText(value: string | undefined): string {
  return (value || '').trim().toLocaleLowerCase();
}
