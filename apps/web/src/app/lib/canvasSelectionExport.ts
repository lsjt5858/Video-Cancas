import { CanvasNode, Scene, Shot } from '../types';
import { getCanvasNodePresentation } from './canvasNodePresentation';

export type CanvasSelectionExportRow = {
  nodeId: string;
  nodeType: CanvasNode['nodeType'];
  title: string;
  typeLabel: string;
  sceneId?: string;
  sceneNumber?: number;
  sceneDescription?: string;
  shotId?: string;
  shotNumber?: number;
  description?: string;
  prompt?: string;
  dialogue?: string;
  imageUrl?: string;
  videoUrl?: string;
  resultType?: 'image' | 'video';
  resultUrl?: string;
  thumbnailUrl?: string;
  sourceShotId?: string;
};

export type CanvasSelectionExport = {
  filename: string;
  rows: CanvasSelectionExportRow[];
  json: string;
  csv: string;
};

type BuildCanvasSelectionExportInput = {
  selectedNodeIds: string[];
  nodes: CanvasNode[];
  scenes: Scene[];
  shots: Shot[];
};

const CSV_COLUMNS: Array<keyof CanvasSelectionExportRow> = [
  'nodeId',
  'nodeType',
  'title',
  'typeLabel',
  'sceneId',
  'sceneNumber',
  'sceneDescription',
  'shotId',
  'shotNumber',
  'description',
  'prompt',
  'dialogue',
  'imageUrl',
  'videoUrl',
  'resultType',
  'resultUrl',
  'thumbnailUrl',
  'sourceShotId',
];

export function buildCanvasSelectionExport(
  input: BuildCanvasSelectionExportInput,
): CanvasSelectionExport {
  const rows = input.selectedNodeIds
    .map(nodeId => input.nodes.find(node => node.id === nodeId))
    .filter((node): node is CanvasNode => Boolean(node))
    .map(node => buildExportRow(node, input.scenes, input.shots));

  return {
    filename: `canvas-selection-${new Date().toISOString().replace(/[:.]/g, '-')}`,
    rows,
    json: JSON.stringify(rows, null, 2),
    csv: buildCsv(rows),
  };
}

function buildExportRow(
  node: CanvasNode,
  scenes: Scene[],
  shots: Shot[],
): CanvasSelectionExportRow {
  const shot = getShotForNode(node, shots);
  const scene = getSceneForNode(node, scenes, shot);
  const resultType = getResultType(node);
  const resultUrl = getStringData(node, 'url');

  return {
    nodeId: node.id,
    nodeType: node.nodeType,
    title: getNodeTitle(node, scene, shot),
    typeLabel: getCanvasNodePresentation(node.nodeType).label,
    ...(scene ? {
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      sceneDescription: scene.description,
    } : {}),
    ...(shot ? {
      shotId: shot.id,
      shotNumber: shot.shotNumber,
      description: shot.description,
      prompt: shot.prompt,
      dialogue: shot.dialogue,
      imageUrl: shot.imageUrl,
      videoUrl: shot.videoUrl,
    } : {}),
    ...(resultType ? {
      resultType,
      resultUrl,
      thumbnailUrl: getStringData(node, 'thumbnail_url'),
      sourceShotId: getStringData(node, 'shot_id'),
    } : {}),
  };
}

function getNodeTitle(node: CanvasNode, scene?: Scene, shot?: Shot): string {
  if (node.nodeType === 'scene' && scene) {
    return `场景 ${scene.sceneNumber}: ${scene.description}`;
  }
  if (node.nodeType === 'shot' && shot) {
    return `镜头 ${shot.shotNumber}: ${shot.description}`;
  }
  if (node.nodeType === 'prompt' && shot) {
    return node.title || `镜头 ${shot.shotNumber} 提示词`;
  }
  return node.title || getCanvasNodePresentation(node.nodeType).label;
}

function getShotForNode(node: CanvasNode, shots: Shot[]): Shot | undefined {
  if ((node.nodeType === 'shot' || node.nodeType === 'prompt') && node.refId) {
    return shots.find(shot => shot.id === node.refId);
  }

  const sourceShotId = getStringData(node, 'shot_id');
  return sourceShotId ? shots.find(shot => shot.id === sourceShotId) : undefined;
}

function getSceneForNode(
  node: CanvasNode,
  scenes: Scene[],
  shot?: Shot,
): Scene | undefined {
  if (node.nodeType === 'scene' && node.refId) {
    return scenes.find(scene => scene.id === node.refId);
  }
  if (shot) {
    return scenes.find(scene => scene.id === shot.sceneId);
  }
  return undefined;
}

function getResultType(node: CanvasNode): 'image' | 'video' | undefined {
  if (node.nodeType === 'image_result') return 'image';
  if (node.nodeType === 'video_result') return 'video';
  return undefined;
}

function buildCsv(rows: CanvasSelectionExportRow[]): string {
  return [
    CSV_COLUMNS.join(','),
    ...rows.map(row => CSV_COLUMNS.map(column => csvCell(row[column])).join(',')),
  ].join('\n');
}

function csvCell(value: unknown): string {
  if (value === undefined || value === null) return '';
  const text = String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function getStringData(node: CanvasNode, key: string): string | undefined {
  const value = node.data[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}
