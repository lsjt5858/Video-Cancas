import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  createCanvasEdge,
  mapCanvasEdgeFromApi,
  mapCanvasNodeFromApi,
  mapProjectFromApi,
  mapSceneFromApi,
  mapShotFromApi,
} from './client';

afterEach(() => {
  vi.unstubAllGlobals();
});

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

  it('maps canvas node and edge fields from API snake_case into UI camelCase', () => {
    expect(
      mapCanvasNodeFromApi({
        id: 'node-1',
        project_id: 'project-1',
        node_type: 'shot',
        title: '镜头 1',
        position: { x: 320, y: 180 },
        size: { width: 200, height: 180 },
        ref_type: 'shot',
        ref_id: 'shot-1',
        data: { shot_id: 'shot-1' },
      }),
    ).toEqual({
      id: 'node-1',
      projectId: 'project-1',
      nodeType: 'shot',
      title: '镜头 1',
      position: { x: 320, y: 180 },
      size: { width: 200, height: 180 },
      refType: 'shot',
      refId: 'shot-1',
      data: { shot_id: 'shot-1' },
    });

    expect(
      mapCanvasEdgeFromApi({
        id: 'edge-1',
        project_id: 'project-1',
        source_node_id: 'node-1',
        target_node_id: 'node-2',
        relation_type: 'workflow',
        data: {},
      }),
    ).toEqual({
      id: 'edge-1',
      projectId: 'project-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      relationType: 'workflow',
      data: {},
    });
  });
});

describe('canvas edge API', () => {
  it('creates a canvas edge and maps the response', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        id: 'edge-1',
        project_id: 'project-1',
        source_node_id: 'node-1',
        target_node_id: 'node-2',
        relation_type: 'story_flow',
        data: { label: '关联' },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(
      createCanvasEdge('project-1', {
        sourceNodeId: 'node-1',
        targetNodeId: 'node-2',
        relationType: 'story_flow',
        data: { label: '关联' },
      }),
    ).resolves.toEqual({
      id: 'edge-1',
      projectId: 'project-1',
      sourceNodeId: 'node-1',
      targetNodeId: 'node-2',
      relationType: 'story_flow',
      data: { label: '关联' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/projects/project-1/canvas/edges',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          source_node_id: 'node-1',
          target_node_id: 'node-2',
          relation_type: 'story_flow',
          data: { label: '关联' },
        }),
      }),
    );
  });
});
