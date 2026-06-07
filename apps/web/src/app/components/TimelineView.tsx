import { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';
import { Film, Download, FileJson, FileVideo, Package } from 'lucide-react';
import { toast } from 'sonner';

interface TimelineViewProps {
  projectId: string;
}

export default function TimelineView({ projectId }: TimelineViewProps) {
  const { getShotsByProject, getTimeline, updateTimeline, getAssetsByProject } = useApp();
  const shots = getShotsByProject(projectId);
  const timeline = getTimeline(projectId);
  const assets = getAssetsByProject(projectId);
  const [isGenerating, setIsGenerating] = useState(false);

  // Auto-generate timeline from shots
  useEffect(() => {
    if (shots.length > 0 && !timeline) {
      generateTimeline();
    }
  }, [shots, timeline]);

  const generateTimeline = () => {
    const clips = shots
      .filter(shot => shot.videoUrl)
      .map((shot, index) => {
        const previousClips = shots.slice(0, index).filter(s => s.videoUrl);
        const startTime = previousClips.reduce((sum, s) => sum + s.duration, 0);
        
        return {
          id: `clip-${shot.id}`,
          shotId: shot.id,
          assetId: `asset-${shot.id}`,
          startTime,
          duration: shot.duration,
          track: 0,
        };
      });

    updateTimeline(projectId, { clips });
  };

  const handleRegenerateTimeline = () => {
    generateTimeline();
    toast.success('时间线已更新');
  };

  const handleExportJSON = () => {
    const exportData = {
      project: projectId,
      shots: shots.map(shot => ({
        shotNumber: shot.shotNumber,
        description: shot.description,
        duration: shot.duration,
        videoUrl: shot.videoUrl,
        imageUrl: shot.imageUrl,
      })),
      timeline: timeline?.clips || [],
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `timeline-${projectId}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('时间线数据已导出');
  };

  const handleExportAssets = async () => {
    setIsGenerating(true);
    
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('素材包导出完成');
    setIsGenerating(false);
  };

  const handleExportVideo = async () => {
    setIsGenerating(true);
    
    // Simulate video rendering
    await new Promise(resolve => setTimeout(resolve, 3000));

    toast.success('视频导出完成');
    setIsGenerating(false);
  };

  const totalDuration = shots.reduce((sum, shot) => sum + shot.duration, 0);
  const completedShots = shots.filter(s => s.videoUrl).length;
  const completionRate = shots.length > 0 ? (completedShots / shots.length) * 100 : 0;

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="font-semibold mb-2">时间线与导出</h2>
            <p className="text-sm text-muted-foreground">
              按分镜顺序生成时间线，导出素材包和视频
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{shots.length}</div>
                <p className="text-xs text-muted-foreground mt-1">总镜头数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{completedShots}</div>
                <p className="text-xs text-muted-foreground mt-1">已生成视频</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{totalDuration}s</div>
                <p className="text-xs text-muted-foreground mt-1">总时长</p>
              </CardContent>
            </Card>
          </div>

          {/* Completion Progress */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">制作进度</span>
                <span className="text-sm text-muted-foreground">
                  {completedShots} / {shots.length} 镜头
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <p className="text-xs text-muted-foreground mt-2">
                {completionRate === 100 
                  ? '所有镜头已完成，可以导出视频'
                  : '继续在"分镜"页面生成剩余镜头的视频'}
              </p>
            </CardContent>
          </Card>

          {/* Timeline Preview */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">时间线预览</h3>
              
              {shots.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  还没有分镜数据
                </div>
              ) : (
                <div className="space-y-2">
                  {shots.map((shot, index) => {
                    const startTime = shots.slice(0, index).reduce((sum, s) => sum + s.duration, 0);
                    return (
                      <div
                        key={shot.id}
                        className="flex items-center gap-3 p-3 rounded-lg border bg-card"
                      >
                        <div className="flex-shrink-0 w-12 text-center">
                          <div className="text-sm font-medium">#{shot.shotNumber}</div>
                        </div>
                        <div className="flex-shrink-0">
                          {shot.imageUrl ? (
                            <img
                              src={shot.imageUrl}
                              alt={shot.description}
                              className="w-20 h-12 object-cover rounded"
                            />
                          ) : (
                            <div className="w-20 h-12 bg-muted rounded flex items-center justify-center">
                              <Film className="size-4 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-sm line-clamp-1">
                            {shot.description}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(startTime)} - {formatTime(startTime + shot.duration)} ({shot.duration}s)
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          {shot.videoUrl ? (
                            <div className="text-xs text-green-600 font-medium">已完成</div>
                          ) : (
                            <div className="text-xs text-muted-foreground">待生成</div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {shots.length > 0 && (
                <div className="mt-4">
                  <Button variant="outline" onClick={handleRegenerateTimeline}>
                    重新生成时间线
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Export Options */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4">导出选项</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2"
                  onClick={handleExportJSON}
                >
                  <FileJson className="size-5" />
                  <div className="text-left">
                    <div className="font-medium">时间线数据</div>
                    <div className="text-xs text-muted-foreground">
                      导出 JSON 格式
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2"
                  onClick={handleExportAssets}
                  disabled={isGenerating}
                >
                  <Package className="size-5" />
                  <div className="text-left">
                    <div className="font-medium">素材包</div>
                    <div className="text-xs text-muted-foreground">
                      打包所有素材文件
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="h-auto flex-col items-start p-4 gap-2"
                  onClick={handleExportVideo}
                  disabled={isGenerating || completionRate < 100}
                >
                  <FileVideo className="size-5" />
                  <div className="text-left">
                    <div className="font-medium">合成视频</div>
                    <div className="text-xs text-muted-foreground">
                      导出 MP4 格式
                    </div>
                  </div>
                </Button>
              </div>

              {completionRate < 100 && (
                <p className="text-xs text-muted-foreground mt-4">
                  提示：需要完成所有镜头的视频生成后才能导出合成视频
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
