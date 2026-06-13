import { Scene, Shot } from '../types';

export const STORYBOARD_RESULT_TAB = 'shots';

type GeneratedScene = Omit<Scene, 'id'>;
type GeneratedShot = Omit<Shot, 'id' | 'sceneId'>;

export interface StoryboardGenerationPlan {
  targetTab: typeof STORYBOARD_RESULT_TAB;
  scene: GeneratedScene;
  shots: GeneratedShot[];
}

export function createStoryboardGenerationPlan(projectId: string): StoryboardGenerationPlan {
  return {
    targetTab: STORYBOARD_RESULT_TAB,
    scene: {
      projectId,
      sceneNumber: 1,
      description: '开场场景',
      location: '城市街道',
      timeOfDay: '白天',
      characters: ['主角'],
    },
    shots: createStoryboardShotPlan(projectId, 1),
  };
}

export function createStoryboardShotPlan(projectId: string, startShotNumber = 1): GeneratedShot[] {
  return [
    {
      projectId,
      shotNumber: startShotNumber,
      description: '城市全景，建筑林立',
      shotType: 'wide',
      cameraMovement: 'static',
      duration: 3,
      prompt: 'Wide shot of modern city skyline, bright daylight, cinematic',
      position: { x: 100, y: 100 },
    },
    {
      projectId,
      shotNumber: startShotNumber + 1,
      description: '主角走在街道上',
      shotType: 'medium',
      cameraMovement: 'tracking',
      duration: 5,
      prompt: 'Medium shot of person walking on city street, following camera movement',
      position: { x: 300, y: 100 },
    },
    {
      projectId,
      shotNumber: startShotNumber + 2,
      description: '主角特写，表情坚定',
      shotType: 'close-up',
      cameraMovement: 'static',
      duration: 4,
      prompt: 'Close-up portrait of determined person, cinematic lighting',
      position: { x: 500, y: 100 },
    },
  ];
}
