import { Background, Controls, Handle, Position, ReactFlow } from "@xyflow/react";
import type { Edge, Node, NodeProps, NodeTypes } from "@xyflow/react";
import "@xyflow/react/dist/style.css";

type CanvasNodeData = {
  label: string;
  description: string;
};

type CanvasFlowNode = Node<CanvasNodeData, "canvasNode">;

const nodes: CanvasFlowNode[] = [
  {
    id: "script-1",
    type: "canvasNode",
    position: { x: 20, y: 80 },
    data: { label: "剧本节点", description: "父亲寻找儿子的短剧文本" },
  },
  {
    id: "shot-1",
    type: "canvasNode",
    position: { x: 330, y: 30 },
    data: { label: "镜头 S001", description: "父亲推着红色老摩托冲出院门" },
  },
  {
    id: "image-1",
    type: "canvasNode",
    position: { x: 650, y: 30 },
    data: { label: "图片候选", description: "首帧生成结果占位" },
  },
  {
    id: "video-1",
    type: "canvasNode",
    position: { x: 650, y: 220 },
    data: { label: "视频镜头", description: "图生视频结果占位" },
  },
];

const edges: Edge[] = [
  { id: "e1", source: "script-1", target: "shot-1" },
  { id: "e2", source: "shot-1", target: "image-1" },
  { id: "e3", source: "image-1", target: "video-1" },
];

function CanvasNode({ data }: NodeProps<CanvasFlowNode>) {
  return (
    <div className="w-56 rounded border border-zinc-700 bg-zinc-950 p-3 shadow-xl shadow-black/20">
      <Handle type="target" position={Position.Left} />
      <div className="text-sm font-medium text-zinc-100">{data.label}</div>
      <p className="mt-2 text-xs leading-5 text-zinc-400">{data.description}</p>
      <Handle type="source" position={Position.Right} />
    </div>
  );
}

const nodeTypes = {
  canvasNode: CanvasNode,
} satisfies NodeTypes;

export function CanvasPreview() {
  return (
    <section className="h-[560px] overflow-hidden rounded border border-zinc-800 bg-zinc-900">
      <ReactFlow
        colorMode="dark"
        edges={edges}
        fitView
        nodes={nodes}
        nodeTypes={nodeTypes}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
        <Controls />
      </ReactFlow>
    </section>
  );
}
