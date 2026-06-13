# Canvas Edge Presentation Design

## Goal

Make canvas relation types visually distinguishable so users can scan story flow, generation flow, and asset references without opening node details.

## Scope

- Add a pure edge presentation helper.
- Provide labels, colors, and optional dash patterns for known relation types.
- Style existing SVG paths based on `edge.relationType`.
- Keep unknown relation types visible with a neutral fallback style.

## Relation Styles

| Relation | Label | Style |
| --- | --- | --- |
| `story_flow` | 剧情流 | neutral solid line |
| `generates` | 生成 | emerald dashed line |
| `uses_asset` | 资产引用 | purple dotted line |
| `selected_for_timeline` | 时间线选择 | orange mixed dash line |

## Out Of Scope

- Edge labels rendered on the canvas.
- Relation editing UI.
- Timeline selection business flow.
- Per-edge hover details.

## Testing

Unit tests cover all known relation styles and the unknown relation fallback. The full web test suite and production build verify integration with `CanvasView`.
