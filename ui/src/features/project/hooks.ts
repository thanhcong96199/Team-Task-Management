import { useQuery } from "@tanstack/react-query";
import { projectKeys } from "./queries";
import { ProjectApi } from "./api";
import { type TaskStatus, type TaskSummary } from "@ttm/shared";
import { parseTask } from "./utils";

export type TasksByStatus = Record<TaskStatus, TaskSummary[]>;

export function useBoardsOfProjectDetail(projectId: number, workspaceId: number) {
  return useQuery({
    queryKey: projectKeys.detail(projectId, workspaceId),
    queryFn: () => ProjectApi.getDetailProject(projectId, workspaceId),
  });
}

export function useTasksProject(projectId: number, workspaceId: number, boardId: number) {
  return useQuery({
    queryKey: projectKeys.tasks(projectId, workspaceId, boardId),
    queryFn: () =>
      ProjectApi.getAllTaskOfProject(projectId, workspaceId, boardId).then((data) => {
        const parseData = parseTask(data.tasks);

        return parseData;
      }),
  });
}
