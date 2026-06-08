import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Textarea } from './ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Badge } from './ui/badge';
import { Image, Video, Pencil, Trash2, Sparkles } from 'lucide-react';
import { Shot } from '../types';
import { toast } from 'sonner';

interface ShotListProps {
  projectId: string;
}

export default function ShotList({ projectId }: ShotListProps) {
  const { getShotsByProject, updateShot, deleteShot, createTask, createAsset } = useApp();
  const shots = getShotsByProject(projectId);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Shot>>({});

  const handleEdit = (shot: Shot) => {
    setSelectedShot(shot);
    setEditForm(shot);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    if (selectedShot && editForm) {
      try {
        await updateShot(selectedShot.id, editForm);
        toast.success('分镜已更新');
        setIsEditDialogOpen(false);
      } catch (error) {
        toast.error('更新分镜失败');
      }
    }
  };

  const handleDelete = async (shotId: string) => {
    if (confirm('确定要删除这个分镜吗？')) {
      try {
        await deleteShot(shotId);
        toast.success('分镜已删除');
      } catch (error) {
        toast.error('删除分镜失败');
      }
    }
  };

  const handleGenerateImage = async (shot: Shot) => {
    const task = createTask({
      projectId,
      shotId: shot.id,
      type: 'image',
      status: 'processing',
      prompt: shot.prompt,
    });

    toast.loading('正在生成图片...', { id: task.id });

    // Simulate image generation
    setTimeout(() => {
      const mockImageUrl = `https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800&h=600&fit=crop&q=80`;
      
      // Create asset
      const asset = createAsset({
        projectId,
        shotId: shot.id,
        type: 'image',
        url: mockImageUrl,
        thumbnailUrl: mockImageUrl,
        metadata: {
          width: 800,
          height: 600,
          prompt: shot.prompt,
          generatedAt: Date.now(),
        },
      });

      // Update shot with image
      void updateShot(shot.id, { imageUrl: asset.url })
        .then(() => toast.success('图片生成成功', { id: task.id }))
        .catch(() => toast.error('图片回写失败', { id: task.id }));
    }, 2000);
  };

  const handleGenerateVideo = async (shot: Shot) => {
    if (!shot.imageUrl) {
      toast.error('请先生成图片作为首帧');
      return;
    }

    const task = createTask({
      projectId,
      shotId: shot.id,
      type: 'video',
      status: 'processing',
      prompt: shot.prompt,
    });

    toast.loading('正在生成视频...', { id: task.id });

    // Simulate video generation
    setTimeout(() => {
      const mockVideoUrl = `https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4`;
      
      // Create asset
      const asset = createAsset({
        projectId,
        shotId: shot.id,
        type: 'video',
        url: mockVideoUrl,
        thumbnailUrl: shot.imageUrl,
        metadata: {
          width: 1280,
          height: 720,
          duration: shot.duration,
          prompt: shot.prompt,
          generatedAt: Date.now(),
        },
      });

      // Update shot with video
      void updateShot(shot.id, { videoUrl: asset.url })
        .then(() => toast.success('视频生成成功', { id: task.id }))
        .catch(() => toast.error('视频回写失败', { id: task.id }));
    }, 3000);
  };

  const getShotTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'wide': '远景',
      'medium': '中景',
      'close-up': '特写',
      'extreme-close-up': '大特写',
      'over-shoulder': '过肩',
      'pov': '主观视角',
      'other': '其他',
    };
    return labels[type] || type;
  };

  const getCameraMovementLabel = (movement: string) => {
    const labels: Record<string, string> = {
      'static': '固定',
      'pan': '横摇',
      'tilt': '竖摇',
      'zoom': '推拉',
      'tracking': '跟踪',
      'dolly': '移动',
      'other': '其他',
    };
    return labels[movement] || movement;
  };

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="font-semibold mb-2">分镜列表</h2>
          <p className="text-sm text-muted-foreground">
            管理和编辑项目中的所有分镜，生成图片和视频素材
          </p>
        </div>

        {shots.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Sparkles className="size-12 text-gray-400" />
              </div>
              <h3 className="font-semibold mb-2">还没有分镜</h3>
              <p className="text-muted-foreground max-w-sm">
                在"剧本"标签页中输入剧本，使用 AI 自动生成分镜
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">镜号</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>景别</TableHead>
                  <TableHead>运镜</TableHead>
                  <TableHead>时长</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {shots.map((shot) => (
                  <TableRow key={shot.id}>
                    <TableCell className="font-medium">#{shot.shotNumber}</TableCell>
                    <TableCell>
                      <div className="max-w-xs">
                        <div className="font-medium line-clamp-1">{shot.description}</div>
                        <div className="text-xs text-muted-foreground line-clamp-1 mt-1">
                          {shot.prompt}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getShotTypeLabel(shot.shotType)}</TableCell>
                    <TableCell>{getCameraMovementLabel(shot.cameraMovement)}</TableCell>
                    <TableCell>{shot.duration}s</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {shot.imageUrl && (
                          <Badge variant="secondary" className="text-xs">
                            <Image className="mr-1 size-3" />
                            图片
                          </Badge>
                        )}
                        {shot.videoUrl && (
                          <Badge variant="secondary" className="text-xs">
                            <Video className="mr-1 size-3" />
                            视频
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateImage(shot)}
                        >
                          <Image className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleGenerateVideo(shot)}
                          disabled={!shot.imageUrl}
                        >
                          <Video className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(shot)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(shot.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>编辑分镜 #{selectedShot?.shotNumber}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>描述</Label>
              <Input
                value={editForm.description || ''}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>景别</Label>
                <Select
                  value={editForm.shotType}
                  onValueChange={(value) => setEditForm({ ...editForm, shotType: value as Shot['shotType'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="wide">远景</SelectItem>
                    <SelectItem value="medium">中景</SelectItem>
                    <SelectItem value="close-up">特写</SelectItem>
                    <SelectItem value="extreme-close-up">大特写</SelectItem>
                    <SelectItem value="over-shoulder">过肩</SelectItem>
                    <SelectItem value="pov">主观视角</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>运镜</Label>
                <Select
                  value={editForm.cameraMovement}
                  onValueChange={(value) => setEditForm({ ...editForm, cameraMovement: value as Shot['cameraMovement'] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="static">固定</SelectItem>
                    <SelectItem value="pan">横摇</SelectItem>
                    <SelectItem value="tilt">竖摇</SelectItem>
                    <SelectItem value="zoom">推拉</SelectItem>
                    <SelectItem value="tracking">跟踪</SelectItem>
                    <SelectItem value="dolly">移动</SelectItem>
                    <SelectItem value="other">其他</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>时长（秒）</Label>
              <Input
                type="number"
                min="1"
                value={editForm.duration || 3}
                onChange={(e) => setEditForm({ ...editForm, duration: parseInt(e.target.value) || 3 })}
              />
            </div>
            <div className="grid gap-2">
              <Label>提示词</Label>
              <Textarea
                value={editForm.prompt || ''}
                onChange={(e) => setEditForm({ ...editForm, prompt: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid gap-2">
              <Label>对白（可选）</Label>
              <Textarea
                value={editForm.dialogue || ''}
                onChange={(e) => setEditForm({ ...editForm, dialogue: e.target.value })}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit}>
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
