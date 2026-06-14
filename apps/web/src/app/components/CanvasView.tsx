import { useEffect, useMemo, useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from './ui/context-menu';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Image,
  Video,
  FileText,
  MapPin,
  Link2,
  Search,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { getCanvasNodePresentation } from '../lib/canvasNodePresentation';
import { getCanvasEdgePresentation } from '../lib/canvasEdgePresentation';
import { searchCanvasNodes } from '../lib/canvasSearch';
import {
  CanvasNodeContextMenuAction,
  getCanvasNodeContextMenuItems,
} from '../lib/canvasNodeContextMenu';
import { getCanvasNodeGenerationActions } from '../lib/canvasNodeGenerationActions';
import {
  calculateCenteredView,
  calculateFitView,
  calculateFocusedView,
  calculateMiniMapLayout,
  MiniMapLayout,
} from '../lib/canvasViewport';
import {
  applyNodeSelectionDelta,
  calculateAlignedNodePositions,
  calculateDistributedNodePositions,
  CanvasAlignDirection,
  CanvasDistributeDirection,
  CanvasPoint,
  getCanvasNodesInSelection,
  normalizeSelectionRect,
} from '../lib/canvasSelection';
import { getVisibleCanvasGraph } from '../lib/canvasVisibility';
import {
  BlankCanvasNodeType,
  createBlankCanvasNodeInput,
} from '../lib/canvasBlankMenu';
import {
  buildCanvasNodeGroups,
  CanvasNodeGroup,
} from '../lib/canvasNodeGroups';
import { CanvasNode, Scene, Shot } from '../types';

interface CanvasViewProps {
  projectId: string;
  selectedNodeId: string | null;
  onSelectedNodeIdChange: (nodeId: string | null) => void;
  onNodeContextMenuAction: (action: CanvasNodeContextMenuAction, node: CanvasNode) => void;
}

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

type BlankCanvasMenuState = {
  screenX: number;
  screenY: number;
  canvasPoint: CanvasPoint;
};

const MINI_MAP_SIZE = { width: 180, height: 120 };

export default function CanvasView({
  projectId,
  selectedNodeId,
  onSelectedNodeIdChange,
  onNodeContextMenuAction,
}: CanvasViewProps) {
  const {
    getCanvasNodesByProject,
    getCanvasEdgesByProject,
    getScenesByProject,
    getShotsByProject,
    createCanvasNode,
    deleteCanvasNode,
    createCanvasEdge,
    moveCanvasNodeLocally,
    updateCanvasNode,
  } = useApp();
  const scenes = getScenesByProject(projectId);
  const shots = getShotsByProject(projectId);
  const nodes = getCanvasNodesByProject(projectId);
  const edges = getCanvasEdgesByProject(projectId);
  const [canvas, setCanvas] = useState<CanvasState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([]);
  const [selectionStart, setSelectionStart] = useState<CanvasPoint | null>(null);
  const [selectionCurrent, setSelectionCurrent] = useState<CanvasPoint | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<CanvasPoint | null>(null);
  const [dragStartNodes, setDragStartNodes] = useState<CanvasNode[]>([]);
  const [collapsedSceneIds, setCollapsedSceneIds] = useState<string[]>([]);
  const [showNodeGroups, setShowNodeGroups] = useState(true);
  const [connectingFromNodeId, setConnectingFromNodeId] = useState<string | null>(null);
  const [connectionPointer, setConnectionPointer] = useState<{ x: number; y: number } | null>(null);
  const [blankMenu, setBlankMenu] = useState<BlankCanvasMenuState | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);
  const { visibleNodes, visibleEdges } = useMemo(
    () => getVisibleCanvasGraph(nodes, edges, shots, collapsedSceneIds),
    [nodes, edges, shots, collapsedSceneIds],
  );

  const selectedNode = visibleNodes.find(node => node.id === selectedNodeId);
  const selectedShot = selectedNode?.refId
    ? shots.find(shot => shot.id === selectedNode.refId)
    : undefined;
  const selectedScene = selectedNode?.refId
    ? scenes.find(scene => scene.id === selectedNode.refId)
    : undefined;
  const searchResults = useMemo(
    () => searchCanvasNodes(searchQuery, visibleNodes, scenes, shots),
    [searchQuery, visibleNodes, scenes, shots],
  );
  const miniMapLayout = useMemo(
    () => calculateMiniMapLayout(visibleNodes, MINI_MAP_SIZE),
    [visibleNodes],
  );
  const nodeGroups = useMemo(
    () => buildCanvasNodeGroups({ nodes: visibleNodes, scenes, shots }),
    [visibleNodes, scenes, shots],
  );

  const handleZoomIn = () => {
    setCanvas(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }));
  };

  const handleZoomOut = () => {
    setCanvas(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.5) }));
  };

  const handleResetView = () => {
    setCanvas({ scale: 1, offsetX: 0, offsetY: 0 });
  };

  const handleFitView = () => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCanvas(calculateFitView(visibleNodes, { width: rect.width, height: rect.height }));
  };

  const handleFocusNode = (node: CanvasNode) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    onSelectedNodeIdChange(node.id);
    setSelectedNodeIds([node.id]);
    setCanvas(calculateFocusedView(node, { width: rect.width, height: rect.height }, canvas.scale));
    setSearchQuery('');
  };

  const applyNodePositions = (positionsByNodeId: Record<string, CanvasPoint>) => {
    Object.entries(positionsByNodeId).forEach(([nodeId, position]) => {
      moveCanvasNodeLocally(nodeId, position);
    });

    void Promise.all(
      Object.entries(positionsByNodeId).map(([nodeId, position]) => (
        updateCanvasNode(nodeId, { position })
      )),
    );
  };

  const handleAlignNodes = (direction: CanvasAlignDirection) => {
    applyNodePositions(calculateAlignedNodePositions(visibleNodes, selectedNodeIds, direction));
  };

  const handleDistributeNodes = (direction: CanvasDistributeDirection) => {
    applyNodePositions(calculateDistributedNodePositions(visibleNodes, selectedNodeIds, direction));
  };

  const handleToggleSceneCollapse = (sceneId: string, nodeId: string) => {
    setCollapsedSceneIds(prev => (
      prev.includes(sceneId)
        ? prev.filter(id => id !== sceneId)
        : [...prev, sceneId]
    ));
    onSelectedNodeIdChange(nodeId);
    setSelectedNodeIds([nodeId]);
  };

  const handleCreateBlankNode = async (nodeType: BlankCanvasNodeType) => {
    if (!blankMenu) return;
    const node = await createCanvasNode(
      projectId,
      createBlankCanvasNodeInput(nodeType, blankMenu.canvasPoint),
    );
    setBlankMenu(null);
    onSelectedNodeIdChange(node.id);
    setSelectedNodeIds([node.id]);
  };

  const handleDeleteSelectedNodes = async () => {
    const nodeIdsToDelete = selectedNodeIds.filter(nodeId => (
      visibleNodes.some(node => node.id === nodeId)
    ));
    if (nodeIdsToDelete.length === 0) return;

    await Promise.all(nodeIdsToDelete.map(nodeId => deleteCanvasNode(nodeId)));
    setSelectedNodeIds([]);
    onSelectedNodeIdChange(null);
  };

  const handleMiniMapClick = (
    event: React.MouseEvent<SVGSVGElement>,
    layout: MiniMapLayout,
  ) => {
    event.preventDefault();
    event.stopPropagation();

    const rect = event.currentTarget.getBoundingClientRect();
    const miniX = event.clientX - rect.left;
    const miniY = event.clientY - rect.top;
    const worldX = (miniX - layout.offsetX) / layout.scale + layout.bounds.minX;
    const worldY = (miniY - layout.offsetY) / layout.scale + layout.bounds.minY;

    setCanvas(calculateCenteredView(
      { x: worldX, y: worldY },
      viewportSize,
      canvas.scale,
    ));
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (event.key === '+' || event.key === '=') {
        event.preventDefault();
        handleZoomIn();
      } else if (event.key === '-' || event.key === '_') {
        event.preventDefault();
        handleZoomOut();
      } else if (event.key === '0') {
        event.preventDefault();
        handleResetView();
      } else if (event.key.toLowerCase() === 'f') {
        event.preventDefault();
        handleFitView();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleNodes]);

  useEffect(() => {
    const syncViewportSize = () => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      setViewportSize({ width: rect.width, height: rect.height });
    };

    syncViewportSize();
    window.addEventListener('resize', syncViewportSize);
    return () => window.removeEventListener('resize', syncViewportSize);
  }, []);

  const handleMouseDown = (e: React.MouseEvent, nodeId?: string) => {
    if (e.button !== 0) {
      return;
    }

    setBlankMenu(null);

    if (connectingFromNodeId) {
      return;
    }

    if (nodeId) {
      const node = visibleNodes.find(canvasNode => canvasNode.id === nodeId);
      if (node) {
        setDraggedNode(nodeId);
        onSelectedNodeIdChange(nodeId);
        const nextSelectedNodeIds = selectedNodeIds.includes(nodeId)
          ? selectedNodeIds
          : [nodeId];
        setSelectedNodeIds(nextSelectedNodeIds);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasX = (e.clientX - rect.left - canvas.offsetX) / canvas.scale;
          const canvasY = (e.clientY - rect.top - canvas.offsetY) / canvas.scale;
          const dragPoint = { x: canvasX, y: canvasY };
          setDragOffset({
            x: canvasX - node.position.x,
            y: canvasY - node.position.y,
          });
          setDragStartPoint(dragPoint);
          setDragStartNodes(visibleNodes.filter(canvasNode => nextSelectedNodeIds.includes(canvasNode.id)));
        }
      }
    } else {
      if (e.shiftKey) {
        const selectionPoint = getCanvasPoint(e);
        setSelectionStart(selectionPoint);
        setSelectionCurrent(selectionPoint);
        setIsPanning(false);
        onSelectedNodeIdChange(null);
        setSelectedNodeIds([]);
        return;
      }

      // Start panning canvas
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvas.offsetX, y: e.clientY - canvas.offsetY });
      onSelectedNodeIdChange(null);
      setSelectedNodeIds([]);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (connectingFromNodeId) {
      setConnectionPointer(getCanvasPoint(e));
    } else if (selectionStart) {
      setSelectionCurrent(getCanvasPoint(e));
    } else if (draggedNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasX = (e.clientX - rect.left - canvas.offsetX) / canvas.scale;
        const canvasY = (e.clientY - rect.top - canvas.offsetY) / canvas.scale;
        if (dragStartPoint && dragStartNodes.length > 1) {
          const movedPositions = applyNodeSelectionDelta(dragStartNodes, selectedNodeIds, {
            x: canvasX - dragStartPoint.x,
            y: canvasY - dragStartPoint.y,
          });
          Object.entries(movedPositions).forEach(([nodeId, position]) => {
            moveCanvasNodeLocally(nodeId, position);
          });
        } else {
          moveCanvasNodeLocally(draggedNode, {
            x: canvasX - dragOffset.x,
            y: canvasY - dragOffset.y,
          });
        }
      }
    } else if (isPanning) {
      // Pan canvas
      setCanvas(prev => ({
        ...prev,
        offsetX: e.clientX - panStart.x,
        offsetY: e.clientY - panStart.y,
      }));
    }
  };

  const handleMouseUp = () => {
    if (connectingFromNodeId) {
      setConnectingFromNodeId(null);
      setConnectionPointer(null);
      return;
    }

    if (selectionStart && selectionCurrent) {
      const selectionRect = normalizeSelectionRect(selectionStart, selectionCurrent);
      const selectedIds = getCanvasNodesInSelection(visibleNodes, selectionRect);
      setSelectedNodeIds(selectedIds);
      onSelectedNodeIdChange(selectedIds[0] ?? null);
      setSelectionStart(null);
      setSelectionCurrent(null);
      return;
    }

    if (draggedNode) {
      const nodeIdsToPersist = dragStartNodes.length > 1
        ? selectedNodeIds
        : [draggedNode];
      void Promise.all(
        nodeIdsToPersist.map((nodeId) => {
          const node = visibleNodes.find(canvasNode => canvasNode.id === nodeId);
          return node ? updateCanvasNode(nodeId, { position: node.position }) : Promise.resolve();
        }),
      );
    }
    setIsPanning(false);
    setDraggedNode(null);
    setDragStartPoint(null);
    setDragStartNodes([]);
  };

  const handleConnectionStart = (e: React.MouseEvent, nodeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const node = visibleNodes.find(canvasNode => canvasNode.id === nodeId);
    if (!node) return;
    onSelectedNodeIdChange(nodeId);
    setSelectedNodeIds([nodeId]);
    setConnectingFromNodeId(nodeId);
    setConnectionPointer({
      x: node.position.x + node.size.width,
      y: node.position.y + node.size.height / 2,
    });
  };

  const handleConnectionEnd = async (e: React.MouseEvent, targetNodeId: string) => {
    if (!connectingFromNodeId) return;
    e.preventDefault();
    e.stopPropagation();

    const sourceNodeId = connectingFromNodeId;
    setConnectingFromNodeId(null);
    setConnectionPointer(null);
    if (sourceNodeId === targetNodeId) return;

    await createCanvasEdge(projectId, {
      sourceNodeId,
      targetNodeId,
      relationType: 'story_flow',
      data: {},
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setCanvas(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(2, prev.scale + delta)),
    }));
  };

  const handleCanvasContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setBlankMenu({
      screenX: e.clientX,
      screenY: e.clientY,
      canvasPoint: getCanvasPoint(e),
    });
    onSelectedNodeIdChange(null);
    setSelectedNodeIds([]);
  };

  const getCanvasPoint = (e: React.MouseEvent) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) {
      return { x: 0, y: 0 };
    }

    return {
      x: (e.clientX - rect.left - canvas.offsetX) / canvas.scale,
      y: (e.clientY - rect.top - canvas.offsetY) / canvas.scale,
    };
  };

  const connectionSource = connectingFromNodeId
    ? visibleNodes.find(node => node.id === connectingFromNodeId)
    : undefined;
  const draftConnectionPath = connectionSource && connectionPointer
    ? buildEdgePath(
      connectionSource.position.x + connectionSource.size.width,
      connectionSource.position.y + connectionSource.size.height / 2,
      connectionPointer.x,
      connectionPointer.y,
    )
    : null;
  const activeSelectionRect = selectionStart && selectionCurrent
    ? normalizeSelectionRect(selectionStart, selectionCurrent)
    : null;

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Toolbar */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {nodes.length} 个画布节点
            {visibleNodes.length !== nodes.length ? ` · 显示 ${visibleNodes.length} 个` : ''}
            {selectedNodeIds.length > 1 ? ` · 已选 ${selectedNodeIds.length} 个` : ''}
          </span>
          <div className="relative w-80">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索场景、镜头号、角色、提示词"
              className="h-8 pl-8"
            />
            {searchQuery.trim() && (
              <div className="absolute left-0 top-10 z-20 max-h-72 w-full overflow-auto rounded-md border bg-background shadow-lg">
                {searchResults.length > 0 ? (
                  searchResults.map(result => (
                    <button
                      key={result.node.id}
                      type="button"
                      onClick={() => handleFocusNode(result.node)}
                      className="block w-full px-3 py-2 text-left hover:bg-muted"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">{result.title}</span>
                        <Badge variant="outline" className="shrink-0 text-xs">
                          {getCanvasNodePresentation(result.node.nodeType).label}
                        </Badge>
                      </div>
                      <div className="mt-0.5 truncate text-xs text-muted-foreground">
                        {result.description || '无匹配描述'}
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="px-3 py-2 text-sm text-muted-foreground">未找到匹配节点</div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedNodeIds.length > 1 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAlignNodes('left')}
                title="左对齐选中节点"
              >
                左对齐
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleAlignNodes('top')}
                title="顶部对齐选中节点"
              >
                上对齐
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeleteSelectedNodes}
                title="删除选中节点"
              >
                删除选中
              </Button>
            </>
          )}
          {selectedNodeIds.length > 2 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDistributeNodes('horizontal')}
                title="水平分布选中节点"
              >
                水平分布
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDistributeNodes('vertical')}
                title="垂直分布选中节点"
              >
                垂直分布
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowNodeGroups(prev => !prev)}
            title="显示或隐藏场景/角色分组"
          >
            {showNodeGroups ? '隐藏分组' : '显示分组'}
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-12 text-center">
            {Math.round(canvas.scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleFitView} title="适应全部节点 (F)">
            <Maximize2 className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView} title="重置视图 (0)">
            <RotateCcw className="size-4" />
          </Button>
        </div>
        {miniMapLayout && viewportSize.width > 0 && viewportSize.height > 0 && (
          <CanvasMiniMap
            nodes={visibleNodes}
            selectedNodeId={selectedNodeId}
            canvas={canvas}
            viewportSize={viewportSize}
            layout={miniMapLayout}
            onClick={handleMiniMapClick}
          />
        )}
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleCanvasContextMenu}
        onWheel={handleWheel}
      >
        <div
          style={{
            transform: `translate(${canvas.offsetX}px, ${canvas.offsetY}px) scale(${canvas.scale})`,
            transformOrigin: '0 0',
          }}
          className="absolute inset-0"
        >
          {/* Grid background and edges */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            style={{ width: '5000px', height: '5000px' }}
          >
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path
                  d="M 40 0 L 0 0 0 40"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="0.5"
                  className="text-muted-foreground/20"
                />
              </pattern>
              <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
                <path d="M0,0 L0,6 L9,3 z" className="fill-muted-foreground/40" />
              </marker>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            {visibleEdges.map((edge) => {
              const source = visibleNodes.find(node => node.id === edge.sourceNodeId);
              const target = visibleNodes.find(node => node.id === edge.targetNodeId);
              if (!source || !target) return null;

              const sourceX = source.position.x + source.size.width;
              const sourceY = source.position.y + source.size.height / 2;
              const targetX = target.position.x;
              const targetY = target.position.y + target.size.height / 2;
              const pathData = buildEdgePath(sourceX, sourceY, targetX, targetY);
              const presentation = getCanvasEdgePresentation(edge.relationType);

              return (
                <path
                  key={edge.id}
                  d={pathData}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray={presentation.strokeDasharray}
                  markerEnd="url(#arrow)"
                  className={presentation.className}
                />
              );
            })}
            {draftConnectionPath && (
              <path
                d={draftConnectionPath}
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeDasharray="6 6"
                className="text-primary/70"
              />
            )}
          </svg>

          {showNodeGroups && nodeGroups.map(group => (
            <CanvasNodeGroupFrame key={group.id} group={group} />
          ))}

          {/* Canvas nodes */}
          {visibleNodes.map((node) => {
            const scene = node.refId ? scenes.find(item => item.id === node.refId) : undefined;
            const shot = node.refId ? shots.find(item => item.id === node.refId) : undefined;
            const isSceneCollapsed = Boolean(scene && collapsedSceneIds.includes(scene.id));
            const collapsedShotCount = scene
              ? shots.filter(item => item.sceneId === scene.id).length
              : 0;

            return (
              <div
                key={node.id}
                style={{
                  position: 'absolute',
                  left: node.position.x,
                  top: node.position.y,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, node.id);
                }}
                onMouseUp={(e) => {
                  void handleConnectionEnd(e, node.id);
                }}
                onContextMenu={(event) => {
                  event.stopPropagation();
                  onSelectedNodeIdChange(node.id);
                  setSelectedNodeIds([node.id]);
                }}
                className="cursor-move"
              >
                <CanvasNodeCard
                  node={node}
                  isSelected={selectedNodeId === node.id || selectedNodeIds.includes(node.id)}
                  scene={scene}
                  shot={shot}
                  isSceneCollapsed={isSceneCollapsed}
                  collapsedShotCount={collapsedShotCount}
                  onToggleSceneCollapse={handleToggleSceneCollapse}
                  onConnectionStart={handleConnectionStart}
                  onMenuAction={onNodeContextMenuAction}
                />
              </div>
            );
          })}
          {activeSelectionRect && (
            <div
              className="pointer-events-none absolute rounded border border-primary bg-primary/10"
              style={{
                left: activeSelectionRect.x,
                top: activeSelectionRect.y,
                width: activeSelectionRect.width,
                height: activeSelectionRect.height,
              }}
            />
          )}
        </div>
        {blankMenu && (
          <div
            className="fixed z-50 w-44 rounded-md border bg-background p-1 shadow-lg"
            style={{ left: blankMenu.screenX, top: blankMenu.screenY }}
            onMouseDown={(event) => event.stopPropagation()}
            onContextMenu={(event) => event.preventDefault()}
          >
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => void handleCreateBlankNode('prompt')}
            >
              新增提示词节点
            </button>
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => void handleCreateBlankNode('image_result')}
            >
              新增图片结果节点
            </button>
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => void handleCreateBlankNode('video_result')}
            >
              新增视频结果节点
            </button>
            <button
              type="button"
              className="block w-full rounded px-2 py-1.5 text-left text-sm hover:bg-muted"
              onClick={() => void handleCreateBlankNode('export')}
            >
              新增导出节点
            </button>
          </div>
        )}
      </div>

      {/* Selected node info */}
      {selectedNode && (
        <div className="border-t bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">
                {getSelectedNodeTitle(selectedNode, selectedScene, selectedShot)}
              </div>
              <div className="text-sm text-muted-foreground mt-1">
                {getSelectedNodeDescription(selectedNode, selectedScene, selectedShot)}
              </div>
            </div>
            <Badge>{getCanvasNodePresentation(selectedNode.nodeType).label}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

function CanvasNodeGroupFrame({ group }: { group: CanvasNodeGroup }) {
  const isCharacterGroup = group.kind === 'character';

  return (
    <div
      className={[
        'pointer-events-none absolute rounded-2xl border border-dashed bg-background/25',
        isCharacterGroup ? 'border-purple-400/70' : 'border-blue-400/70',
      ].join(' ')}
      style={{
        left: group.bounds.x,
        top: group.bounds.y,
        width: group.bounds.width,
        height: group.bounds.height,
      }}
    >
      <div
        className={[
          'absolute -top-6 left-3 rounded-full border bg-background/95 px-2 py-0.5 text-xs font-medium shadow-sm',
          isCharacterGroup ? 'border-purple-300 text-purple-700' : 'border-blue-300 text-blue-700',
        ].join(' ')}
      >
        {group.label}
      </div>
    </div>
  );
}

function CanvasMiniMap({
  nodes,
  selectedNodeId,
  canvas,
  viewportSize,
  layout,
  onClick,
}: {
  nodes: CanvasNode[];
  selectedNodeId: string | null;
  canvas: CanvasState;
  viewportSize: { width: number; height: number };
  layout: MiniMapLayout;
  onClick: (event: React.MouseEvent<SVGSVGElement>, layout: MiniMapLayout) => void;
}) {
  const viewWorldRect = {
    x: -canvas.offsetX / canvas.scale,
    y: -canvas.offsetY / canvas.scale,
    width: viewportSize.width / canvas.scale,
    height: viewportSize.height / canvas.scale,
  };
  const viewMiniRect = {
    x: (viewWorldRect.x - layout.bounds.minX) * layout.scale + layout.offsetX,
    y: (viewWorldRect.y - layout.bounds.minY) * layout.scale + layout.offsetY,
    width: viewWorldRect.width * layout.scale,
    height: viewWorldRect.height * layout.scale,
  };

  return (
    <div
      className="absolute bottom-4 right-4 z-10 rounded-lg border bg-background/95 p-2 shadow-lg backdrop-blur"
      onMouseDown={(event) => event.stopPropagation()}
      onMouseMove={(event) => event.stopPropagation()}
      onMouseUp={(event) => event.stopPropagation()}
      onWheel={(event) => event.stopPropagation()}
    >
      <div className="mb-1 flex items-center justify-between text-[10px] text-muted-foreground">
        <span>小地图</span>
        <span>{nodes.length} 节点</span>
      </div>
      <svg
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className="block cursor-crosshair rounded bg-muted/40"
        onClick={(event) => onClick(event, layout)}
      >
        <rect
          x="0"
          y="0"
          width={layout.width}
          height={layout.height}
          fill="transparent"
        />
        {nodes.map(node => {
          const x = (node.position.x - layout.bounds.minX) * layout.scale + layout.offsetX;
          const y = (node.position.y - layout.bounds.minY) * layout.scale + layout.offsetY;
          const width = Math.max(node.size.width * layout.scale, 3);
          const height = Math.max(node.size.height * layout.scale, 3);
          const isSelected = node.id === selectedNodeId;

          return (
            <rect
              key={node.id}
              x={x}
              y={y}
              width={width}
              height={height}
              rx="2"
              className={isSelected ? 'fill-primary' : 'fill-muted-foreground/50'}
            />
          );
        })}
        <rect
          x={viewMiniRect.x}
          y={viewMiniRect.y}
          width={viewMiniRect.width}
          height={viewMiniRect.height}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-primary"
        />
      </svg>
    </div>
  );
}

function CanvasNodeCard({
  node,
  isSelected,
  scene,
  shot,
  isSceneCollapsed,
  collapsedShotCount,
  onToggleSceneCollapse,
  onConnectionStart,
  onMenuAction,
}: {
  node: CanvasNode;
  isSelected: boolean;
  scene?: Scene;
  shot?: Shot;
  isSceneCollapsed: boolean;
  collapsedShotCount: number;
  onToggleSceneCollapse: (sceneId: string, nodeId: string) => void;
  onConnectionStart: (e: React.MouseEvent, nodeId: string) => void;
  onMenuAction: (action: CanvasNodeContextMenuAction, node: CanvasNode) => void;
}) {
  const presentation = getCanvasNodePresentation(node.nodeType);
  const title = getSelectedNodeTitle(node, scene, shot);
  const description = getSelectedNodeDescription(node, scene, shot);
  const menuItems = getCanvasNodeContextMenuItems(node);
  const generationActions = getCanvasNodeGenerationActions(node, shot);

  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>
        <Card
          className={`relative border-l-4 p-3 pr-8 shadow-md hover:shadow-lg transition-shadow ${
            presentation.accentClassName
          } ${isSelected ? 'ring-2 ring-primary' : ''}`}
          style={{ width: node.size.width }}
        >
          <button
            type="button"
            title="拖拽创建连线"
            aria-label="拖拽创建连线"
            onMouseDown={(e) => onConnectionStart(e, node.id)}
            className="absolute -right-3 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-full border bg-background text-muted-foreground shadow-sm hover:border-primary hover:text-primary"
          >
            <Link2 className="size-3" />
          </button>
          {scene && (
            <button
              type="button"
              title={isSceneCollapsed ? '展开场景镜头' : '折叠场景镜头'}
              aria-label={isSceneCollapsed ? '展开场景镜头' : '折叠场景镜头'}
              onMouseDown={(event) => {
                event.preventDefault();
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onToggleSceneCollapse(scene.id, node.id);
              }}
              className="absolute right-2 top-2 flex items-center gap-1 rounded border bg-background px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm hover:border-primary hover:text-primary"
            >
              {isSceneCollapsed ? (
                <ChevronRight className="size-3" />
              ) : (
                <ChevronDown className="size-3" />
              )}
              {collapsedShotCount}
            </button>
          )}
          <div className="flex items-start justify-between mb-2">
            <Badge variant="outline" className={`text-xs ${presentation.badgeClassName}`}>
              {presentation.label}
            </Badge>
            <NodeStatusIcons node={node} shot={shot} />
          </div>
          <div className="text-sm font-medium line-clamp-2 mb-1">{title}</div>
          <div className="text-xs text-muted-foreground line-clamp-3">{description}</div>
          {shot?.imageUrl && (
            <div className="mt-2 rounded overflow-hidden">
              <img
                src={shot.imageUrl}
                alt={shot.description}
                className="w-full h-24 object-cover"
              />
            </div>
          )}
          {generationActions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {generationActions.map(action => (
                <Button
                  key={action.action}
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 px-2 text-xs"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                  }}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onMenuAction(action.action, node);
                  }}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          )}
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {menuItems.map((item) => (
          item.action === 'delete_node' ? (
            <div key={item.action}>
              <ContextMenuSeparator />
              <ContextMenuItem
                disabled={item.disabled}
                variant="destructive"
                onSelect={() => onMenuAction(item.action, node)}
              >
                {item.label}
              </ContextMenuItem>
            </div>
          ) : (
            <ContextMenuItem
              key={item.action}
              disabled={item.disabled}
              onSelect={() => onMenuAction(item.action, node)}
            >
              {item.label}
            </ContextMenuItem>
          )
        ))}
      </ContextMenuContent>
    </ContextMenu>
  );
}

function NodeStatusIcons({ node, shot }: { node: CanvasNode; shot?: Shot }) {
  if (node.nodeType === 'script') {
    return <FileText className="size-3 text-violet-600" />;
  }
  if (node.nodeType === 'scene') {
    return <MapPin className="size-3 text-amber-600" />;
  }
  return (
    <div className="flex gap-1">
      {shot?.imageUrl && <Image className="size-3 text-green-600" />}
      {shot?.videoUrl && <Video className="size-3 text-blue-600" />}
    </div>
  );
}

function getSelectedNodeTitle(
  node: CanvasNode,
  scene?: Scene,
  shot?: Shot,
): string {
  if (node.nodeType === 'scene' && scene) {
    return `场景 ${scene.sceneNumber}: ${scene.description}`;
  }
  if (node.nodeType === 'shot' && shot) {
    return `镜头 ${shot.shotNumber}: ${shot.description}`;
  }
  if (node.nodeType === 'prompt' && shot) {
    return node.title || `镜头 ${shot.shotNumber} 提示词`;
  }
  return node.title || getCanvasNodePresentation(node.nodeType).label;
}

function getSelectedNodeDescription(
  node: CanvasNode,
  scene?: Scene,
  shot?: Shot,
): string {
  if (node.nodeType === 'scene' && scene) {
    return [scene.location, scene.timeOfDay, scene.characters.join('、')]
      .filter(Boolean)
      .join(' · ');
  }
  if (node.nodeType === 'shot' && shot) {
    return `${shot.shotType} · ${shot.duration}s · ${shot.prompt}`;
  }
  if (node.nodeType === 'prompt' && shot) {
    return shot.prompt || String(node.data.prompt || '未设置提示词');
  }
  return '项目剧本入口，后续可联动角色、场景和镜头节点。';
}

function buildEdgePath(sourceX: number, sourceY: number, targetX: number, targetY: number): string {
  const controlOffset = Math.max(80, Math.abs(targetX - sourceX) / 2);
  return [
    `M ${sourceX} ${sourceY}`,
    `C ${sourceX + controlOffset} ${sourceY},`,
    `${targetX - controlOffset} ${targetY},`,
    `${targetX} ${targetY}`,
  ].join(' ');
}
