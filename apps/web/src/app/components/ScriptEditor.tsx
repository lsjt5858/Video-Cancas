import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Wand2, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ScriptEditorProps {
  projectId: string;
}

export default function ScriptEditor({ projectId }: ScriptEditorProps) {
  const { getProject, updateProject, getShotsByProject, createScene, createShot } = useApp();
  const project = getProject(projectId);
  const shots = getShotsByProject(projectId);
  const [script, setScript] = useState(project?.script || '');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSave = () => {
    if (project) {
      updateProject(project.id, { script });
      toast.success('剧本已保存');
    }
  };

  const handleGenerateShots = async () => {
    if (!script.trim()) {
      toast.error('请先输入剧本内容');
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    try {
      // Save script first
      if (project) {
        updateProject(project.id, { script });
      }

      // Mock AI-generated scene breakdown
      const mockScene = createScene({
        projectId,
        sceneNumber: 1,
        description: '开场场景',
        location: '城市街道',
        timeOfDay: '白天',
        characters: ['主角'],
      });

      // Generate mock shots
      const mockShots = [
        {
          shotNumber: 1,
          description: '城市全景，建筑林立',
          shotType: 'wide' as const,
          cameraMovement: 'static' as const,
          duration: 3,
          prompt: 'Wide shot of modern city skyline, bright daylight, cinematic',
        },
        {
          shotNumber: 2,
          description: '主角走在街道上',
          shotType: 'medium' as const,
          cameraMovement: 'tracking' as const,
          duration: 5,
          prompt: 'Medium shot of person walking on city street, following camera movement',
        },
        {
          shotNumber: 3,
          description: '主角特写，表情坚定',
          shotType: 'close-up' as const,
          cameraMovement: 'static' as const,
          duration: 4,
          prompt: 'Close-up portrait of determined person, cinematic lighting',
        },
      ];

      mockShots.forEach((shot, index) => {
        createShot({
          projectId,
          sceneId: mockScene.id,
          ...shot,
          position: { x: 100 + index * 200, y: 100 },
        });
      });

      toast.success(`已生成 ${mockShots.length} 个分镜`);
    } catch (error) {
      toast.error('生成分镜失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const exampleScript = `场景一：城市清晨

阳光洒在摩天大楼的玻璃幕墙上，城市渐渐苏醒。

李明（28岁，程序员）背着双肩包，行色匆匆地走在人流中。他抬头看了看手表，加快了脚步。

李明（独白）："又是平凡的一天开始了..."

突然，一个神秘的手机通知打断了他的思绪。`;

  return (
    <div className="h-full flex">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h2 className="font-semibold mb-2">剧本编辑</h2>
            <p className="text-sm text-muted-foreground">
              输入或粘贴你的剧本，AI 将帮助你自动拆分场景和生成分镜
            </p>
          </div>

          <Card className="mb-4">
            <CardContent className="pt-6">
              <Textarea
                value={script}
                onChange={(e) => setScript(e.target.value)}
                placeholder={exampleScript}
                className="min-h-[400px] font-mono text-sm"
              />
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button onClick={handleSave} variant="outline">
              <FileText className="mr-2 size-4" />
              保存剧本
            </Button>
            <Button 
              onClick={handleGenerateShots}
              disabled={isGenerating || !script.trim()}
            >
              <Wand2 className="mr-2 size-4" />
              {isGenerating ? 'AI 分析中...' : 'AI 生成分镜'}
            </Button>
          </div>
        </div>
      </div>

      <div className="w-80 border-l bg-muted/20 p-6 overflow-auto">
        <h3 className="font-semibold mb-4">剧本信息</h3>
        
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">字数统计</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{script.length}</div>
              <p className="text-xs text-muted-foreground mt-1">字符</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">已生成分镜</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{shots.length}</div>
              <p className="text-xs text-muted-foreground mt-1">个镜头</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">使用提示</CardTitle>
              <CardDescription className="text-xs">
                如何编写好的剧本
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• 使用场景标题分隔不同场景</p>
              <p>• 描述角色动作和表情</p>
              <p>• 包含关键对白和旁白</p>
              <p>• 注明时间地点和氛围</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
