import { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ZoomIn, ZoomOut, Maximize2, Image, Video, FileText, MapPin } from 'lucide-react';
import { getCanvasNodePresentation } from '../lib/canvasNodePresentation';
import { CanvasNode, Scene, Shot } from '../types';

interface CanvasViewProps {
  projectId: string;
}

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export default function CanvasView({ projectId }: CanvasViewProps) {
  const {
    getCanvasNodesByProject,
    getCanvasEdgesByProject,
    getScenesByProject,
    getShotsByProject,
    moveCanvasNodeLocally,
    updateCanvasNode,
  } = useApp();
  const scenes = getScenesByProject(projectId);
  const shots = getShotsByProject(projectId);
  const nodes = getCanvasNodesByProject(projectId);
  const edges = getCanvasEdgesByProject(projectId);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<CanvasState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedNode, setDraggedNode] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedNode = nodes.find(node => node.id === selectedNodeId);
  const selectedShot = selectedNode?.refId
    ? shots.find(shot => shot.id === selectedNode.refId)
    : undefined;
  const selectedScene = selectedNode?.refId
    ? scenes.find(scene => scene.id === selectedNode.refId)
    : undefined;

  const handleZoomIn = () => {
    setCanvas(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }));
  };

  const handleZoomOut = () => {
    setCanvas(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.5) }));
  };

  const handleResetView = () => {
    setCanvas({ scale: 1, offsetX: 0, offsetY: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent, nodeId?: string) => {
    if (nodeId) {
      const node = nodes.find(canvasNode => canvasNode.id === nodeId);
      if (node) {
        setDraggedNode(nodeId);
        setSelectedNodeId(nodeId);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasX = (e.clientX - rect.left - canvas.offsetX) / canvas.scale;
          const canvasY = (e.clientY - rect.top - canvas.offsetY) / canvas.scale;
          setDragOffset({
            x: canvasX - node.position.x,
            y: canvasY - node.position.y,
          });
        }
      }
    } else {
      // Start panning canvas
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvas.offsetX, y: e.clientY - canvas.offsetY });
      setSelectedNodeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedNode) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasX = (e.clientX - rect.left - canvas.offsetX) / canvas.scale;
        const canvasY = (e.clientY - rect.top - canvas.offsetY) / canvas.scale;
        moveCanvasNodeLocally(draggedNode, {
          x: canvasX - dragOffset.x,
          y: canvasY - dragOffset.y,
        });
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
    if (draggedNode) {
      const node = nodes.find(canvasNode => canvasNode.id === draggedNode);
      if (node) {
        void updateCanvasNode(draggedNode, { position: node.position });
      }
    }
    setIsPanning(false);
    setDraggedNode(null);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setCanvas(prev => ({
      ...prev,
      scale: Math.max(0.5, Math.min(2, prev.scale + delta)),
    }));
  };

  return (
    <div className="h-full flex flex-col bg-muted/20">
      {/* Toolbar */}
      <div className="border-b bg-background px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {nodes.length} 个画布节点
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <ZoomOut className="size-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-12 text-center">
            {Math.round(canvas.scale * 100)}%
          </span>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <ZoomIn className="size-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            <Maximize2 className="size-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={canvasRef}
        className="flex-1 overflow-hidden relative cursor-grab active:cursor-grabbing"
        onMouseDown={(e) => handleMouseDown(e)}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
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
            {edges.map((edge) => {
              const source = nodes.find(node => node.id === edge.sourceNodeId);
              const target = nodes.find(node => node.id === edge.targetNodeId);
              if (!source || !target) return null;

              const sourceX = source.position.x + source.size.width;
              const sourceY = source.position.y + source.size.height / 2;
              const targetX = target.position.x;
              const targetY = target.position.y + target.size.height / 2;
              const controlOffset = Math.max(80, Math.abs(targetX - sourceX) / 2);
              const pathData = [
                `M ${sourceX} ${sourceY}`,
                `C ${sourceX + controlOffset} ${sourceY},`,
                `${targetX - controlOffset} ${targetY},`,
                `${targetX} ${targetY}`,
              ].join(' ');

              return (
                <path
                  key={edge.id}
                  d={pathData}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  markerEnd="url(#arrow)"
                  className="text-muted-foreground/40"
                />
              );
            })}
          </svg>

          {/* Canvas nodes */}
          {nodes.map((node) => {
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
                className="cursor-move"
              >
                <CanvasNodeCard
                  node={node}
                  isSelected={selectedNodeId === node.id}
                  scene={node.refId ? scenes.find(item => item.id === node.refId) : undefined}
                  shot={node.refId ? shots.find(item => item.id === node.refId) : undefined}
                />
              </div>
            );
          })}
        </div>
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

function CanvasNodeCard({
  node,
  isSelected,
  scene,
  shot,
}: {
  node: CanvasNode;
  isSelected: boolean;
  scene?: Scene;
  shot?: Shot;
}) {
  const presentation = getCanvasNodePresentation(node.nodeType);
  const title = getSelectedNodeTitle(node, scene, shot);
  const description = getSelectedNodeDescription(node, scene, shot);

  return (
    <Card
      className={`border-l-4 p-3 shadow-md hover:shadow-lg transition-shadow ${
        presentation.accentClassName
      } ${isSelected ? 'ring-2 ring-primary' : ''}`}
      style={{ width: node.size.width }}
    >
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
    </Card>
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
  return '项目剧本入口，后续可联动角色、场景和镜头节点。';
}
