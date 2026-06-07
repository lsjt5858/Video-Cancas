export type ProjectStatus =
  | "draft"
  | "scripting"
  | "storyboard"
  | "generating"
  | "editing"
  | "exported"
  | "archived";

export type Project = {
  id: string;
  name: string;
  type: string;
  style?: string;
  aspectRatio: string;
  targetDuration?: number;
  status: ProjectStatus;
};
