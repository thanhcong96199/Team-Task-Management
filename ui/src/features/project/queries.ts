import { queryOptions } from "@tanstack/react-query";
import { ProjectApi } from "./api";
import { type TasksByStatus } from "./hooks";
import { parseTask } from "./utils";

export const projectKeys = {
  all: ["projects"] as const,
  list: () => [...projectKeys.all, "list"] as const,
  detail: (projectId: number, workspaceId: number) =>
    [...projectKeys.all, "detail", workspaceId, projectId] as const,
  tasks: (projectId: number, workspaceId: number, boardId: number) =>
    [
      ...projectKeys.all,
      "detail",
      workspaceId,
      projectId,
      "tasks",
      projectId,
      workspaceId,
      boardId,
    ] as const,
};

export function tasksQueryOptions(projectId: number, workspaceId: number, boardId: number) {
  return queryOptions({
    queryKey: projectKeys.tasks(projectId, workspaceId, boardId),
    queryFn: () =>
      ProjectApi.getAllTaskOfProject(projectId, workspaceId, boardId).then(
        (data): TasksByStatus => {
          const parseData = parseTask(data.tasks);

          return parseData;
        },
      ),
  });
}
