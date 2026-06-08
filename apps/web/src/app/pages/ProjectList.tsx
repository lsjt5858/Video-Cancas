import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Plus, Film, Trash2, Clock } from 'lucide-react';
import { Project } from '../types';
import { toast } from 'sonner';

export default function ProjectList() {
  const navigate = useNavigate();
  const { projects, isLoadingProjects, createProject, deleteProject } = useApp();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    type: 'short-drama' as Project['type'],
    aspectRatio: '16:9' as Project['aspectRatio'],
    targetDuration: 60,
    script: '',
  });

  const handleCreateProject = async () => {
    if (!newProject.name.trim()) return;

    setIsSubmitting(true);
    try {
      const project = await createProject(newProject);
      setIsCreateDialogOpen(false);
      setNewProject({
        name: '',
        type: 'short-drama',
        aspectRatio: '16:9',
        targetDuration: 60,
        script: '',
      });
      navigate(`/project/${project.id}`);
    } catch (error) {
      toast.error('创建项目失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (confirm('确定要删除这个项目吗？此操作无法撤销。')) {
      try {
        await deleteProject(projectId);
        toast.success('项目已删除');
      } catch (error) {
        toast.error('删除项目失败');
      }
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getProjectTypeLabel = (type: Project['type']) => {
    const labels = {
      'short-drama': '短剧',
      'vlog': 'Vlog',
      'commercial': '商业广告',
      'other': '其他',
    };
    return labels[type];
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-bold mb-2">导演画布</h1>
            <p className="text-muted-foreground">AI 视频创作结构化生产工具</p>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 size-4" />
                创建项目
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>创建新项目</DialogTitle>
                <DialogDescription>
                  开始你的 AI 视频创作之旅
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">项目名称</Label>
                  <Input
                    id="name"
                    placeholder="例如：春节短剧第一集"
                    value={newProject.name}
                    onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="type">项目类型</Label>
                  <Select
                    value={newProject.type}
                    onValueChange={(value) => setNewProject({ ...newProject, type: value as Project['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short-drama">短剧</SelectItem>
                      <SelectItem value="vlog">Vlog</SelectItem>
                      <SelectItem value="commercial">商业广告</SelectItem>
                      <SelectItem value="other">其他</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="aspectRatio">画幅比例</Label>
                  <Select
                    value={newProject.aspectRatio}
                    onValueChange={(value) => setNewProject({ ...newProject, aspectRatio: value as Project['aspectRatio'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16:9">16:9 横屏</SelectItem>
                      <SelectItem value="9:16">9:16 竖屏</SelectItem>
                      <SelectItem value="1:1">1:1 方形</SelectItem>
                      <SelectItem value="4:3">4:3 传统</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="duration">目标时长（秒）</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    value={newProject.targetDuration}
                    onChange={(e) => setNewProject({ ...newProject, targetDuration: parseInt(e.target.value) || 60 })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleCreateProject} disabled={!newProject.name.trim() || isSubmitting}>
                  {isSubmitting ? '创建中...' : '创建项目'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingProjects ? (
          <Card className="py-16">
            <CardContent className="text-center text-muted-foreground">
              正在加载项目...
            </CardContent>
          </Card>
        ) : projects.length === 0 ? (
          <Card className="py-16">
            <CardContent className="flex flex-col items-center justify-center text-center">
              <div className="rounded-full bg-gray-100 p-6 mb-4">
                <Film className="size-12 text-gray-400" />
              </div>
              <h3 className="font-semibold mb-2">还没有项目</h3>
              <p className="text-muted-foreground mb-6 max-w-sm">
                创建你的第一个项目，开始从剧本到视频的完整创作流程
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 size-4" />
                创建第一个项目
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <Card
                key={project.id}
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(`/project/${project.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="line-clamp-1">{project.name}</CardTitle>
                      <CardDescription className="mt-1">
                        {getProjectTypeLabel(project.type)} · {project.aspectRatio}
                      </CardDescription>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={(e) => handleDeleteProject(e, project.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="size-3" />
                      <span>{project.targetDuration}s</span>
                    </div>
                    <div>创建于 {formatDate(project.createdAt)}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
