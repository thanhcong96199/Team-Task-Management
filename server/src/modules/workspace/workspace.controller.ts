import type { Request, Response } from "express";
import { workspaceService } from "./workspace.service.js";

// `authenticate` guarantees req.user; `requireWorkspaceMember` guarantees req.membership.

export const allWorkspaces = async (req: Request, res: Response) => {
  const result = await workspaceService.getWorkspacesOfUser(req.user!.id);

  return res.status(200).json({ data: result });
};

export const createWorkspace = async (req: Request, res: Response) => {
  const result = await workspaceService.createWorkspace({
    userId: req.user!.id,
    name: req.body.name,
    projectName: req.body?.projectName,
  });

  return res.status(201).json({ data: result });
};

export const workspaceDetail = async (req: Request, res: Response) => {
  const result = await workspaceService.getWorkspaceDetail(req.membership!);

  return res.status(200).json({ data: result });
};

export const removeWorkspace = async (req: Request, res: Response) => {
  await workspaceService.removeWorkspace(req.membership!);

  return res.status(204).send();
};
