import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  Asset,
  CanvasEdge,
  CanvasNode,
  GenerationTask,
  Project,
  Scene,
  Shot,
  Timeline,
} from '../types';
import * as api from '../api/client';

interface AppContextType {
  projects: Project[];
  scenes: Scene[];
  shots: Shot[];
  canvasNodes: CanvasNode[];
  canvasEdges: CanvasEdge[];
  assets: Asset[];
  timelines: Timeline[];
  tasks: GenerationTask[];
  isLoadingProjects: boolean;
  loadProjectData: (projectId: string) => Promise<void>;
  
  // Project methods
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Project>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  getProject: (id: string) => Project | undefined;
  
  // Scene methods
  createScene: (scene: Omit<Scene, 'id'>) => Promise<Scene>;
  updateScene: (id: string, updates: Partial<Scene>) => Promise<void>;
  deleteScene: (id: string) => Promise<void>;
  getScenesByProject: (projectId: string) => Scene[];
  
  // Shot methods
  createShot: (shot: Omit<Shot, 'id'>) => Promise<Shot>;
  updateShot: (id: string, updates: Partial<Shot>) => Promise<void>;
  deleteShot: (id: string) => Promise<void>;
  getShotsByProject: (projectId: string) => Shot[];
  getShotsByScene: (sceneId: string) => Shot[];

  // Canvas methods
  getCanvasNodesByProject: (projectId: string) => CanvasNode[];
  getCanvasEdgesByProject: (projectId: string) => CanvasEdge[];
  updateCanvasNode: (id: string, updates: Partial<CanvasNode>) => Promise<void>;
  moveCanvasNodeLocally: (id: string, position: CanvasNode['position']) => void;
  
  // Asset methods
  createAsset: (asset: Omit<Asset, 'id' | 'createdAt'>) => Asset;
  deleteAsset: (id: string) => void;
  getAssetsByProject: (projectId: string) => Asset[];
  getAssetsByShot: (shotId: string) => Asset[];
  
  // Timeline methods
  getTimeline: (projectId: string) => Timeline | undefined;
  updateTimeline: (projectId: string, timeline: Omit<Timeline, 'projectId'>) => void;
  
  // Task methods
  createTask: (task: Omit<GenerationTask, 'id' | 'createdAt'>) => GenerationTask;
  updateTask: (id: string, updates: Partial<GenerationTask>) => void;
  getTasksByProject: (projectId: string) => GenerationTask[];
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEY = 'director-canvas-data';

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [shots, setShots] = useState<Shot[]>([]);
  const [canvasNodes, setCanvasNodes] = useState<CanvasNode[]>([]);
  const [canvasEdges, setCanvasEdges] = useState<CanvasEdge[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);
  const [isLoadingProjects, setIsLoadingProjects] = useState(true);

  // Load API-backed project list on mount.
  useEffect(() => {
    void refreshProjects();
  }, []);

