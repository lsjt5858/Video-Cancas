import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import ScriptEditor from '../components/ScriptEditor';
import ShotList from '../components/ShotList';
import CanvasView from '../components/CanvasView';
import AssetLibrary from '../components/AssetLibrary';
import TimelineView from '../components/TimelineView';
import { getCanvasNodeDetails } from '../lib/canvasNodeDetails';
import { Scene } from '../types';
import { toast } from 'sonner';

export default function ProjectWorkspace() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    getProject,
    isLoadingProjects,
    loadProjectData,
    getCanvasNodesByProject,
    getScenesByProject,
    getShotsByProject,
    updateScene,
  } = useApp();
  const [activeTab, setActiveTab] = useState('script');
  const [selectedCanvasNodeId, setSelectedCanvasNodeId] = useState<string | null>(null);
  
  const project = projectId ? getProject(projectId) : undefined;
  const canvasNodes = project ? getCanvasNodesByProject(project.id) : [];
  const scenes = project ? getScenesByProject(project.id) : [];
  const shots = project ? getShotsByProject(project.id) : [];
  const selectedCanvasNode = canvasNodes.find(node => node.id === selectedCanvasNodeId);
  const selectedScene = selectedCanvasNode?.nodeType === 'scene' && selectedCanvasNode.refId
    ? scenes.find(scene => scene.id === selectedCanvasNode.refId)
    : undefined;
  const selectedCanvasNodeDetails = useMemo(
    () => selectedCanvasNode ? getCanvasNodeDetails(selectedCanvasNode, scenes, shots) : null,
    [selectedCanvasNode, scenes, shots],
  );

  useEffect(() => {
    if (!project && !isLoadingProjects) {
      toast.error('项目不存在');
      navigate('/');
    }
  }, [project, isLoadingProjects, navigate]);

  useEffect(() => {
    if (projectId && project) {
      void loadProjectData(projectId);
    }
  }, [projectId, project?.id]);

  if (!project) {
    return null;
  }

  const handleSave = () => {
    toast.success('项目已保存');
  };

  const handleSaveScene = async (sceneId: string, updates: Partial<Scene>) => {
    await updateScene(sceneId, updates);
    toast.success('场景已保存');
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-background px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h2 className="font-semibold">{project.name}</h2>
            <p className="text-sm text-muted-foreground">
              {project.type} · {project.aspectRatio} · {project.targetDuration}s
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="mr-2 size-4" />
            保存
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <div className="border-b bg-background px-4">
            <TabsList className="bg-transparent">
              <TabsTrigger value="script">剧本</TabsTrigger>
              <TabsTrigger value="shots">分镜</TabsTrigger>
              <TabsTrigger value="canvas">画布</TabsTrigger>
              <TabsTrigger value="assets">素材库</TabsTrigger>
              <TabsTrigger value="timeline">时间线</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden">
            <TabsContent value="script" className="h-full m-0">
              <ScriptEditor projectId={project.id} onGenerated={setActiveTab} />
            </TabsContent>

            <TabsContent value="shots" className="h-full m-0">
              <ShotList projectId={project.id} />
            </TabsContent>

            <TabsContent value="canvas" className="h-full m-0">
              <ResizablePanelGroup direction="horizontal">
                <ResizablePanel defaultSize={75} minSize={50}>
                  <CanvasView
                    projectId={project.id}
                    selectedNodeId={selectedCanvasNodeId}
                    onSelectedNodeIdChange={setSelectedCanvasNodeId}
                  />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={20}>
                  <CanvasNodeInspector
                    details={selectedCanvasNodeDetails}
                    scene={selectedScene}
                    onSaveScene={handleSaveScene}
                  />
                </ResizablePanel>
              </ResizablePanelGroup>
            </TabsContent>

            <TabsContent value="assets" className="h-full m-0">
              <AssetLibrary projectId={project.id} />
            </TabsContent>

            <TabsContent value="timeline" className="h-full m-0">
              <TimelineView projectId={project.id} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
}

function CanvasNodeInspector({
  details,
  scene,
  onSaveScene,
}: {
  details: ReturnType<typeof getCanvasNodeDetails> | null;
  scene?: Scene;
  onSaveScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
}) {
  const [sceneForm, setSceneForm] = useState<SceneForm | null>(null);
  const [isSavingScene, setIsSavingScene] = useState(false);

  useEffect(() => {
    if (!scene) {
      setSceneForm(null);
      return;
    }

    setSceneForm({
      sceneNumber: String(scene.sceneNumber),
      description: scene.description,
      location: scene.location,
      timeOfDay: scene.timeOfDay,
      characters: scene.characters.join('、'),
    });
  }, [scene]);

  if (!details) {
    return (
      <div className="h-full border-l bg-muted/20 p-4">
        <h3 className="font-semibold mb-4">属性面板</h3>
        <p className="text-sm text-muted-foreground">
          选择画布中的节点查看详情
        </p>
      </div>
    );
  }

  const handleSceneFormChange = (field: keyof SceneForm, value: string) => {
    setSceneForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSceneSave = async () => {
    if (!scene || !sceneForm) return;

    const sceneNumber = Number.parseInt(sceneForm.sceneNumber, 10);
    if (Number.isNaN(sceneNumber) || sceneNumber < 1) {
      toast.error('场景编号必须是大于 0 的整数');
      return;
    }

    try {
      setIsSavingScene(true);
      await onSaveScene(scene.id, {
        sceneNumber,
        description: sceneForm.description.trim(),
        location: sceneForm.location.trim(),
        timeOfDay: sceneForm.timeOfDay.trim(),
        characters: parseCharacters(sceneForm.characters),
      });
    } finally {
      setIsSavingScene(false);
    }
  };

  return (
    <div className="h-full overflow-auto border-l bg-muted/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-snug">{details.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{details.description}</p>
        </div>
        <Badge variant="outline" className="shrink-0">{details.typeLabel}</Badge>
      </div>

      <Separator className="mb-4" />

      {scene && sceneForm && (
        <>
          <div className="mb-4 space-y-3 rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium">编辑场景</h4>
              <Button size="sm" onClick={handleSceneSave} disabled={isSavingScene}>
                {isSavingScene ? '保存中...' : '保存'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                场景编号
                <Input
                  type="number"
                  min={1}
                  value={sceneForm.sceneNumber}
                  onChange={(event) => handleSceneFormChange('sceneNumber', event.target.value)}
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                时间
                <Input
                  value={sceneForm.timeOfDay}
                  onChange={(event) => handleSceneFormChange('timeOfDay', event.target.value)}
                />
              </label>
            </div>
            <label className="space-y-1 text-xs text-muted-foreground">
              场景描述
              <Textarea
                value={sceneForm.description}
                onChange={(event) => handleSceneFormChange('description', event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              地点
              <Input
                value={sceneForm.location}
                onChange={(event) => handleSceneFormChange('location', event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              角色
              <Input
                value={sceneForm.characters}
                onChange={(event) => handleSceneFormChange('characters', event.target.value)}
                placeholder="用顿号、逗号或换行分隔"
              />
            </label>
          </div>
          <Separator className="mb-4" />
        </>
      )}

      <div className="space-y-3">
        {details.rows.map(row => (
          <div key={row.label} className="rounded-md border bg-background p-3">
            <div className="text-xs text-muted-foreground">{row.label}</div>
            <div className="mt-1 break-words text-sm">{row.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

type SceneForm = {
  sceneNumber: string;
  description: string;
  location: string;
  timeOfDay: string;
  characters: string;
};

function parseCharacters(value: string): string[] {
  return value
    .split(/[、,\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}
