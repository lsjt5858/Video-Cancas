import { createBrowserRouter } from "react-router";
import ProjectList from "./pages/ProjectList";
import ProjectWorkspace from "./pages/ProjectWorkspace";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: ProjectList,
  },
  {
    path: "/project/:projectId",
    Component: ProjectWorkspace,
  },
]);
