import { create } from "zustand";

type CanvasState = {
  selectedNodeId: string | null;
  setSelectedNodeId: (nodeId: string | null) => void;
};

export const useCanvasStore = create<CanvasState>((set) => ({
  selectedNodeId: null,
  setSelectedNodeId: (nodeId) => set({ selectedNodeId: nodeId }),
}));
