import { Shot } from '../types';

export type CanvasResultSelectionType = 'image' | 'video';

export type CanvasResultSelectionButtonState = {
  label: string;
  disabled: boolean;
};

export function getCanvasResultSelectionUpdate(
  type: CanvasResultSelectionType,
  url: string,
): Partial<Shot> {
  return type === 'image'
    ? { imageUrl: url }
    : { videoUrl: url };
}

export function getCanvasResultSelectionButtonState(
  type: CanvasResultSelectionType,
  isSelected: boolean,
): CanvasResultSelectionButtonState {
  if (type === 'image') {
    return {
      label: isSelected ? '当前主图' : '设为主图',
      disabled: isSelected,
    };
  }

  return {
    label: isSelected ? '当前视频' : '设为当前视频',
    disabled: isSelected,
  };
}
