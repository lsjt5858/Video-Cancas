import { GenerationTask } from '../types';
import { CanvasNodeContextMenuAction } from './canvasNodeContextMenu';

export type CanvasGenerationProgressItem = {
  taskId: string;
  type: GenerationTask['type'];
  label: string;
  tone: 'muted' | 'active' | 'success' | 'error';
  progressLabel: string;
  description?: string;
  retryAction?: Extract<CanvasNodeContextMenuAction, 'generate_image' | 'generate_video'>;
  retryLabel?: string;
};

export function getLatestGenerationTaskByType(
  tasks: GenerationTask[],
  shotId: string,
  type: GenerationTask['type'],
): GenerationTask | undefined {
  return tasks
    .filter(task => task.shotId === shotId && task.type === type)
    .sort((first, second) => second.createdAt - first.createdAt)[0];
}

export function getCanvasGenerationProgressItems(
  tasks: GenerationTask[],
  shotId?: string,
): CanvasGenerationProgressItem[] {
  if (!shotId) {
    return [];
  }

  return (['image', 'video'] as const)
    .map(type => getLatestGenerationTaskByType(tasks, shotId, type))
    .filter((task): task is GenerationTask => Boolean(task))
    .map(formatGenerationTaskProgress);
}

function formatGenerationTaskProgress(task: GenerationTask): CanvasGenerationProgressItem {
  const typeLabel = task.type === 'image' ? '图片' : '视频';

  if (task.status === 'pending') {
    return {
      taskId: task.id,
      type: task.type,
      label: `${typeLabel}等待生成`,
      tone: 'muted',
      progressLabel: '排队中',
    };
  }

  if (task.status === 'processing') {
    return {
      taskId: task.id,
      type: task.type,
      label: `${typeLabel}生成中`,
      tone: 'active',
      progressLabel: '生成中',
    };
  }

  if (task.status === 'failed') {
    return {
      taskId: task.id,
      type: task.type,
      label: `${typeLabel}生成失败`,
      tone: 'error',
      progressLabel: '失败',
      ...(task.error ? { description: task.error } : {}),
      retryAction: task.type === 'image' ? 'generate_image' : 'generate_video',
      retryLabel: task.type === 'image' ? '重试生图' : '重试生视频',
    };
  }

  return {
    taskId: task.id,
    type: task.type,
    label: `${typeLabel}生成完成`,
    tone: 'success',
    progressLabel: '100%',
  };
}
