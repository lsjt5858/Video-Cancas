import React, { createContext, useContext, useEffect, useState } from 'react';
import { Project, Scene, Shot, Asset, Timeline, GenerationTask } from '../types';

interface AppContextType {
  projects: Project[];
  scenes: Scene[];
  shots: Shot[];
  assets: Asset[];
  timelines: Timeline[];
  tasks: GenerationTask[];
  
  // Project methods
  createProject: (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => Project;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getProject: (id: string) => Project | undefined;
  
  // Scene methods
  createScene: (scene: Omit<Scene, 'id'>) => Scene;
  updateScene: (id: string, updates: Partial<Scene>) => void;
  deleteScene: (id: string) => void;
  getScenesByProject: (projectId: string) => Scene[];
  
  // Shot methods
  createShot: (shot: Omit<Shot, 'id'>) => Shot;
  updateShot: (id: string, updates: Partial<Shot>) => void;
  deleteShot: (id: string) => void;
  getShotsByProject: (projectId: string) => Shot[];
  getShotsByScene: (sceneId: string) => Shot[];
  
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
  const [assets, setAssets] = useState<Asset[]>([]);
  const [timelines, setTimelines] = useState<Timeline[]>([]);
  const [tasks, setTasks] = useState<GenerationTask[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        setProjects(data.projects || []);
        setScenes(data.scenes || []);
        setShots(data.shots || []);
        setAssets(data.assets || []);
        setTimelines(data.timelines || []);
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }, []);

  // Save to localStorage whenever data changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        projects,
        scenes,
        shots,
        assets,
        timelines,
        tasks,
      }));
    } catch (error) {
      console.error('Failed to save data:', error);
    }
  }, [projects, scenes, shots, assets, timelines, tasks]);

  // Project methods
  const createProject = (project: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newProject: Project = {
      ...project,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setProjects(prev => [...prev, newProject]);
    return newProject;
  };

  const updateProject = (id: string, updates: Partial<Project>) => {
    setProjects(prev => prev.map(p => 
      p.id === id ? { ...p, ...updates, updatedAt: Date.now() } : p
    ));
  };

  const deleteProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
    setScenes(prev => prev.filter(s => s.projectId !== id));
    setShots(prev => prev.filter(s => s.projectId !== id));
    setAssets(prev => prev.filter(a => a.projectId !== id));
    setTimelines(prev => prev.filter(t => t.projectId !== id));
    setTasks(prev => prev.filter(t => t.projectId !== id));
  };

  const getProject = (id: string) => projects.find(p => p.id === id);

  // Scene methods
  const createScene = (scene: Omit<Scene, 'id'>) => {
    const newScene: Scene = {
      ...scene,
      id: generateId(),
    };
    setScenes(prev => [...prev, newScene]);
    return newScene;
  };

  const updateScene = (id: string, updates: Partial<Scene>) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteScene = (id: string) => {
    setScenes(prev => prev.filter(s => s.id !== id));
    setShots(prev => prev.filter(s => s.sceneId !== id));
  };

  const getScenesByProject = (projectId: string) => 
    scenes.filter(s => s.projectId === projectId).sort((a, b) => a.sceneNumber - b.sceneNumber);

  // Shot methods
  const createShot = (shot: Omit<Shot, 'id'>) => {
    const newShot: Shot = {
      ...shot,
      id: generateId(),
    };
    setShots(prev => [...prev, newShot]);
    return newShot;
  };

  const updateShot = (id: string, updates: Partial<Shot>) => {
    setShots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteShot = (id: string) => {
    setShots(prev => prev.filter(s => s.id !== id));
  };

  const getShotsByProject = (projectId: string) => 
    shots.filter(s => s.projectId === projectId).sort((a, b) => a.shotNumber - b.shotNumber);

  const getShotsByScene = (sceneId: string) => 
    shots.filter(s => s.sceneId === sceneId).sort((a, b) => a.shotNumber - b.shotNumber);

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

  return (
    <AppContext.Provider value={{
      projects,
      scenes,
      shots,
      assets,
      timelines,
      tasks,
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
