import { CanvasNode } from '../types';

export type CanvasNodeContextMenuAction =
  | 'view_details'
  | 'copy_info'
  | 'generate_storyboard'
  | 'generate_image'
  | 'generate_video'
  | 'delete_node';

export type CanvasNodeContextMenuItem = {
  action: CanvasNodeContextMenuAction;
  label: string;
  disabled: boolean;
};

export function getCanvasNodeContextMenuItems(node: CanvasNode): CanvasNodeContextMenuItem[] {
  const items: CanvasNodeContextMenuItem[] = [
    { action: 'view_details', label: '查看详情', disabled: false },
    { action: 'copy_info', label: '复制节点信息', disabled: false },
  ];

  if (node.nodeType === 'script' || node.nodeType === 'scene') {
    items.push({ action: 'generate_storyboard', label: '批量生成分镜', disabled: false });
  }

  if (node.nodeType === 'shot' || node.nodeType === 'prompt') {
    items.push(
      { action: 'generate_image', label: '生成图片（待接入）', disabled: true },
      { action: 'generate_video', label: '生成视频（待接入）', disabled: true },
    );
  }

  items.push({ action: 'delete_node', label: '删除节点', disabled: false });

  return items;
}
