import { describe, expect, it } from 'vitest';
import { getCanvasNodeContextMenuItems } from './canvasNodeContextMenu';
import { CanvasNode } from '../types';

function makeNode(nodeType: CanvasNode['nodeType']): CanvasNode {
  return {
    id: `${nodeType}-node`,
    projectId: 'project-1',
    nodeType,
    title: `${nodeType} title`,
    position: { x: 100, y: 120 },
    size: { width: 200, height: 160 },
    refType: nodeType,
    refId: `${nodeType}-1`,
    data: {},
  };
}

describe('canvas node context menu', () => {
  it('provides enabled detail and copy actions for a shot node', () => {
    expect(getCanvasNodeContextMenuItems(makeNode('shot'))).toEqual(
      expect.arrayContaining([
        { action: 'view_details', label: '查看详情', disabled: false },
        { action: 'copy_info', label: '复制节点信息', disabled: false },
      ]),
    );
  });

  it('keeps generation actions disabled and enables deletion', () => {
    expect(getCanvasNodeContextMenuItems(makeNode('shot'))).toEqual(
      expect.arrayContaining([
        { action: 'generate_image', label: '生成图片（待接入）', disabled: true },
        { action: 'generate_video', label: '生成视频（待接入）', disabled: true },
        { action: 'delete_node', label: '删除节点', disabled: false },
      ]),
    );
  });

  it('does not show shot generation actions for an export node', () => {
    expect(getCanvasNodeContextMenuItems(makeNode('export')).map(item => item.action)).toEqual([
      'view_details',
      'copy_info',
      'delete_node',
    ]);
  });

  it('enables storyboard generation for script and scene nodes', () => {
    expect(getCanvasNodeContextMenuItems(makeNode('script'))).toEqual(
      expect.arrayContaining([
        { action: 'generate_storyboard', label: '批量生成分镜', disabled: false },
      ]),
    );
    expect(getCanvasNodeContextMenuItems(makeNode('scene'))).toEqual(
      expect.arrayContaining([
        { action: 'generate_storyboard', label: '批量生成分镜', disabled: false },
      ]),
    );
  });
});
