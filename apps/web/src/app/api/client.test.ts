import { describe, expect, it } from 'vitest';
import { mapProjectFromApi, mapSceneFromApi, mapShotFromApi } from './client';

describe('API response mappers', () => {
  it('maps project fields from API snake_case into UI camelCase', () => {
    expect(
      mapProjectFromApi({
        id: 'project-1',
        name: '测试项目',
        type: 'short_drama',
        style: 'realistic_cinematic',
        aspect_ratio: '9:16',
        target_duration: 90,
        status: 'draft',
        created_at: '2026-06-08T12:00:00',
        updated_at: '2026-06-08T12:30:00',
      }),
    ).toMatchObject({
      id: 'project-1',
      name: '测试项目',
      type: 'short-drama',
      aspectRatio: '9:16',
      targetDuration: 90,
      script: '',
    });
  });

  it('maps scene and shot fields from API snake_case into UI camelCase', () => {
    expect(
      mapSceneFromApi({
        id: 'scene-1',
        project_id: 'project-1',
        scene_number: 1,
        description: '开场',
        location: '旧车站',
        time_of_day: '黄昏',
        characters: ['母亲'],
      }),
    ).toEqual({
      id: 'scene-1',
      projectId: 'project-1',
      sceneNumber: 1,
      description: '开场',
      location: '旧车站',
      timeOfDay: '黄昏',
      characters: ['母亲'],
    });

    expect(
      mapShotFromApi({
        id: 'shot-1',
        project_id: 'project-1',
        scene_id: 'scene-1',
        shot_number: 1,
        description: '旧车站远景',
        shot_type: 'wide',
        camera_movement: 'static',
        duration: 3,
        dialogue: null,
        prompt: 'Wide shot',
        image_url: null,
        video_url: null,
        position: { x: 100, y: 100 },
      }),
    ).toMatchObject({
      id: 'shot-1',
      projectId: 'project-1',
      sceneId: 'scene-1',
      shotNumber: 1,
      shotType: 'wide',
      cameraMovement: 'static',
      position: { x: 100, y: 100 },
    });
  });
});
