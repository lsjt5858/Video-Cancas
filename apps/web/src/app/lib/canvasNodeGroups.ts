import { CanvasNode, Scene, Shot } from '../types';

export type CanvasNodeGroupKind = 'scene' | 'character';

export type CanvasNodeGroup = {
  id: string;
  kind: CanvasNodeGroupKind;
  label: string;
  nodeIds: string[];
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
};

type BuildCanvasNodeGroupsInput = {
  nodes: CanvasNode[];
  scenes: Scene[];
  shots: Shot[];
  includeKinds?: CanvasNodeGroupKind[];
};

const GROUP_PADDING = 24;

export function buildCanvasNodeGroups({
  nodes,
  scenes,
  shots,
  includeKinds = ['scene', 'character'],
}: BuildCanvasNodeGroupsInput): CanvasNodeGroup[] {
  const includeKindSet = new Set(includeKinds);
  const groups: CanvasNodeGroup[] = [];

  if (includeKindSet.has('scene')) {
    groups.push(...buildSceneGroups(nodes, scenes, shots));
  }

  if (includeKindSet.has('character')) {
    groups.push(...buildCharacterGroups(nodes, shots));
  }

  return groups;
}

function buildSceneGroups(
  nodes: CanvasNode[],
  scenes: Scene[],
  shots: Shot[],
): CanvasNodeGroup[] {
  return scenes.flatMap((scene) => {
    const sceneShotIds = new Set(
      shots
        .filter(shot => shot.sceneId === scene.id)
        .map(shot => shot.id),
    );
    const groupNodes = nodes.filter(node => isNodeInSceneGroup(node, scene.id, sceneShotIds));
    const group = createCanvasNodeGroup(
      `scene-${scene.id}`,
      'scene',
      `场景 ${scene.sceneNumber}`,
      groupNodes,
    );

    return group ? [group] : [];
  });
}

function buildCharacterGroups(
  nodes: CanvasNode[],
  shots: Shot[],
): CanvasNodeGroup[] {
  const nodesById = new Map(nodes.map(node => [node.id, node]));

  return nodes
    .filter(node => node.nodeType === 'character')
    .flatMap((characterNode) => {
      const sceneIds = getStringArray(characterNode.data.scene_ids);
      const sceneIdSet = new Set(sceneIds);
      const shotIds = new Set(
        shots
          .filter(shot => sceneIdSet.has(shot.sceneId))
          .map(shot => shot.id),
      );
      const groupNodeIds = new Set<string>([characterNode.id]);
      nodes.forEach((node) => {
        if (node.id !== characterNode.id && (
          isNodeInSceneIds(node, sceneIdSet) ||
          isNodeLinkedToShotIds(node, shotIds)
        )) {
          groupNodeIds.add(node.id);
        }
      });
      const groupNodes = Array.from(groupNodeIds)
        .map(nodeId => nodesById.get(nodeId))
        .filter((node): node is CanvasNode => Boolean(node));
      const characterName = getStringValue(characterNode.data.character_name) || characterNode.title || '未命名角色';
      const group = createCanvasNodeGroup(
        `character-${characterNode.id}`,
        'character',
        characterName.startsWith('角色：') ? characterName : `角色：${characterName}`,
        groupNodes,
      );

      return group ? [group] : [];
    });
}

function isNodeInSceneGroup(
  node: CanvasNode,
  sceneId: string,
  sceneShotIds: Set<string>,
) {
  return isNodeInSceneIds(node, new Set([sceneId])) || isNodeLinkedToShotIds(node, sceneShotIds);
}

function isNodeInSceneIds(node: CanvasNode, sceneIds: Set<string>) {
  return (
    node.nodeType === 'scene' &&
    typeof node.refId === 'string' &&
    sceneIds.has(node.refId)
  ) || (
    typeof node.data.scene_id === 'string' &&
    sceneIds.has(node.data.scene_id)
  );
}

function isNodeLinkedToShotIds(node: CanvasNode, shotIds: Set<string>) {
  return typeof node.refId === 'string' && shotIds.has(node.refId);
}

function createCanvasNodeGroup(
  id: string,
  kind: CanvasNodeGroupKind,
  label: string,
  nodes: CanvasNode[],
): CanvasNodeGroup | null {
  if (nodes.length < 2) {
    return null;
  }

  const minX = Math.min(...nodes.map(node => node.position.x));
  const minY = Math.min(...nodes.map(node => node.position.y));
  const maxX = Math.max(...nodes.map(node => node.position.x + node.size.width));
  const maxY = Math.max(...nodes.map(node => node.position.y + node.size.height));

  return {
    id,
    kind,
    label,
    nodeIds: nodes.map(node => node.id),
    bounds: {
      x: minX - GROUP_PADDING,
      y: minY - GROUP_PADDING,
      width: maxX - minX + GROUP_PADDING * 2,
      height: maxY - minY + GROUP_PADDING * 2,
    },
  };
}

function getStringArray(value: unknown) {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : [];
}

function getStringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}
