import type { Request, Response } from "express";
import { boardService } from "./board.service.js";
import type { TaskStatus } from "../../generated/prisma/enums.js";

export const allBoardOfProject = async (req: Request, res: Response) => {
  const result = await boardService.getAllBoard(req.project!.projectId);
  return res.status(200).json({ data: result });
};

export const createBoardOfProject = async (req: Request, res: Response) => {
  const result = await boardService.createBoards({
    projectId: req.project!.projectId,
    boards: req.body.boards,
  });

  return res.status(201).json({ data: result });
};

export const editBoardOfProject = async (req: Request, res: Response) => {
  const result = await boardService.editBoardOfProject({
    projectId: req.project!.projectId,
    boardId: req.board!.boardId,
    title: req.body.title,
    active: req.body.active,
  });

  return res.status(200).json({ data: result });
};

export const removeBoardOfProject = async (req: Request, res: Response) => {
  await boardService.removeBoard({
    projectId: req.project!.projectId,
    boardId: req.board!.boardId,
  });

  return res.status(204).send();
};

export const getAllTaskOfBoard = async (req: Request, res: Response) => {
  const result = await boardService.getAllTask({
    projectId: req.project!.projectId,
    boardId: req.board!.boardId,
    status: req.query.status as TaskStatus,
  });

  return res.status(200).json({ data: result });
};
