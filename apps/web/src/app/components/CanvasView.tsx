import { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { ZoomIn, ZoomOut, Maximize2, Image, Video } from 'lucide-react';
import { Shot } from '../types';

interface CanvasViewProps {
  projectId: string;
}

interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

export default function CanvasView({ projectId }: CanvasViewProps) {
  const { getShotsByProject, updateShot } = useApp();
  const shots = getShotsByProject(projectId);
  const [selectedShotId, setSelectedShotId] = useState<string | null>(null);
  const [canvas, setCanvas] = useState<CanvasState>({ scale: 1, offsetX: 0, offsetY: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggedShot, setDraggedShot] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const selectedShot = shots.find(s => s.id === selectedShotId);

  // Initialize shot positions if not set
  useEffect(() => {
    shots.forEach((shot, index) => {
      if (!shot.position) {
        updateShot(shot.id, {
          position: {
            x: 100 + (index % 5) * 250,
            y: 100 + Math.floor(index / 5) * 200,
          },
        });
      }
    });
  }, [shots, updateShot]);

  const handleZoomIn = () => {
    setCanvas(prev => ({ ...prev, scale: Math.min(prev.scale + 0.1, 2) }));
  };

  const handleZoomOut = () => {
    setCanvas(prev => ({ ...prev, scale: Math.max(prev.scale - 0.1, 0.5) }));
  };

  const handleResetView = () => {
    setCanvas({ scale: 1, offsetX: 0, offsetY: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent, shotId?: string) => {
    if (shotId) {
      // Start dragging shot
      const shot = shots.find(s => s.id === shotId);
      if (shot?.position) {
        setDraggedShot(shotId);
        setSelectedShotId(shotId);
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          const canvasX = (e.clientX - rect.left - canvas.offsetX) / canvas.scale;
          const canvasY = (e.clientY - rect.top - canvas.offsetY) / canvas.scale;
          setDragOffset({
            x: canvasX - shot.position.x,
            y: canvasY - shot.position.y,
          });
        }
      }
    } else {
      // Start panning canvas
      setIsPanning(true);
      setPanStart({ x: e.clientX - canvas.offsetX, y: e.clientY - canvas.offsetY });
      setSelectedShotId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (draggedShot) {
      // Drag shot
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const canvasX = (e.clientX - rect.left - canvas.offsetX) / canvas.scale;
        const canvasY = (e.clientY - rect.top - canvas.offsetY) / canvas.scale;
        updateShot(draggedShot, {
          position: {
            x: canvasX - dragOffset.x,
            y: canvasY - dragOffset.y,
          },
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
    setIsPanning(false);
    setDraggedShot(null);
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
            {shots.length} 个镜头节点
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
          {/* Grid background */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ width: '5000px', height: '5000px' }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground/20" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Shot nodes */}
          {shots.map((shot) => (
            shot.position && (
              <div
                key={shot.id}
                style={{
                  position: 'absolute',
                  left: shot.position.x,
                  top: shot.position.y,
                }}
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, shot.id);
                }}
                className="cursor-move"
              >
                <Card
                  className={`w-[200px] p-3 shadow-md hover:shadow-lg transition-shadow ${
                    selectedShotId === shot.id ? 'ring-2 ring-primary' : ''
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant="outline" className="text-xs">
                      镜头 {shot.shotNumber}
                    </Badge>
                    <div className="flex gap-1">
                      {shot.imageUrl && <Image className="size-3 text-green-600" />}
                      {shot.videoUrl && <Video className="size-3 text-blue-600" />}
                    </div>
                  </div>
                  <div className="text-sm font-medium line-clamp-2 mb-1">
                    {shot.description}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {shot.shotType} · {shot.duration}s
                  </div>
                  {shot.imageUrl && (
                    <div className="mt-2 rounded overflow-hidden">
                      <img
                        src={shot.imageUrl}
                        alt={shot.description}
                        className="w-full h-24 object-cover"
                      />
                    </div>
                  )}
                </Card>
              </div>
            )
          ))}
        </div>
      </div>

      {/* Selected shot info */}
      {selectedShot && (
        <div className="border-t bg-background px-4 py-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">镜头 {selectedShot.shotNumber}: {selectedShot.description}</div>
              <div className="text-sm text-muted-foreground mt-1">{selectedShot.prompt}</div>
            </div>
            <Badge>{selectedShot.shotType}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}
