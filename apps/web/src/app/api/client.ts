import { Project, Scene, Shot } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

type ApiProject = {
  id: string;
  name: string;
  type: string;
  style: string | null;
  aspect_ratio: string;
  target_duration: number | null;
  status: string;
  created_at?: string;
  updated_at?: string;
};

type ApiScript = {
  id: string;
  project_id: string;
  title: string | null;
  content: string;
  analysis: Record<string, unknown> | null;
  version: number;
};

type ApiScene = {
  id: string;
  project_id: string;
  scene_number: number;
  description: string;
  location: string | null;
  time_of_day: string | null;
  characters: string[];
};

type ApiShot = {
  id: string;
  project_id: string;
  scene_id: string;
  shot_number: number;
  description: string;
  shot_type: Shot['shotType'];
  camera_movement: Shot['cameraMovement'];
  duration: number;
  dialogue: string | null;
  prompt: string;
  image_url: string | null;
  video_url: string | null;
  position: Shot['position'] | null;
};

type ApiProjectCreate = {
  name: string;
  type: string;
  style: string | null;
  aspect_ratio: Project['aspectRatio'];
  target_duration: number | null;
};

type ApiSceneCreate = {
  scene_number: number;
  description: string;
  location: string | null;
  time_of_day: string | null;
  characters: string[];
};

type ApiShotCreate = {
  scene_id: string;
  shot_number: number;
  description: string;
  shot_type: Shot['shotType'];
  camera_movement: Shot['cameraMovement'];
  duration: number;
  dialogue?: string;
  prompt: string;
  image_url?: string;
  video_url?: string;
  position?: Shot['position'];
};

type ApiShotUpdate = Partial<ApiShotCreate>;

export type ProjectCreateInput = Omit<Project, 'id' | 'createdAt' | 'updatedAt'>;

export function mapProjectFromApi(project: ApiProject): Project {
  return {
    id: project.id,
    name: project.name,
    type: mapProjectTypeFromApi(project.type),
    aspectRatio: project.aspect_ratio as Project['aspectRatio'],
    targetDuration: project.target_duration ?? 60,
    script: '',
    createdAt: project.created_at ? Date.parse(project.created_at) : Date.now(),
    updatedAt: project.updated_at ? Date.parse(project.updated_at) : Date.now(),
  };
}

export function mapSceneFromApi(scene: ApiScene): Scene {
  return {
    id: scene.id,
    projectId: scene.project_id,
    sceneNumber: scene.scene_number,
    description: scene.description,
    location: scene.location ?? '',
    timeOfDay: scene.time_of_day ?? '',
    characters: scene.characters,
  };
}

export function mapShotFromApi(shot: ApiShot): Shot {
  return {
    id: shot.id,
    projectId: shot.project_id,
    sceneId: shot.scene_id,
    shotNumber: shot.shot_number,
    description: shot.description,
    shotType: shot.shot_type,
    cameraMovement: shot.camera_movement,
    duration: shot.duration,
    dialogue: shot.dialogue ?? undefined,
    prompt: shot.prompt,
    imageUrl: shot.image_url ?? undefined,
    videoUrl: shot.video_url ?? undefined,
    position: shot.position ?? undefined,
  };
}

export async function listProjects(): Promise<Project[]> {
  const projects = await apiFetch<ApiProject[]>('/projects');
  return projects.map(mapProjectFromApi);
}

export async function createProject(input: ProjectCreateInput): Promise<Project> {
  const project = await apiFetch<ApiProject>('/projects', {
    method: 'POST',
    body: JSON.stringify(mapProjectCreateToApi(input)),
  });
  return mapProjectFromApi(project);
}

