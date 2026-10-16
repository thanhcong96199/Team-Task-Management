import instance, { unwrap } from "@/shared/api/client";
import type { ApiSuccess, WorkspaceDetail, WorkspaceSummary } from "@ttm/shared";

export type CreateWorkspaceInput = {
    name: string;
}

export const workspaceApi = {
    getWorkspaces: () => {
        return instance.get<ApiSuccess<WorkspaceSummary[]>>("/workspaces").then(unwrap);
    },
    createWorkspace: (input: CreateWorkspaceInput) => {
        return instance.post<ApiSuccess<WorkspaceSummary>>("/workspaces", input).then(unwrap);
    },
    getDetailWorkspace: (workspaceId: number) => {
        return instance.get<ApiSuccess<WorkspaceDetail>>(`/workspaces/${workspaceId}`).then(unwrap);
    }
}
