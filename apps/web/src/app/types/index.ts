export interface Project {
  id: string;
  name: string;
  type: 'short-drama' | 'vlog' | 'commercial' | 'other';
  aspectRatio: '16:9' | '9:16' | '1:1' | '4:3';
  targetDuration: number; // seconds
  script: string;
  createdAt: number;
  updatedAt: number;
}

export interface Scene {
  id: string;
  projectId: string;
  sceneNumber: number;
  description: string;
  location: string;
  timeOfDay: string;
  characters: string[];
}

export interface Shot {
  id: string;
  projectId: string;
  sceneId: string;
  shotNumber: number;
  description: string;
  shotType: 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'over-shoulder' | 'pov' | 'other';
  cameraMovement: 'static' | 'pan' | 'tilt' | 'zoom' | 'tracking' | 'dolly' | 'other';
  duration: number; // seconds
  dialogue?: string;
  prompt: string;
  imageUrl?: string;
  videoUrl?: string;
  position?: { x: number; y: number }; // Canvas position
}

export interface CanvasNode {
  id: string;
  projectId: string;
  nodeType: 'script' | 'scene' | 'shot' | 'character' | 'prompt' | 'image_result' | 'video_result' | 'export';
  title?: string;
  position: { x: number; y: number };
  size: { width: number; height: number };
  refType?: string;
  refId?: string;
  data: Record<string, unknown>;
}

export interface CanvasEdge {
  id: string;
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  relationType: string;
  data: Record<string, unknown>;
}

export interface Asset {
  id: string;
  projectId: string;
  shotId?: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  metadata: {
    width?: number;
    height?: number;
    duration?: number;
    format?: string;
    prompt?: string;
    generatedAt?: number;
  };
  createdAt: number;
}

export interface TimelineClip {
  id: string;
  shotId: string;
  assetId: string;
  startTime: number;
  duration: number;
  track: number;
}

export interface Timeline {
  projectId: string;
  clips: TimelineClip[];
}

export interface GenerationTask {
  id: string;
  projectId: string;
  shotId: string;
  type: 'image' | 'video';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  prompt: string;
  resultUrl?: string;
  error?: string;
  createdAt: number;
  completedAt?: number;
}
