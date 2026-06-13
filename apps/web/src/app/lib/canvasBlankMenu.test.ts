import { describe, expect, it } from 'vitest';
import { createBlankCanvasNodeInput } from './canvasBlankMenu';

describe('canvas blank menu', () => {
  it('builds default canvas node input for blank-area creation', () => {
    expect(createBlankCanvasNodeInput('prompt', { x: 320, y: 180 })).toEqual({
      nodeType: 'prompt',
      title: '新提示词',
      position: { x: 320, y: 180 },
      size: { width: 240, height: 160 },
      data: {
        source: 'blank_menu',
      },
    });
  });
});
