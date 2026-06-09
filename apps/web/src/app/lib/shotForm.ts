import { Shot } from '../types';

export type ShotForm = {
  shotNumber: string;
  description: string;
  shotType: Shot['shotType'];
  cameraMovement: Shot['cameraMovement'];
  duration: string;
  dialogue: string;
  prompt: string;
};

export type ShotFormParseResult =
  | { ok: true; updates: Partial<Shot> }
  | { ok: false; error: string };

export function buildShotForm(shot: Shot): ShotForm {
  return {
    shotNumber: String(shot.shotNumber),
    description: shot.description,
    shotType: shot.shotType,
    cameraMovement: shot.cameraMovement,
    duration: String(shot.duration),
    dialogue: shot.dialogue || '',
    prompt: shot.prompt,
  };
}

export function parseShotForm(form: ShotForm): ShotFormParseResult {
  const shotNumber = Number.parseInt(form.shotNumber, 10);
  if (Number.isNaN(shotNumber) || shotNumber < 1) {
    return { ok: false, error: '镜头编号必须是大于 0 的整数' };
  }

  const duration = Number.parseFloat(form.duration);
  if (Number.isNaN(duration) || duration <= 0) {
    return { ok: false, error: '时长必须是大于 0 的数字' };
  }

  return {
    ok: true,
    updates: {
      shotNumber,
      description: form.description.trim(),
      shotType: form.shotType,
      cameraMovement: form.cameraMovement,
      duration,
      dialogue: form.dialogue.trim(),
      prompt: form.prompt.trim(),
    },
  };
}
