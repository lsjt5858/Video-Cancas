import { CanvasEdge, CanvasNode, Shot } from '../types';

export type VisibleCanvasGraph = {
  visibleNodes: CanvasNode[];
  visibleEdges: CanvasEdge[];
  hiddenNodeIds: string[];
};

export function getVisibleCanvasGraph(
  nodes: CanvasNode[],
  edges: CanvasEdge[],
  shots: Shot[],
  collapsedSceneIds: string[],
): VisibleCanvasGraph {
  const collapsedScenes = new Set(collapsedSceneIds);
  const hiddenShotIds = new Set(
    shots
      .filter(shot => collapsedScenes.has(shot.sceneId))
      .map(shot => shot.id),
  );
  const hiddenNodeIds = new Set(
    nodes
      .filter(node => (
        (node.nodeType === 'shot' || node.nodeType === 'prompt') &&
        typeof node.refId === 'string' &&
        hiddenShotIds.has(node.refId)
      ))
      .map(node => node.id),
  );

  const visibleNodes = nodes.filter(node => !hiddenNodeIds.has(node.id));
  const visibleEdges = edges.filter(edge => (
    !hiddenNodeIds.has(edge.sourceNodeId) &&
    !hiddenNodeIds.has(edge.targetNodeId)
  ));

  return {
    visibleNodes,
    visibleEdges,
    hiddenNodeIds: Array.from(hiddenNodeIds),
  };
}
