import { CanvasNode, Scene, Shot } from '../types';
import { getCanvasNodePresentation } from './canvasNodePresentation';

export type CanvasNodeDetailRow = {
  label: string;
  value: string;
  kind?: 'asset_result';
  assetType?: 'image' | 'video';
  url?: string;
};

export type CanvasNodeDetails = {
  title: string;
  typeLabel: string;
  description: string;
  rows: CanvasNodeDetailRow[];
};

export type CanvasNodeDialogSection = {
  title: string;
  rows: CanvasNodeDetailRow[];
};

export type CanvasNodeDialogDetails = {
  title: string;
  typeLabel: string;
  description: string;
  sections: CanvasNodeDialogSection[];
  footerNote: string;
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
        { label: '场景描述', value: scene.description || '未设置' },
        { label: '地点', value: scene.location || '未设置' },
        { label: '时间', value: scene.timeOfDay || '未设置' },
        { label: '角色', value: scene.characters.join('、') || '未设置' },
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
        buildAssetResultRow('图片结果', 'image', shot.imageUrl),
        buildAssetResultRow('视频结果', 'video', shot.videoUrl),
      ],
    };
  }

  return {
    title: node.title || presentation.label,
    typeLabel: presentation.label,
    description: '项目剧本入口，后续可联动角色、场景和镜头节点。',
    rows: getGenericCreatorRows(node),
  };
}

export function buildCanvasNodeDialogDetails(
  node: CanvasNode,
  scenes: Scene[],
  shots: Shot[],
): CanvasNodeDialogDetails {
  const details = getCanvasNodeDetails(node, scenes, shots);
  const scene = node.refId ? scenes.find(item => item.id === node.refId) : undefined;
  const shot = node.refId ? shots.find(item => item.id === node.refId) : undefined;

  if (node.nodeType === 'scene' && scene) {
    return {
      ...details,
      sections: [
        {
          title: '场景信息',
          rows: [
            { label: '场景描述', value: scene.description || '未设置' },
            { label: '地点', value: scene.location || '未设置' },
            { label: '时间', value: scene.timeOfDay || '未设置' },
            { label: '角色', value: scene.characters.join('、') || '未设置' },
          ],
        },
      ],
      footerNote: '生成历史、候选结果和素材版本待接入。',
    };
  }

  if (node.nodeType === 'shot' && shot) {
    return {
      ...details,
      sections: [
        {
          title: '镜头设计',
          rows: [
            { label: '景别', value: shot.shotType },
            { label: '运镜', value: shot.cameraMovement },
            { label: '时长', value: `${shot.duration}s` },
          ],
        },
        {
          title: '提示词与生成输入',
          rows: [
            { label: '镜头描述', value: shot.description || '未设置' },
            { label: '提示词', value: shot.prompt || '未设置' },
            { label: '台词', value: shot.dialogue || '未设置' },
          ],
        },
        {
          title: '生成结果',
          rows: [
            buildAssetResultRow('图片结果', 'image', shot.imageUrl),
            buildAssetResultRow('视频结果', 'video', shot.videoUrl),
          ],
        },
      ],
      footerNote: '生成历史、候选结果和素材版本待接入。',
    };
  }

  return {
    ...details,
    sections: [
      {
        title: '创作信息',
        rows: details.rows,
      },
    ],
    footerNote: '生成历史、候选结果和素材版本待接入。',
  };
}

export function formatCanvasNodeDetailsForCopy(details: CanvasNodeDialogDetails): string {
  return [
    `${details.typeLabel}: ${details.title}`,
    details.description,
    ...details.sections.flatMap(section => [
      '',
      `[${section.title}]`,
      ...section.rows.map(row => `${row.label}: ${row.value}`),
    ]),
  ].join('\n');
}

function buildAssetResultRow(
  label: string,
  assetType: 'image' | 'video',
  url?: string,
): CanvasNodeDetailRow {
  return {
    label,
    value: url ? '已生成' : '未生成',
    kind: 'asset_result',
    assetType,
    ...(url ? { url } : {}),
  };
}

function getGenericCreatorRows(node: CanvasNode): CanvasNodeDetailRow[] {
  if (node.nodeType === 'script') {
    return [
      { label: '创作阶段', value: '剧本与故事结构' },
      { label: '后续动作', value: '可继续拆分场景、镜头、角色和提示词。' },
    ];
  }

  if (node.nodeType === 'prompt') {
    return [
      { label: '创作阶段', value: '提示词打磨' },
      { label: '后续动作', value: '可继续生成图片或视频候选。' },
    ];
  }

  if (node.nodeType === 'image_result') {
    return [
      { label: '创作阶段', value: '图片候选' },
      { label: '后续动作', value: '可作为首帧、参考图或素材入库。' },
    ];
  }

  if (node.nodeType === 'video_result') {
    return [
      { label: '创作阶段', value: '视频候选' },
      { label: '后续动作', value: '可预览、选择并加入时间线。' },
    ];
  }

  if (node.nodeType === 'export') {
    return [
      { label: '创作阶段', value: '导出交付' },
      { label: '后续动作', value: '可生成素材包、分镜表、提示词表或成片。' },
    ];
  }

  return [
    { label: '创作阶段', value: '视频创作节点' },
    { label: '后续动作', value: '可继续完善内容或连接到生成链路。' },
  ];
}