export async function deleteProject(projectId: string): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}`, { method: 'DELETE' });
}

export async function getProjectScript(projectId: string): Promise<string> {
  try {
    const script = await apiFetch<ApiScript>(`/projects/${projectId}/script`);
    return script.content;
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return '';
    }
    throw error;
  }
}

export async function saveProjectScript(projectId: string, content: string): Promise<string> {
  const script = await apiFetch<ApiScript>(`/projects/${projectId}/script`, {
    method: 'PUT',
    body: JSON.stringify({ title: null, content }),
  });
  return script.content;
}

export async function listScenes(projectId: string): Promise<Scene[]> {
  const scenes = await apiFetch<ApiScene[]>(`/projects/${projectId}/scenes`);
  return scenes.map(mapSceneFromApi);
}

export async function createScene(input: Omit<Scene, 'id'>): Promise<Scene> {
  const scene = await apiFetch<ApiScene>(`/projects/${input.projectId}/scenes`, {
    method: 'POST',
    body: JSON.stringify(mapSceneCreateToApi(input)),
  });
  return mapSceneFromApi(scene);
}

export async function deleteScene(projectId: string, sceneId: string): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}/scenes/${sceneId}`, { method: 'DELETE' });
}

export async function listShots(projectId: string): Promise<Shot[]> {
  const shots = await apiFetch<ApiShot[]>(`/projects/${projectId}/shots`);
  return shots.map(mapShotFromApi);
}

export async function createShot(input: Omit<Shot, 'id'>): Promise<Shot> {
  const shot = await apiFetch<ApiShot>(`/projects/${input.projectId}/shots`, {
    method: 'POST',
    body: JSON.stringify(mapShotCreateToApi(input)),
  });
  return mapShotFromApi(shot);
}

export async function updateShot(
  projectId: string,
  shotId: string,
  updates: Partial<Shot>,
): Promise<Shot> {
  const shot = await apiFetch<ApiShot>(`/projects/${projectId}/shots/${shotId}`, {
    method: 'PATCH',
    body: JSON.stringify(mapShotUpdateToApi(updates)),
  });
  return mapShotFromApi(shot);
}

export async function deleteShot(projectId: string, shotId: string): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}/shots/${shotId}`, { method: 'DELETE' });
}

function mapProjectCreateToApi(input: ProjectCreateInput): ApiProjectCreate {
  return {
    name: input.name,
    type: mapProjectTypeToApi(input.type),
    style: 'realistic_cinematic',
    aspect_ratio: input.aspectRatio,
    target_duration: input.targetDuration,
  };
}

function mapSceneCreateToApi(input: Omit<Scene, 'id'>): ApiSceneCreate {
  return {
    scene_number: input.sceneNumber,
    description: input.description,
    location: input.location || null,
    time_of_day: input.timeOfDay || null,
    characters: input.characters,
  };
}

function mapShotCreateToApi(input: Omit<Shot, 'id'>): ApiShotCreate {
  return {
    scene_id: input.sceneId,
    shot_number: input.shotNumber,
    description: input.description,
    shot_type: input.shotType,
    camera_movement: input.cameraMovement,
    duration: input.duration,
    dialogue: input.dialogue,
    prompt: input.prompt,
    image_url: input.imageUrl,
    video_url: input.videoUrl,
    position: input.position,
  };
}

function mapShotUpdateToApi(updates: Partial<Shot>): ApiShotUpdate {
  const payload: ApiShotUpdate = {};
  if (updates.sceneId !== undefined) payload.scene_id = updates.sceneId;
  if (updates.shotNumber !== undefined) payload.shot_number = updates.shotNumber;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.shotType !== undefined) payload.shot_type = updates.shotType;
  if (updates.cameraMovement !== undefined) payload.camera_movement = updates.cameraMovement;
  if (updates.duration !== undefined) payload.duration = updates.duration;
  if (updates.dialogue !== undefined) payload.dialogue = updates.dialogue;
  if (updates.prompt !== undefined) payload.prompt = updates.prompt;
  if (updates.imageUrl !== undefined) payload.image_url = updates.imageUrl;
  if (updates.videoUrl !== undefined) payload.video_url = updates.videoUrl;
  if (updates.position !== undefined) payload.position = updates.position;
  return payload;
}

function mapProjectTypeToApi(type: Project['type']): string {
  return type === 'short-drama' ? 'short_drama' : type;
}

function mapProjectTypeFromApi(type: string): Project['type'] {
  return type === 'short_drama' ? 'short-drama' : (type as Project['type']);
}

async function apiFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    throw new ApiError(response.status, await response.text());
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
  }
}
