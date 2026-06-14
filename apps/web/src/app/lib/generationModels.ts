export type GenerationModelType = 'image' | 'video';

export type GenerationModel = {
  id: string;
  type: GenerationModelType;
  label: string;
  description: string;
};

export const GENERATION_MODELS: GenerationModel[] = [
  {
    id: 'image-fast',
    type: 'image',
    label: '快速生图',
    description: '适合快速预览构图和视觉方向。',
  },
  {
    id: 'image-quality',
    type: 'image',
    label: '质量生图',
    description: '适合最终候选图，优先画面质量。',
  },
  {
    id: 'image-character',
    type: 'image',
    label: '角色一致性',
    description: '适合强调人物外观连续性的镜头。',
  },
  {
    id: 'image-scene',
    type: 'image',
    label: '场景一致性',
    description: '适合强调空间、光线和环境一致性的镜头。',
  },
  {
    id: 'video-fast',
    type: 'video',
    label: '快速生视频',
    description: '适合快速检查动作节奏和镜头衔接。',
  },
  {
    id: 'video-quality',
    type: 'video',
    label: '质量生视频',
    description: '适合最终候选视频，优先稳定性和画质。',
  },
  {
    id: 'video-motion',
    type: 'video',
    label: '运动增强',
    description: '适合运镜、动作幅度和动态表现更强的镜头。',
  },
];

export function getGenerationModelsByType(type: GenerationModelType): GenerationModel[] {
  return GENERATION_MODELS.filter(model => model.type === type);
}

export function getDefaultGenerationModel(type: GenerationModelType): GenerationModel {
  return getGenerationModelsByType(type)[0];
}

export function getGenerationModelById(id: string): GenerationModel | undefined {
  return GENERATION_MODELS.find(model => model.id === id);
}