  // Load local prototype-only data on mount.
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setAssets(data.assets || []);
        setTimelines(data.timelines || []);
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  // Save prototype-only data to localStorage whenever it changes.
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        assets,
        timelines,
        tasks,
      }));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [assets, timelines, tasks]);

  // Project methods
  const createProject = async (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject = await api.createProject(project);
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    if (updates.script !== undefined) {
      await api.saveProjectScript(id, updates.script);
    }
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    ));
  };

  const deleteProject = async (id: string) => {
    await api.deleteProject(id);
    setProjects(prev => prev.filter(p => p.id !== id));
    setScenes(prev => prev.filter(s => s.projectId !== id));
    setShots(prev => prev.filter(s => s.projectId !== id));
    setCanvasNodes(prev => prev.filter(node => node.projectId !== id));
    setCanvasEdges(prev => prev.filter(edge => edge.projectId !== id));
    setAssets(prev => prev.filter(a => a.projectId !== id));
    setTimelines(prev => prev.filter(t => t.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const getProject = (id: string) => projects.find(p => p.id === id);

  // Scene methods
  const createScene = async (scene: Omit<Scene, 'id'>) => {
    const newScene = await api.createScene(scene);
    setScenes(prev => [...prev, newScene]);
    return newScene;
  };

  const updateScene = async (id: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteScene = async (id: string) => {
    const scene = scenes.find(s => s.id === id);
    if (scene) {
      await api.deleteScene(scene.projectId, id);
    }
    setScenes(prev => prev.filter(s => s.id !== id));
    setShots(prev => prev.filter(s => s.sceneId !== id));
    setCanvasNodes(prev => prev.filter(node => node.data.scene_id !== id));
  };

  const getScenesByProject = (projectId: string) => 
    scenes.filter(s => s.projectId === projectId).sort((a, b) => a.sceneNumber - b.sceneNumber);

  // Shot methods
  const createShot = async (shot: Omit<Shot, 'id'>) => {
    const newShot = await api.createShot(shot);
    setShots(prev => [...prev, newShot]);
    const projectCanvasNodes = await api.listCanvasNodes(shot.projectId);
    setCanvasNodes(prev => [
      ...prev.filter(node => node.projectId !== shot.projectId),
      ...projectCanvasNodes,
    ]);
    return newShot;
  };

  const updateShot = async (id: string, updates: Partial<Shot>) => {
    const shot = shots.find(s => s.id === id);
    if (shot) {
      const updatedShot = await api.updateShot(shot.projectId, id, updates);
      setShots(prev => prev.map(s => s.id === id ? updatedShot : s));
      return;
    }
    setShots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteShot = async (id: string) => {
    const shot = shots.find(s => s.id === id);
    if (shot) {
      await api.deleteShot(shot.projectId, id);
    }
    setShots(prev => prev.filter(s => s.id !== id));
    setCanvasNodes(prev => prev.filter(node => node.refType !== 'shot' || node.refId !== id));
  };

  const getShotsByProject = (projectId: string) => 
    shots.filter(s => s.projectId === projectId).sort((a, b) => a.shotNumber - b.shotNumber);

  const getShotsByScene = (sceneId: string) => 
    shots.filter(s => s.sceneId === sceneId).sort((a, b) => a.shotNumber - b.shotNumber);

  // Canvas methods
  const getCanvasNodesByProject = (projectId: string) =>
    canvasNodes.filter(node => node.projectId === projectId);

  const getCanvasEdgesByProject = (projectId: string) =>
    canvasEdges.filter(edge => edge.projectId === projectId);

  const updateCanvasNode = async (id: string, updates: Partial<CanvasNode>) => {
    const node = canvasNodes.find(canvasNode => canvasNode.id === id);
    if (!node) return;
    const updatedNode = await api.updateCanvasNode(node.projectId, id, updates);
    setCanvasNodes(prev => prev.map(canvasNode => canvasNode.id === id ? updatedNode : canvasNode));
  };

  const moveCanvasNodeLocally = (id: string, position: CanvasNode['position']) => {
    setCanvasNodes(prev => prev.map(node => node.id === id ? { ...node, position } : node));
  };

  // Asset methods
  const createAsset = (asset: Omit<Asset, 'id' | 'createdAt'>) => {
    const newAsset: Asset = {
      ...asset,
      id: generateId(),
      createdAt: Date.now(),
    };
    setAssets(prev => [...prev, newAsset]);
    return newAsset;
  };

  const deleteAsset = (id: string) => {
    setAssets(prev => prev.filter(a => a.id !== id));
  };

  const getAssetsByProject = (projectId: string) => 
    assets.filter(a => a.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);

  const getAssetsByShot = (shotId: string) => 
    assets.filter(a => a.shotId === shotId);

  // Timeline methods
  const getTimeline = (projectId: string) => 
    timelines.find(t => t.projectId === projectId);

  const updateTimeline = (projectId: string, timeline: Omit<Timeline, 'projectId'>) => {
    setTimelines(prev => {
      const existing = prev.find(t => t.projectId === projectId);
      if (existing) {
        return prev.map(t => t.projectId === projectId ? { ...timeline, projectId } : t);
      } else {
        return [...prev, { ...timeline, projectId }];
      }
    });
  };

  // Task methods
  const createTask = (task: Omit<GenerationTask, 'id' | 'createdAt'>) => {
    const newTask: GenerationTask = {
      ...task,
      id: generateId(),
      createdAt: Date.now(),
    };
    setTasks(prev => [...prev, newTask]);
    return newTask;
  };

  const updateTask = (id: string, updates: Partial<GenerationTask>) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const getTasksByProject = (projectId: string) => 
    tasks.filter(t => t.projectId === projectId).sort((a, b) => b.createdAt - a.createdAt);

  async function refreshProjects() {
    try {
      setProjects(await api.listProjects());
    } catch (error) {
      console.error('Failed to load projects:', error);
    } finally {
      setIsLoadingProjects(false);
    }
  }

  const loadProjectData = async (projectId: string) => {
    try {
      const [script, projectScenes, projectShots, projectCanvasNodes, projectCanvasEdges] =
        await Promise.all([
        api.getProjectScript(projectId),
        api.listScenes(projectId),
        api.listShots(projectId),
        api.listCanvasNodes(projectId),
        api.listCanvasEdges(projectId),
      ]);
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, script } : p));
      setScenes(prev => [
        ...prev.filter(scene => scene.projectId !== projectId),
        ...projectScenes,
      ]);
      setShots(prev => [
        ...prev.filter(shot => shot.projectId !== projectId),
        ...projectShots,
      ]);
      setCanvasNodes(prev => [
        ...prev.filter(node => node.projectId !== projectId),
        ...projectCanvasNodes,
      ]);
      setCanvasEdges(prev => [
        ...prev.filter(edge => edge.projectId !== projectId),
        ...projectCanvasEdges,
      ]);
    } catch (error) {
      console.error('Failed to load project data:', error);
    }
  };

  return (
    <AppContext.Provider value={{
      projects,
      scenes,
      shots,
      canvasNodes,
      canvasEdges,
      assets,
      timelines,
      tasks,
      isLoadingProjects,
      loadProjectData,
      createProject,
      updateProject,
      deleteProject,
      getProject,
      createScene,
      updateScene,
      deleteScene,
      getScenesByProject,
      createShot,
      updateShot,
      deleteShot,
      getShotsByProject,
      getShotsByScene,
      getCanvasNodesByProject,
      getCanvasEdgesByProject,
      updateCanvasNode,
      moveCanvasNodeLocally,
      createAsset,
      deleteAsset,
      getAssetsByProject,
      getAssetsByShot,
      getTimeline,
      updateTimeline,
      createTask,
      updateTask,
      getTasksByProject,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
