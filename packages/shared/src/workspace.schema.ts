import z from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().trim().min(1).max(100),
  // Optional first project, created in the same transaction as the workspace.
  // Empty string (blank form field) means "no project".
  projectName: z.string().trim().max(100).optional(),
});

export const workspaceParamsSchema = z.object({
  workspaceId: z.coerce.number().int().positive(),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;

export type WorkspaceRole = "ADMIN" | "MEMBER";
export type WorkspaceSummary = {
  id: number;
  name: string;
  role: WorkspaceRole; // vai trò của user hiện tại trong workspace này
  memberCount: number;
  projectCount: number; // chỉ đếm project chưa bị xoá mềm
  createdAt: string; // JSON không có kiểu Date
};

export type ProjectSummary = {
  id: number;
  name: string;
};

// Detail = summary + non-deleted projects. The list endpoint does not load projects.
export type WorkspaceDetail = WorkspaceSummary & {
  projects: ProjectSummary[];
};
