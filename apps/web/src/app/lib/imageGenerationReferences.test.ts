import { describe, expect, it } from 'vitest';
import { CanvasNode } from '../types';
import { createDefaultImageGenerationParams } from './imageGenerationParams';
import {
  createImageGenerationParamsForReferenceMode,
  getImageReferenceCandidates,
  toggleImageReferenceNode,
} from './imageGenerationReferences';

function makeNode(
  id: string,
  nodeType: CanvasNode['nodeType'],
  data: CanvasNode['data'] = {},
): CanvasNode {
  return {
    id,
    projectId: 'project-1',
    nodeType,
    title: id,
    position: { x: 0, y: 0 },
    size: { width: 220, height: 160 },
    data,
  };
}

describe('image generation references', () => {
  it('returns candidates that match the selected reference mode', () => {
    const nodes = [
      makeNode('character-1', 'character', { character_name: '林小满' }),
      makeNode('location-1', 'location', { location_name: '天台' }),
      makeNode('scene-1', 'scene'),
      makeNode('prop-1', 'prop', { prop_name: '旧相机' }),
      makeNode('shot-1', 'shot'),
    ];

    expect(getImageReferenceCandidates(nodes, 'character').map(item => item.nodeId)).toEqual([
      'character-1',
    ]);
    expect(getImageReferenceCandidates(nodes, 'scene').map(item => item.nodeId)).toEqual([
      'location-1',
      'scene-1',
    ]);
    expect(getImageReferenceCandidates(nodes, 'prop').map(item => item.nodeId)).toEqual([
      'prop-1',
    ]);
    expect(getImageReferenceCandidates(nodes, 'none')).toEqual([]);
  });

  it('clears invalid reference node ids when reference mode changes', () => {
    const params = {
      ...createDefaultImageGenerationParams(),
      referenceMode: 'character' as const,
      referenceNodeIds: ['character-1', 'prop-1'],
    };
    const nodes = [
      makeNode('character-1', 'character'),
      makeNode('prop-1', 'prop'),
    ];

    expect(createImageGenerationParamsForReferenceMode(params, 'prop', nodes)).toMatchObject({
      referenceMode: 'prop',
      referenceNodeIds: ['prop-1'],
    });
    expect(createImageGenerationParamsForReferenceMode(params, 'none', nodes)).toMatchObject({
      referenceMode: 'none',
      referenceNodeIds: [],
    });
  });

  it('toggles selected reference node ids without duplicates', () => {
    const params = {
      ...createDefaultImageGenerationParams(),
      referenceMode: 'character' as const,
      referenceNodeIds: ['character-1'],
    };

    expect(toggleImageReferenceNode(params, 'character-2').referenceNodeIds).toEqual([
      'character-1',
      'character-2',
    ]);
    expect(toggleImageReferenceNode(params, 'character-1').referenceNodeIds).toEqual([]);
  });
});
