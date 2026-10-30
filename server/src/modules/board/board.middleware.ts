import type { NextFunction, Request, Response } from "express";
import { AppError } from "../../utils/app-error.js";
import z from "zod";
import { prisma } from "../../config/database.js";
import { boardParamBoardSchema } from "@ttm/shared";

export const requireBoard = () => async (req: Request, res: Response, next: NextFunction) => {
  const parsed = boardParamBoardSchema.safeParse(req.params);
  if (!parsed.success) {
    throw new AppError(400, "Invalid boardId", z.flattenError(parsed.error).fieldErrors);
  }
  const projectId = req.project!.projectId;
  const { boardId } = parsed.data;
  const boardData = await prisma.board.findUnique({
    where: { id: boardId, deletedAt: null, project: { id: projectId } },
    select: { id: true, title: true },
  });
  if (!boardData) {
    throw new AppError(404, "Board not found");
  }
  req.board = { boardId: boardData.id, name: boardData.title };
  next();
};

export const validateAssigneeTask =
  () => async (req: Request, res: Response, next: NextFunction) => {
    const workspaceId = req.membership!.workspaceId;

    const { assigneeId } = req.body;
    let members;
    if (assigneeId && typeof assigneeId === "number") {
      members = await prisma.workspaceMember.findUnique({
        where: {
          userId_workspaceId: { userId: assigneeId, workspaceId },
          workspace: { deletedAt: null, id: workspaceId },
        },
        select: { id: true },
      });
    }

    if (!members) {
      throw new AppError(422, "Assignee not found");
    }
    next();
  };
