import { CanvasNode } from '../types';

export type BlankCanvasNodeType = 'prompt' | 'image_result' | 'video_result' | 'export';

export type CanvasNodeCreateInput = Pick<
  CanvasNode,
  'nodeType' | 'title' | 'position' | 'size' | 'data'
> & Pick<Partial<CanvasNode>, 'refType' | 'refId'>;

const DEFAULT_TITLE_BY_TYPE: Record<BlankCanvasNodeType, string> = {
  prompt: '新提示词',
  image_result: '图片结果',
  video_result: '视频结果',
  export: '导出节点',
};

const DEFAULT_SIZE_BY_TYPE: Record<BlankCanvasNodeType, CanvasNode['size']> = {
  prompt: { width: 240, height: 160 },
  image_result: { width: 260, height: 180 },
  video_result: { width: 260, height: 180 },
  export: { width: 260, height: 140 },
};

export function createBlankCanvasNodeInput(
  nodeType: BlankCanvasNodeType,
  position: CanvasNode['position'],
): CanvasNodeCreateInput {
  return {
    nodeType,
    title: DEFAULT_TITLE_BY_TYPE[nodeType],
    position,
    size: DEFAULT_SIZE_BY_TYPE[nodeType],
    data: {
      source: 'blank_menu',
    },
  };
}
