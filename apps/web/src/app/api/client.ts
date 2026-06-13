import { CanvasEdge, CanvasNode, Project, Scene, Shot } from '../types';
import { CanvasNodeCreateInput } from '../lib/canvasBlankMenu';

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

type ApiCanvasNode = {
  id: string;
  project_id: string;
  node_type: CanvasNode['nodeType'];
  title: string | null;
  position: CanvasNode['position'];
  size: CanvasNode['size'];
  ref_type: string | null;
  ref_id: string | null;
  data: Record<string, unknown>;
};

type ApiCanvasEdge = {
  id: string;
  project_id: string;
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  data: Record<string, unknown>;
};

type ApiCanvasEdgeCreate = {
  source_node_id: string;
  target_node_id: string;
  relation_type: string;
  data: Record<string, unknown>;
};

type ApiCanvasNodeCreate = {
  node_type: CanvasNode['nodeType'];
  title?: string;
  position: CanvasNode['position'];
  size: CanvasNode['size'];
  ref_type?: string;
  ref_id?: string;
  data: Record<string, unknown>;
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

type ApiSceneUpdate = Partial<ApiSceneCreate>;

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

type ApiCanvasNodeUpdate = {
  title?: string;
  position?: CanvasNode['position'];
  size?: CanvasNode['size'];
  data?: Record<string, unknown>;
};

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

export function mapCanvasNodeFromApi(node: ApiCanvasNode): CanvasNode {
  return {
    id: node.id,
    projectId: node.project_id,
    nodeType: node.node_type,
    title: node.title ?? undefined,
    position: node.position,
    size: node.size,
    refType: node.ref_type ?? undefined,
    refId: node.ref_id ?? undefined,
    data: node.data,
  };
}

export function mapCanvasEdgeFromApi(edge: ApiCanvasEdge): CanvasEdge {
  return {
    id: edge.id,
    projectId: edge.project_id,
    sourceNodeId: edge.source_node_id,
    targetNodeId: edge.target_node_id,
    relationType: edge.relation_type,
    data: edge.data,
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

export async function updateScene(
  projectId: string,
  sceneId: string,
  updates: Partial<Scene>,
): Promise<Scene> {
  const scene = await apiFetch<ApiScene>(`/projects/${projectId}/scenes/${sceneId}`, {
    method: 'PATCH',
    body: JSON.stringify(mapSceneUpdateToApi(updates)),
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

export async function listCanvasNodes(projectId: string): Promise<CanvasNode[]> {
  const nodes = await apiFetch<ApiCanvasNode[]>(`/projects/${projectId}/canvas/nodes`);
  return nodes.map(mapCanvasNodeFromApi);
}

export async function createCanvasNode(
  projectId: string,
  input: CanvasNodeCreateInput,
): Promise<CanvasNode> {
  const node = await apiFetch<ApiCanvasNode>(`/projects/${projectId}/canvas/nodes`, {
    method: 'POST',
    body: JSON.stringify(mapCanvasNodeCreateToApi(input)),
  });
  return mapCanvasNodeFromApi(node);
}

export async function updateCanvasNode(
  projectId: string,
  nodeId: string,
  updates: Partial<Pick<CanvasNode, 'title' | 'position' | 'size' | 'data'>>,
): Promise<CanvasNode> {
  const node = await apiFetch<ApiCanvasNode>(`/projects/${projectId}/canvas/nodes/${nodeId}`, {
    method: 'PATCH',
    body: JSON.stringify(mapCanvasNodeUpdateToApi(updates)),
  });
  return mapCanvasNodeFromApi(node);
}

export async function deleteCanvasNode(projectId: string, nodeId: string): Promise<void> {
  await apiFetch<void>(`/projects/${projectId}/canvas/nodes/${nodeId}`, {
    method: 'DELETE',
  });
}

export async function listCanvasEdges(projectId: string): Promise<CanvasEdge[]> {
  const edges = await apiFetch<ApiCanvasEdge[]>(`/projects/${projectId}/canvas/edges`);
  return edges.map(mapCanvasEdgeFromApi);
}

export async function createCanvasEdge(
  projectId: string,
  input: Pick<CanvasEdge, 'sourceNodeId' | 'targetNodeId' | 'relationType' | 'data'>,
): Promise<CanvasEdge> {
  const edge = await apiFetch<ApiCanvasEdge>(`/projects/${projectId}/canvas/edges`, {
    method: 'POST',
    body: JSON.stringify(mapCanvasEdgeCreateToApi(input)),
  });
  return mapCanvasEdgeFromApi(edge);
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

function mapSceneUpdateToApi(updates: Partial<Scene>): ApiSceneUpdate {
  const payload: ApiSceneUpdate = {};
  if (updates.sceneNumber !== undefined) payload.scene_number = updates.sceneNumber;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.location !== undefined) payload.location = updates.location || null;
  if (updates.timeOfDay !== undefined) payload.time_of_day = updates.timeOfDay || null;
  if (updates.characters !== undefined) payload.characters = updates.characters;
  return payload;
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

function mapCanvasNodeUpdateToApi(
  updates: Partial<Pick<CanvasNode, 'title' | 'position' | 'size' | 'data'>>,
): ApiCanvasNodeUpdate {
  const payload: ApiCanvasNodeUpdate = {};
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.position !== undefined) payload.position = updates.position;
  if (updates.size !== undefined) payload.size = updates.size;
  if (updates.data !== undefined) payload.data = updates.data;
  return payload;
}

function mapCanvasNodeCreateToApi(input: CanvasNodeCreateInput): ApiCanvasNodeCreate {
  return {
    node_type: input.nodeType,
    title: input.title,
    position: input.position,
    size: input.size,
    ref_type: input.refType,
    ref_id: input.refId,
    data: input.data,
  };
}

function mapCanvasEdgeCreateToApi(
  input: Pick<CanvasEdge, 'sourceNodeId' | 'targetNodeId' | 'relationType' | 'data'>,
): ApiCanvasEdgeCreate {
  return {
    source_node_id: input.sourceNodeId,
    target_node_id: input.targetNodeId,
    relation_type: input.relationType,
    data: input.data,
  };
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
