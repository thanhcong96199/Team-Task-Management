import { useMutation, useQuery } from "@tanstack/react-query";
import { workspaceKeys } from "./queries";
import { workspaceApi } from "./api";

export function useWorkspaces() {
  return useQuery({
    queryKey: workspaceKeys.all,
    queryFn: () => workspaceApi.getWorkspaces(),
  });
}

export function useWorkspaceDetail(workspaceId: number) {
  return useQuery({
    queryKey: workspaceKeys.detail(workspaceId),
    queryFn: () => workspaceApi.getDetailWorkspace(workspaceId),
  });
}

export function useCreateWorkspace() {
  return useMutation({
    mutationFn: workspaceApi.createWorkspace,
  });
}
