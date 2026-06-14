import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '../components/ui/resizable';
import { Separator } from '../components/ui/separator';
import { Textarea } from '../components/ui/textarea';
import { ArrowLeft, Copy, ExternalLink, ImageIcon, Save, Video } from 'lucide-react';
import ScriptEditor from '../components/ScriptEditor';
import ShotList from '../components/ShotList';
import CanvasView from '../components/CanvasView';
import AssetLibrary from '../components/AssetLibrary';
import TimelineView from '../components/TimelineView';
import {
  buildCanvasNodeDialogDetails,
  CanvasNodeDialogDetails,
  CanvasNodeDetailRow,
  formatCanvasNodeDetailsForCopy,
  getCanvasNodeDetails,
} from '../lib/canvasNodeDetails';
import { CanvasNodeContextMenuAction } from '../lib/canvasNodeContextMenu';
import {
  createStoryboardGenerationPlan,
  createStoryboardShotPlan,
} from '../lib/storyboardGeneration';
import {
  GenerationModel,
  getDefaultGenerationModel,
  getGenerationModelById,
  getGenerationModelsByType,
} from '../lib/generationModels';
import {
  IMAGE_ASPECT_RATIO_OPTIONS,
  IMAGE_REFERENCE_MODE_OPTIONS,
  IMAGE_STYLE_OPTIONS,
  ImageGenerationParams,
  createDefaultImageGenerationParams,
} from '../lib/imageGenerationParams';
import { buildShotForm, parseShotForm, ShotForm } from '../lib/shotForm';
import { CanvasNode, Scene, Shot } from '../types';
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
    createScene,
    createShot,
    deleteCanvasNode,
    updateScene,
    updateShot,
  } = useApp();
  const [activeTab, setActiveTab] = useState('script');
  const [selectedCanvasNodeId, setSelectedCanvasNodeId] = useState<string | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  
  const project = projectId ? getProject(projectId) : undefined;
  const canvasNodes = project ? getCanvasNodesByProject(project.id) : [];
  const scenes = project ? getScenesByProject(project.id) : [];
  const shots = project ? getShotsByProject(project.id) : [];
  const selectedCanvasNode = canvasNodes.find(node => node.id === selectedCanvasNodeId);
  const selectedScene = selectedCanvasNode?.nodeType === 'scene' && selectedCanvasNode.refId
    ? scenes.find(scene => scene.id === selectedCanvasNode.refId)
    : undefined;
  const selectedShot = selectedCanvasNode?.nodeType === 'shot' && selectedCanvasNode.refId
    ? shots.find(shot => shot.id === selectedCanvasNode.refId)
    : undefined;
  const selectedCanvasNodeDetails = useMemo(
    () => selectedCanvasNode ? getCanvasNodeDetails(selectedCanvasNode, scenes, shots) : null,
    [selectedCanvasNode, scenes, shots],
  );
  const selectedCanvasNodeDialogDetails = useMemo(
    () => selectedCanvasNode ? buildCanvasNodeDialogDetails(selectedCanvasNode, scenes, shots) : null,
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

  const handleSaveShot = async (shotId: string, updates: Partial<Shot>) => {
    await updateShot(shotId, updates);
    toast.success('镜头已保存');
  };

  const handleNodeContextMenuAction = async (
    action: CanvasNodeContextMenuAction,
    node: CanvasNode,
  ) => {
    setSelectedCanvasNodeId(node.id);
    const dialogDetails = buildCanvasNodeDialogDetails(node, scenes, shots);

    if (action === 'view_details') {
      setIsDetailDialogOpen(true);
      return;
    }

    if (action === 'copy_info') {
      await copyNodeDetailsToClipboard(dialogDetails);
      toast.success('节点信息已复制');
      return;
    }

    if (action === 'delete_node') {
      await deleteCanvasNode(node.id);
      setSelectedCanvasNodeId(null);
      toast.success('节点已删除');
      return;
    }

    if (action === 'generate_storyboard') {
      try {
        const generatedCount = await generateStoryboardFromCanvasNode(
          node,
          project.id,
          scenes,
          shots,
          createScene,
          createShot,
        );
        toast.success(`已生成 ${generatedCount} 个分镜`);
      } catch (error) {
        toast.error('生成分镜失败');
      }
      return;
    }

    toast.info('该操作待接入');
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
                    onNodeContextMenuAction={(action, node) => {
                      void handleNodeContextMenuAction(action, node);
                    }}
                  />
                </ResizablePanel>
                <ResizableHandle />
                <ResizablePanel defaultSize={25} minSize={20}>
                  <CanvasNodeInspector
                    node={selectedCanvasNode}
                    details={selectedCanvasNodeDetails}
                    dialogDetails={selectedCanvasNodeDialogDetails}
                    scene={selectedScene}
                    shot={selectedShot}
                    detailDialogOpen={isDetailDialogOpen}
                    onDetailDialogOpenChange={setIsDetailDialogOpen}
                    onSaveScene={handleSaveScene}
                    onSaveShot={handleSaveShot}
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
  node,
  details,
  dialogDetails,
  scene,
  shot,
  detailDialogOpen,
  onDetailDialogOpenChange,
  onSaveScene,
  onSaveShot,
}: {
  node?: CanvasNode;
  details: ReturnType<typeof getCanvasNodeDetails> | null;
  dialogDetails: CanvasNodeDialogDetails | null;
  scene?: Scene;
  shot?: Shot;
  detailDialogOpen: boolean;
  onDetailDialogOpenChange: (open: boolean) => void;
  onSaveScene: (sceneId: string, updates: Partial<Scene>) => Promise<void>;
  onSaveShot: (shotId: string, updates: Partial<Shot>) => Promise<void>;
}) {
  const [sceneForm, setSceneForm] = useState<SceneForm | null>(null);
  const [shotForm, setShotForm] = useState<ShotForm | null>(null);
  const [isSavingScene, setIsSavingScene] = useState(false);
  const [isSavingShot, setIsSavingShot] = useState(false);
  const [selectedImageModelId, setSelectedImageModelId] = useState(
    getDefaultGenerationModel('image').id,
  );
  const [selectedVideoModelId, setSelectedVideoModelId] = useState(
    getDefaultGenerationModel('video').id,
  );
  const [imageParams, setImageParams] = useState<ImageGenerationParams>(
    createDefaultImageGenerationParams,
  );

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

  useEffect(() => {
    if (!shot) {
      setShotForm(null);
      return;
    }

    setShotForm(buildShotForm(shot));
  }, [shot]);

  if (!details) {
    return (
      <div className="h-full border-l bg-muted/20 p-4">
        <h3 className="font-semibold mb-4">视频创作信息</h3>
        <p className="text-sm text-muted-foreground">
          选择场景或镜头节点，查看剧情、提示词、素材和生成状态。
        </p>
      </div>
    );
  }

  const handleSceneFormChange = (field: keyof SceneForm, value: string) => {
    setSceneForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleShotFormChange = <K extends keyof ShotForm>(field: K, value: ShotForm[K]) => {
    setShotForm(prev => prev ? { ...prev, [field]: value } : prev);
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

  const handleShotSave = async () => {
    if (!shot || !shotForm) return;

    const result = parseShotForm(shotForm);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }

    try {
      setIsSavingShot(true);
      await onSaveShot(shot.id, result.updates);
    } finally {
      setIsSavingShot(false);
    }
  };

  return (
    <div className="h-full overflow-auto border-l bg-muted/20 p-4">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-semibold leading-snug">{details.title}</h3>
          <p className="mt-1 text-sm text-muted-foreground">{details.description}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-2">
          <Badge variant="outline">{details.typeLabel}</Badge>
          {dialogDetails && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDetailDialogOpenChange(true)}
            >
              完整信息
            </Button>
          )}
        </div>
      </div>

      <Separator className="mb-4" />

      {node && (node.nodeType === 'shot' || node.nodeType === 'prompt') && (
        <>
          <GenerationModelSelectorPanel
            selectedImageModelId={selectedImageModelId}
            selectedVideoModelId={selectedVideoModelId}
            onSelectedImageModelIdChange={setSelectedImageModelId}
            onSelectedVideoModelIdChange={setSelectedVideoModelId}
          />
          <ImageGenerationParamsPanel
            params={imageParams}
            onParamsChange={setImageParams}
          />
          <Separator className="mb-4" />
        </>
      )}

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

      {shot && shotForm && (
        <>
          <div className="mb-4 space-y-3 rounded-lg border bg-background p-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-sm font-medium">编辑镜头</h4>
              <Button size="sm" onClick={handleShotSave} disabled={isSavingShot}>
                {isSavingShot ? '保存中...' : '保存'}
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                镜头编号
                <Input
                  type="number"
                  min={1}
                  value={shotForm.shotNumber}
                  onChange={(event) => handleShotFormChange('shotNumber', event.target.value)}
                />
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                时长（秒）
                <Input
                  type="number"
                  min={0.1}
                  step={0.1}
                  value={shotForm.duration}
                  onChange={(event) => handleShotFormChange('duration', event.target.value)}
                />
              </label>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <label className="space-y-1 text-xs text-muted-foreground">
                景别
                <Select
                  value={shotForm.shotType}
                  onValueChange={(value) =>
                    handleShotFormChange('shotType', value as Shot['shotType'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {SHOT_TYPE_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <label className="space-y-1 text-xs text-muted-foreground">
                运镜
                <Select
                  value={shotForm.cameraMovement}
                  onValueChange={(value) =>
                    handleShotFormChange('cameraMovement', value as Shot['cameraMovement'])
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CAMERA_MOVEMENT_OPTIONS.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            </div>
            <label className="space-y-1 text-xs text-muted-foreground">
              镜头描述
              <Textarea
                value={shotForm.description}
                onChange={(event) => handleShotFormChange('description', event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              台词
              <Textarea
                value={shotForm.dialogue}
                onChange={(event) => handleShotFormChange('dialogue', event.target.value)}
              />
            </label>
            <label className="space-y-1 text-xs text-muted-foreground">
              提示词
              <Textarea
                value={shotForm.prompt}
                onChange={(event) => handleShotFormChange('prompt', event.target.value)}
              />
            </label>
          </div>
          <Separator className="mb-4" />
        </>
      )}

      <div className="space-y-3">
        {details.rows.map(row => (
          <CanvasNodeDetailRowView key={row.label} row={row} compact />
        ))}
      </div>

      <CanvasNodeDetailDialog
        details={dialogDetails}
        open={detailDialogOpen}
        onOpenChange={onDetailDialogOpenChange}
      />
    </div>
  );
}

function GenerationModelSelectorPanel({
  selectedImageModelId,
  selectedVideoModelId,
  onSelectedImageModelIdChange,
  onSelectedVideoModelIdChange,
}: {
  selectedImageModelId: string;
  selectedVideoModelId: string;
  onSelectedImageModelIdChange: (modelId: string) => void;
  onSelectedVideoModelIdChange: (modelId: string) => void;
}) {
  const selectedImageModel = getGenerationModelById(selectedImageModelId);
  const selectedVideoModel = getGenerationModelById(selectedVideoModelId);

  return (
    <div className="mb-4 space-y-3 rounded-lg border bg-background p-3">
      <div>
        <h4 className="text-sm font-medium">生成模型</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          为后续生图、生视频操作预先选择模型策略。
        </p>
      </div>
      <GenerationModelSelect
        label="生图模型"
        value={selectedImageModelId}
        models={getGenerationModelsByType('image')}
        selectedModel={selectedImageModel}
        onValueChange={onSelectedImageModelIdChange}
      />
      <GenerationModelSelect
        label="生视频模型"
        value={selectedVideoModelId}
        models={getGenerationModelsByType('video')}
        selectedModel={selectedVideoModel}
        onValueChange={onSelectedVideoModelIdChange}
      />
    </div>
  );
}

function GenerationModelSelect({
  label,
  value,
  models,
  selectedModel,
  onValueChange,
}: {
  label: string;
  value: string;
  models: GenerationModel[];
  selectedModel?: GenerationModel;
  onValueChange: (modelId: string) => void;
}) {
  return (
    <label className="block space-y-1 text-xs text-muted-foreground">
      {label}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {models.map(model => (
            <SelectItem key={model.id} value={model.id}>
              {model.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedModel && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          {selectedModel.description}
        </p>
      )}
    </label>
  );
}

function ImageGenerationParamsPanel({
  params,
  onParamsChange,
}: {
  params: ImageGenerationParams;
  onParamsChange: (params: ImageGenerationParams) => void;
}) {
  const updateParams = <K extends keyof ImageGenerationParams>(
    field: K,
    value: ImageGenerationParams[K],
  ) => {
    onParamsChange({ ...params, [field]: value });
  };

  return (
    <div className="mb-4 space-y-3 rounded-lg border bg-background p-3">
      <div>
        <h4 className="text-sm font-medium">生图参数</h4>
        <p className="mt-1 text-xs text-muted-foreground">
          设置画幅、风格、参考输入、负向提示词、种子和候选数量。
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-muted-foreground">
          画幅
          <Select
            value={params.aspectRatio}
            onValueChange={(value) => updateParams('aspectRatio', value as ImageGenerationParams['aspectRatio'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_ASPECT_RATIO_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          风格
          <Select
            value={params.style}
            onValueChange={(value) => updateParams('style', value as ImageGenerationParams['style'])}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {IMAGE_STYLE_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
      <label className="space-y-1 text-xs text-muted-foreground">
        参考图
        <Select
          value={params.referenceMode}
          onValueChange={(value) => updateParams('referenceMode', value as ImageGenerationParams['referenceMode'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {IMAGE_REFERENCE_MODE_OPTIONS.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </label>
      <label className="space-y-1 text-xs text-muted-foreground">
        负向提示词
        <Textarea
          value={params.negativePrompt}
          onChange={(event) => updateParams('negativePrompt', event.target.value)}
          placeholder="例如：低清晰度、畸形手部、文字水印"
        />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className="space-y-1 text-xs text-muted-foreground">
          种子
          <Input
            value={params.seed}
            onChange={(event) => updateParams('seed', event.target.value)}
            placeholder="留空随机"
          />
        </label>
        <label className="space-y-1 text-xs text-muted-foreground">
          候选数量
          <Input
            type="number"
            min={1}
            max={8}
            value={params.candidateCount}
            onChange={(event) => updateParams(
              'candidateCount',
              Number.parseInt(event.target.value, 10) || 1,
            )}
          />
        </label>
      </div>
    </div>
  );
}

function CanvasNodeDetailDialog({
  details,
  open,
  onOpenChange,
}: {
  details: CanvasNodeDialogDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!details) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-3 pr-8">
            <div>
              <DialogTitle>{details.title}</DialogTitle>
              <DialogDescription className="mt-2">{details.description}</DialogDescription>
            </div>
            <Badge variant="outline" className="shrink-0">{details.typeLabel}</Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {details.sections.map(section => (
            <section key={section.title} className="rounded-lg border bg-muted/20 p-4">
              <h4 className="mb-3 text-sm font-medium">{section.title}</h4>
              <div className="space-y-3">
                {section.rows.map(row => (
                  <CanvasNodeDetailRowView key={`${section.title}-${row.label}`} row={row} />
                ))}
              </div>
            </section>
          ))}
        </div>

        <div className="rounded-md border border-dashed bg-muted/20 p-3 text-sm text-muted-foreground">
          {details.footerNote}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CanvasNodeDetailRowView({
  row,
  compact = false,
}: {
  row: CanvasNodeDetailRow;
  compact?: boolean;
}) {
  if (row.kind === 'asset_result') {
    return <AssetResultCard row={row} compact={compact} />;
  }

  return (
    <div className={compact ? 'rounded-md border bg-background p-3' : undefined}>
      <div className="text-xs text-muted-foreground">{row.label}</div>
      <div className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
        {row.value}
      </div>
    </div>
  );
}

function AssetResultCard({
  row,
  compact,
}: {
  row: CanvasNodeDetailRow;
  compact: boolean;
}) {
  const isGenerated = Boolean(row.url);
  const icon = row.assetType === 'video'
    ? <Video className="size-4" />
    : <ImageIcon className="size-4" />;

  return (
    <div className="rounded-md border bg-background p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2">
          <div className="mt-0.5 rounded-md bg-muted p-1.5 text-muted-foreground">
            {icon}
          </div>
          <div className="min-w-0">
            <div className="text-xs text-muted-foreground">{row.label}</div>
            <div className="mt-1 flex items-center gap-2">
              <Badge variant={isGenerated ? 'default' : 'outline'}>
                {row.value}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {isGenerated ? '可用于后续生成链路' : '等待生成任务产出'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {!compact && row.assetType === 'image' && row.url && (
        <div className="mt-3 overflow-hidden rounded-md border bg-muted">
          <img src={row.url} alt={row.label} className="h-36 w-full object-cover" />
        </div>
      )}

      {!compact && row.url && (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <a href={row.url} target="_blank" rel="noreferrer">
              <ExternalLink className="size-3.5" />
              打开链接
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void navigator.clipboard.writeText(row.url ?? '').then(() => {
                toast.success(`${row.label}链接已复制`);
              });
            }}
          >
            <Copy className="size-3.5" />
            复制链接
          </Button>
        </div>
      )}
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

const SHOT_TYPE_OPTIONS: Array<{ value: Shot['shotType']; label: string }> = [
  { value: 'wide', label: '远景' },
  { value: 'medium', label: '中景' },
  { value: 'close-up', label: '近景' },
  { value: 'extreme-close-up', label: '特写' },
  { value: 'over-shoulder', label: '过肩' },
  { value: 'pov', label: '主观视角' },
  { value: 'other', label: '其他' },
];

const CAMERA_MOVEMENT_OPTIONS: Array<{ value: Shot['cameraMovement']; label: string }> = [
  { value: 'static', label: '固定' },
  { value: 'pan', label: '摇摄' },
  { value: 'tilt', label: '俯仰' },
  { value: 'zoom', label: '变焦' },
  { value: 'tracking', label: '跟拍' },
  { value: 'dolly', label: '推拉' },
  { value: 'other', label: '其他' },
];

function parseCharacters(value: string): string[] {
  return value
    .split(/[、,\n]/)
    .map(item => item.trim())
    .filter(Boolean);
}

async function generateStoryboardFromCanvasNode(
  node: CanvasNode,
  projectId: string,
  scenes: Scene[],
  shots: Shot[],
  createScene: (scene: Omit<Scene, 'id'>) => Promise<Scene>,
  createShot: (shot: Omit<Shot, 'id'>) => Promise<Shot>,
): Promise<number> {
  if (node.nodeType === 'script') {
    const plan = createStoryboardGenerationPlan(projectId);
    const scene = await createScene(plan.scene);
    for (const shot of plan.shots) {
      await createShot({ sceneId: scene.id, ...shot });
    }
    return plan.shots.length;
  }

  if (node.nodeType === 'scene' && node.refId) {
    const scene = scenes.find(item => item.id === node.refId);
    if (!scene) {
      throw new Error('Scene node is not linked to an existing scene');
    }
    const sceneShots = shots.filter(shot => shot.sceneId === scene.id);
    const nextShotNumber = Math.max(0, ...sceneShots.map(shot => shot.shotNumber)) + 1;
    const shotPlan = createStoryboardShotPlan(projectId, nextShotNumber);
    for (const shot of shotPlan) {
      await createShot({ sceneId: scene.id, ...shot });
    }
    return shotPlan.length;
  }

  throw new Error('Unsupported storyboard generation node');
}

async function copyNodeDetailsToClipboard(details: CanvasNodeDialogDetails): Promise<void> {
  await navigator.clipboard.writeText(formatCanvasNodeDetailsForCopy(details));
}
