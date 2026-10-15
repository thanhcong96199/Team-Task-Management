import type { NextFunction, Request, Response } from "express";
import z from "zod";
import { workspaceParamsSchema, type WorkspaceRole } from "@ttm/shared";
import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";

// Parse :workspaceId, check membership (404 to hide existence), then optional role (403).
export const requireWorkspaceMember =
  (requiredRole?: WorkspaceRole) => async (req: Request, _res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, "Unauthorized");
    }

    const parsed = workspaceParamsSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new AppError(400, "Invalid workspaceId", z.flattenError(parsed.error).fieldErrors);
    }
    const { workspaceId } = parsed.data;

    const member = await prisma.workspaceMember.findUnique({
      where: { userId_workspaceId: { userId, workspaceId } },
      select: { role: true, workspace: { select: { deletedAt: true } } },
    });

    if (!member || member.workspace.deletedAt) {
      throw new AppError(404, "Workspace not found");
    }

    if (requiredRole && member.role !== requiredRole) {
      throw new AppError(403, "Only workspace admins can perform this action");
    }

    req.membership = { workspaceId, role: member.role };
    next();
  };
