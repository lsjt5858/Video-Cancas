import { CanvasNode, Scene, Shot } from '../types';
import { getCanvasNodePresentation } from './canvasNodePresentation';

export type CanvasNodeDetailRow = {
  label: string;
  value: string;
};

export type CanvasNodeDetails = {
  title: string;
  typeLabel: string;
  description: string;
  rows: CanvasNodeDetailRow[];
};

export function getCanvasNodeDetails(
  node: CanvasNode,
  scenes: Scene[],
  shots: Shot[],
): CanvasNodeDetails {
  const presentation = getCanvasNodePresentation(node.nodeType);
  const scene = node.refId ? scenes.find(item => item.id === node.refId) : undefined;
  const shot = node.refId ? shots.find(item => item.id === node.refId) : undefined;

  if (node.nodeType === 'scene' && scene) {
    return {
      title: `场景 ${scene.sceneNumber}: ${scene.description}`,
      typeLabel: presentation.label,
      description: [scene.location, scene.timeOfDay, scene.characters.join('、')]
        .filter(Boolean)
        .join(' · '),
      rows: [
        { label: '场景编号', value: String(scene.sceneNumber) },
        { label: '地点', value: scene.location || '未设置' },
        { label: '时间', value: scene.timeOfDay || '未设置' },
        { label: '角色', value: scene.characters.join('、') || '未设置' },
        ...getNodeMetadataRows(node),
      ],
    };
  }

  if (node.nodeType === 'shot' && shot) {
    return {
      title: `镜头 ${shot.shotNumber}: ${shot.description}`,
      typeLabel: presentation.label,
      description: `${shot.shotType} · ${shot.duration}s · ${shot.prompt}`,
      rows: [
        { label: '镜头编号', value: String(shot.shotNumber) },
        { label: '镜头类型', value: shot.shotType },
        { label: '运镜', value: shot.cameraMovement },
        { label: '时长', value: `${shot.duration}s` },
        { label: '提示词', value: shot.prompt || '未设置' },
        { label: '台词', value: shot.dialogue || '未设置' },
        { label: '图片结果', value: shot.imageUrl || '未生成' },
        { label: '视频结果', value: shot.videoUrl || '未生成' },
        ...getNodeMetadataRows(node),
      ],
    };
  }

  return {
    title: node.title || presentation.label,
    typeLabel: presentation.label,
    description: '项目剧本入口，后续可联动角色、场景和镜头节点。',
    rows: getNodeMetadataRows(node),
  };
}

function getNodeMetadataRows(node: CanvasNode): CanvasNodeDetailRow[] {
  return [
    { label: '节点 ID', value: node.id },
    { label: '关联类型', value: node.refType || '无' },
    { label: '关联 ID', value: node.refId || '无' },
    { label: '位置', value: `${Math.round(node.position.x)}, ${Math.round(node.position.y)}` },
    { label: '尺寸', value: `${Math.round(node.size.width)} x ${Math.round(node.size.height)}` },
  ];
}
