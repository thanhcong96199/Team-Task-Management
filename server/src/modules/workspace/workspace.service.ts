import { prisma } from "../../config/database.js";
import type { Prisma } from "../../generated/prisma/client.js";
import type { WorkspaceDetail, WorkspaceRole, WorkspaceSummary } from "@ttm/shared";
import { AppError } from "../../utils/app-error.js";

// Shared select so list, create and detail return the same shape.
const workspaceSummarySelect = {
  id: true,
  name: true,
  createdAt: true,
  _count: {
    select: {
      workspaceMembers: true,
      projects: { where: { deletedAt: null } }, // only count non-deleted projects
    },
  },
} satisfies Prisma.WorkspaceSelect;

type WorkspaceSummaryRow = Prisma.WorkspaceGetPayload<{ select: typeof workspaceSummarySelect }>;

const toSummary = (workspace: WorkspaceSummaryRow, role: WorkspaceRole): WorkspaceSummary => ({
  id: workspace.id,
  name: workspace.name,
  role,
  memberCount: workspace._count.workspaceMembers,
  projectCount: workspace._count.projects,
  createdAt: workspace.createdAt.toISOString(),
});

export const workspaceService = {
  async getWorkspacesOfUser(userId: number): Promise<WorkspaceSummary[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: {
        userId,
        workspace: { deletedAt: null },
      },
      orderBy: { workspace: { createdAt: "desc" } },
      select: { role: true, workspace: { select: workspaceSummarySelect } },
    });

    return memberships.map((m) => toSummary(m.workspace, m.role));
  },

  async createWorkspace(input: {
    userId: number;
    name: string;
    projectName?: string;
  }): Promise<WorkspaceSummary> {
    // Nested write runs in one transaction: no workspace without an ADMIN member,
    // and if the first project fails, the workspace is rolled back too.
    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        workspaceMembers: { create: { userId: input.userId, role: "ADMIN" } },
        ...(input.projectName && {
          projects: { create: { name: input.projectName, description: "" } },
        }),
      },
      select: workspaceSummarySelect,
    });

    return toSummary(workspace, "ADMIN");
  },

  async getWorkspaceDetail(membership: {
    workspaceId: number;
    role: WorkspaceRole;
  }): Promise<WorkspaceDetail> {
    const workspace = await prisma.workspace.findFirst({
      where: { id: membership.workspaceId, deletedAt: null },
      select: {
        ...workspaceSummarySelect,
        projects: {
          where: { deletedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, name: true },
        },
      },
    });

    if (!workspace) {
      throw new AppError(404, "Workspace not found");
    }

    return { ...toSummary(workspace, membership.role), projects: workspace.projects };
  },

  async removeWorkspace(membership: { workspaceId: number }) {
    const workspace = await prisma.workspace.update({
      where: { id: membership.workspaceId, deletedAt: null },
      data: {
        deletedAt: new Date(),
      },
    });

    if (!workspace) {
      throw new AppError(404, "Workspace not found");
    }
    return workspace;
  },
};
