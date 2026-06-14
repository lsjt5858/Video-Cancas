export type VideoCameraMotion = 'auto' | 'static' | 'pan' | 'tracking' | 'dolly';
export type VideoFrameMode = 'none' | 'current_image' | 'uploaded_reference';
export type VideoReferenceMode = 'none' | 'style' | 'motion';

export type VideoGenerationParams = {
  duration: number;
  cameraMotion: VideoCameraMotion;
  firstFrameMode: VideoFrameMode;
  lastFrameMode: VideoFrameMode;
  referenceVideoMode: VideoReferenceMode;
  motionPrompt: string;
};

export const VIDEO_DURATION_OPTIONS: Array<{ value: number; label: string }> = [
  { value: 3, label: '3 秒' },
  { value: 5, label: '5 秒' },
  { value: 8, label: '8 秒' },
  { value: 12, label: '12 秒' },
];

export const VIDEO_CAMERA_MOTION_OPTIONS: Array<{ value: VideoCameraMotion; label: string }> = [
  { value: 'auto', label: '自动匹配' },
  { value: 'static', label: '固定镜头' },
  { value: 'pan', label: '摇摄' },
  { value: 'tracking', label: '跟拍' },
  { value: 'dolly', label: '推拉' },
];

export const VIDEO_FRAME_MODE_OPTIONS: Array<{ value: VideoFrameMode; label: string }> = [
  { value: 'none', label: '不指定' },
  { value: 'current_image', label: '当前镜头图片' },
  { value: 'uploaded_reference', label: '上传参考帧' },
];

export const VIDEO_REFERENCE_MODE_OPTIONS: Array<{ value: VideoReferenceMode; label: string }> = [
  { value: 'none', label: '不使用参考视频' },
  { value: 'style', label: '风格参考' },
  { value: 'motion', label: '动作参考' },
];

export function createDefaultVideoGenerationParams(): VideoGenerationParams {
  return {
    duration: 5,
    cameraMotion: 'auto',
    firstFrameMode: 'current_image',
    lastFrameMode: 'none',
    referenceVideoMode: 'none',
    motionPrompt: '',
  };
}

export function normalizeVideoGenerationParams(
  params: VideoGenerationParams,
): VideoGenerationParams {
  return {
    ...params,
    motionPrompt: params.motionPrompt.trim(),
  };
}
