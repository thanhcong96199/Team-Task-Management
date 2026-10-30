import instance, { unwrap } from "@/shared/api/client";
import type { ApiSuccess, AllBoardOfProject, AllTaskOfProject } from "@ttm/shared";

export const ProjectApi = {
  getDetailProject: (projectId: number, workspaceId: number) => {
    return instance
      .get<ApiSuccess<AllBoardOfProject[]>>(
        `/workspaces/${workspaceId}/projects/${projectId}/boards`,
      )
      .then(unwrap);
  },
  getAllTaskOfProject: (projectId: number, workspaceId: number, boardId: number) => {
    return instance
      .get<ApiSuccess<AllTaskOfProject>>(
        `/workspaces/${workspaceId}/projects/${projectId}/boards/${boardId}/tasks`,
      )
      .then(unwrap);
  },
};
