import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Image, Video, Download, ExternalLink, Trash2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from './ui/dialog';
import { Asset } from '../types';
import { CANVAS_ASSET_MIME_TYPE, createCanvasAssetDragData } from '../lib/canvasAssetDrop';

interface AssetLibraryProps {
  projectId: string;
}

export default function AssetLibrary({ projectId }: AssetLibraryProps) {
  const { getAssetsByProject, deleteAsset, getShotsByProject } = useApp();
  const assets = getAssetsByProject(projectId);
  const shots = getShotsByProject(projectId);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const images = assets.filter(a => a.type === 'image');
  const videos = assets.filter(a => a.type === 'video');

  const handleViewDetails = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDetailDialogOpen(true);
  };

  const handleDelete = (assetId: string) => {
    if (confirm('确定要删除这个素材吗？')) {
      deleteAsset(assetId);
    }
  };

  const handleDragStart = (event: React.DragEvent, asset: Asset) => {
    event.dataTransfer.effectAllowed = 'copy';
    event.dataTransfer.setData(
      CANVAS_ASSET_MIME_TYPE,
      JSON.stringify(createCanvasAssetDragData(asset)),
    );
    event.dataTransfer.setData('text/plain', asset.url);
  };

  const getShotInfo = (shotId?: string) => {
    if (!shotId) return null;
    return shots.find(s => s.id === shotId);
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN');
  };

  const AssetGrid = ({ assets }: { assets: Asset[] }) => (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {assets.map((asset) => {
        const shot = getShotInfo(asset.shotId);
        return (
          <Card
            key={asset.id}
            draggable
            onDragStart={(event) => handleDragStart(event, asset)}
            className="overflow-hidden group cursor-grab active:cursor-grabbing"
            title="拖拽到画布中创建资产节点"
          >
            <div className="relative aspect-video bg-muted">
              {asset.type === 'image' ? (
                <img
                  src={asset.url}
                  alt="Asset"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="relative w-full h-full">
                  {asset.thumbnailUrl && (
                    <img
                      src={asset.thumbnailUrl}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="rounded-full bg-black/50 p-3">
                      <Video className="size-6 text-white" />
                    </div>
                  </div>
                </div>
              )}
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="flex gap-1">
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8"
                    onClick={() => handleViewDetails(asset)}
                  >
                    <Info className="size-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="secondary"
                    className="size-8"
                    onClick={() => handleDelete(asset.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
            <CardContent className="p-3">
              <div className="mb-1 flex items-center justify-between gap-2">
                <Badge variant="outline" className="text-[10px]">
                  {asset.type === 'image' ? '图片' : '视频'}
                </Badge>
                <span className="text-[10px] text-muted-foreground">可拖入画布</span>
              </div>
              <div className="text-xs text-muted-foreground line-clamp-1">
                {shot ? `镜头 ${shot.shotNumber}` : '未关联镜头'}
              </div>
              {asset.metadata.width && asset.metadata.height && (
                <div className="text-xs text-muted-foreground mt-1">
                  {asset.metadata.width} × {asset.metadata.height}
                </div>
              )}
              {asset.metadata.duration && (
                <div className="text-xs text-muted-foreground mt-1">
                  时长: {asset.metadata.duration}s
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 overflow-auto p-6">
        <div className="mb-6">
          <h2 className="font-semibold mb-2">素材库</h2>
          <p className="text-sm text-muted-foreground">
            管理项目中生成的所有图片和视频素材
          </p>
        </div>

        <Tabs defaultValue="all" className="w-full">
          <TabsList>
            <TabsTrigger value="all">
              全部 ({assets.length})
            </TabsTrigger>
            <TabsTrigger value="images">
              <Image className="mr-2 size-4" />
              图片 ({images.length})
            </TabsTrigger>
            <TabsTrigger value="videos">
              <Video className="mr-2 size-4" />
              视频 ({videos.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            {assets.length === 0 ? (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <div className="rounded-full bg-gray-100 p-6 mb-4">
                    <Image className="size-12 text-gray-400" />
                  </div>
                  <h3 className="font-semibold mb-2">还没有素材</h3>
                  <p className="text-muted-foreground max-w-sm">
                    在"分镜"标签页中生成图片和视频素材
                  </p>
                </CardContent>
              </Card>
            ) : (
              <AssetGrid assets={assets} />
            )}
          </TabsContent>

          <TabsContent value="images" className="mt-6">
            {images.length === 0 ? (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground">还没有图片素材</p>
                </CardContent>
              </Card>
            ) : (
              <AssetGrid assets={images} />
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-6">
            {videos.length === 0 ? (
              <Card className="py-16">
                <CardContent className="flex flex-col items-center justify-center text-center">
                  <p className="text-muted-foreground">还没有视频素材</p>
                </CardContent>
              </Card>
            ) : (
              <AssetGrid assets={videos} />
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Asset Detail Dialog */}
      {selectedAsset && (
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>素材详情</DialogTitle>
              <DialogDescription>
                {selectedAsset.type === 'image' ? '图片' : '视频'}素材
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="aspect-video bg-muted rounded-lg overflow-hidden">
                {selectedAsset.type === 'image' ? (
                  <img
                    src={selectedAsset.url}
                    alt="Asset"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    src={selectedAsset.url}
                    controls
                    className="w-full h-full"
                  />
                )}
              </div>
              <div className="grid gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">类型：</span>
                  <Badge variant="outline" className="ml-2">
                    {selectedAsset.type === 'image' ? '图片' : '视频'}
                  </Badge>
                </div>
                {selectedAsset.metadata.width && selectedAsset.metadata.height && (
                  <div>
                    <span className="text-muted-foreground">尺寸：</span>
                    <span className="ml-2">
                      {selectedAsset.metadata.width} × {selectedAsset.metadata.height}
                    </span>
                  </div>
                )}
                {selectedAsset.metadata.duration && (
                  <div>
                    <span className="text-muted-foreground">时长：</span>
                    <span className="ml-2">{selectedAsset.metadata.duration} 秒</span>
                  </div>
                )}
                {selectedAsset.metadata.prompt && (
                  <div>
                    <span className="text-muted-foreground">提示词：</span>
                    <p className="mt-1 text-xs bg-muted p-2 rounded">
                      {selectedAsset.metadata.prompt}
                    </p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">创建时间：</span>
                  <span className="ml-2">{formatDate(selectedAsset.createdAt)}</span>
                </div>
                {selectedAsset.shotId && (
                  <div>
                    <span className="text-muted-foreground">关联镜头：</span>
                    <span className="ml-2">
                      镜头 {getShotInfo(selectedAsset.shotId)?.shotNumber}
                    </span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <a href={selectedAsset.url} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="mr-2 size-4" />
                    在新窗口打开
                  </a>
                </Button>
                <Button variant="outline" className="flex-1" asChild>
                  <a href={selectedAsset.url} download>
                    <Download className="mr-2 size-4" />
                    下载
                  </a>
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
