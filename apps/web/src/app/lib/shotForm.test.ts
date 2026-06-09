import { describe, expect, it } from 'vitest';
import { buildShotForm, parseShotForm } from './shotForm';
import { Shot } from '../types';

const shot: Shot = {
  id: 'shot-1',
  projectId: 'project-1',
  sceneId: 'scene-1',
  shotNumber: 2,
  description: '孩子穿过人群',
  shotType: 'wide',
  cameraMovement: 'tracking',
  duration: 4,
  dialogue: '妈妈，我回来了。',
  prompt: 'A child walks through the crowd at an old station',
};

describe('shot form', () => {
  it('builds form state from a shot', () => {
    expect(buildShotForm(shot)).toEqual({
      shotNumber: '2',
      description: '孩子穿过人群',
      shotType: 'wide',
      cameraMovement: 'tracking',
      duration: '4',
      dialogue: '妈妈，我回来了。',
      prompt: 'A child walks through the crowd at an old station',
    });
  });

  it('parses valid form state into shot updates', () => {
    expect(parseShotForm({
      shotNumber: '3',
      description: '  孩子回头  ',
      shotType: 'medium',
      cameraMovement: 'pan',
      duration: '5.5',
      dialogue: '  我在这里。  ',
      prompt: '  Medium shot of a child looking back  ',
    })).toEqual({
      ok: true,
      updates: {
        shotNumber: 3,
        description: '孩子回头',
        shotType: 'medium',
        cameraMovement: 'pan',
        duration: 5.5,
        dialogue: '我在这里。',
        prompt: 'Medium shot of a child looking back',
      },
    });
  });

  it('rejects invalid shot number and duration', () => {
    expect(parseShotForm({
      shotNumber: '0',
      description: '孩子回头',
      shotType: 'medium',
      cameraMovement: 'pan',
      duration: '-1',
      dialogue: '',
      prompt: 'Medium shot',
    })).toEqual({
      ok: false,
      error: '镜头编号必须是大于 0 的整数',
    });

    expect(parseShotForm({
      shotNumber: '1',
      description: '孩子回头',
      shotType: 'medium',
      cameraMovement: 'pan',
      duration: '0',
      dialogue: '',
      prompt: 'Medium shot',
    })).toEqual({
      ok: false,
      error: '时长必须是大于 0 的数字',
    });
  });
});
