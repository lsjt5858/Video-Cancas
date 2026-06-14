import { CanvasNode, Shot } from '../types';
import { CanvasNodeContextMenuAction } from './canvasNodeContextMenu';

export type CanvasNodeGenerationAction = {
  action: Extract<CanvasNodeContextMenuAction, 'generate_image' | 'generate_video'>;
  label: string;
};

export function getCanvasNodeGenerationActions(
  node: CanvasNode,
  shot?: Shot,
): CanvasNodeGenerationAction[] {
  if (!shot || (node.nodeType !== 'shot' && node.nodeType !== 'prompt')) {
    return [];
  }

  return [
    {
      action: 'generate_image',
      label: shot.imageUrl ? '重新生图' : '生图',
    },
    {
      action: 'generate_video',
      label: shot.videoUrl ? '重新生视频' : '生视频',
    },
  ];
}
