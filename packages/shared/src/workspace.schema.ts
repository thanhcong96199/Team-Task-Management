import z from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.coerce.number().int().positive(),
});

export type WorkspaceRole = "ADMIN" | "MEMBER";
export type WorkspaceSummary = {
  id: number;
  name: string;
  role: WorkspaceRole; // vai trò của user hiện tại trong workspace này
  memberCount: number;
  projectCount: number; // chỉ đếm project chưa bị xoá mềm
  createdAt: string; // JSON không có kiểu Date
};

export type WorkspaceDetail = WorkspaceSummary;
