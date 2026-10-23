import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import { projectParamsSchema } from "@ttm/shared";
import z from "zod";
import { prisma } from "../../config/database.js";

export const requireProject = () => async (req: Request, res: Response, next: NextFunction) => {
  const parsed = projectParamsSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid projectId", z.flattenError(parsed.error).fieldErrors);
  }
  const { projectId, workspaceId } = parsed.data;

  const project = await prisma.project.findUnique({
    where: {
      id: projectId,
      deletedAt: null,
      workspace: {
        id: workspaceId,
        deletedAt: null,
      },
    },
    select: { id: true, name: true, description: true },
  });

  if (!project) {
    throw new AppError(404, "Project not found");
  }
  req.project = { projectId: project.id, name: project.name, description: project.description };
  next();
};
