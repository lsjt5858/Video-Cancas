import { GenerationTask, Shot } from '../types';

export type CanvasGenerationResultPreview = {
  type: GenerationTask['type'];
  label: string;
  url: string;
  thumbnailUrl: string;
};

export function getCanvasGenerationResultPreviews(
  shot?: Shot,
  tasks: GenerationTask[] = [],
): CanvasGenerationResultPreview[] {
  if (!shot) {
    return [];
  }

  const imageUrl = shot.imageUrl ?? getLatestCompletedTaskResultUrl(tasks, shot.id, 'image');
  const videoUrl = shot.videoUrl ?? getLatestCompletedTaskResultUrl(tasks, shot.id, 'video');
  const previews: CanvasGenerationResultPreview[] = [];

  if (imageUrl) {
    previews.push({
      type: 'image',
      label: '图片结果',
      url: imageUrl,
      thumbnailUrl: imageUrl,
    });
  }

  if (videoUrl) {
    previews.push({
      type: 'video',
      label: '视频结果',
      url: videoUrl,
      thumbnailUrl: imageUrl ?? videoUrl,
    });
  }

  return previews;
}

function getLatestCompletedTaskResultUrl(
  tasks: GenerationTask[],
  shotId: string,
  type: GenerationTask['type'],
): string | undefined {
  return tasks
    .filter(task => (
      task.shotId === shotId &&
      task.type === type &&
      task.status === 'completed' &&
      Boolean(task.resultUrl)
    ))
    .sort((first, second) => second.createdAt - first.createdAt)[0]
    ?.resultUrl;
}
