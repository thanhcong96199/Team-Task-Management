import type { Request, Response } from "express";
import { projectService } from "./project.service.js";

export const getAllProjects = async (req: Request, res: Response) => {
  const result = await projectService.getAllProjects(req.membership!.workspaceId);

  return res.status(200).json({ data: result });
};
export const createProject = async (req: Request, res: Response) => {
  const projectName = req.body.projectName;
  const result = await projectService.createProjects({
    workspaceId: req.membership!.workspaceId,
    projectName,
  });

  return res.status(201).json({ data: result });
};
export const detailProject = async (req: Request, res: Response) => {
  const result = {
    id: req.project!.projectId,
    name: req.project?.name,
    description: req.project?.description,
  };

  return res.status(200).json({ data: result });
};
export const editProject = async (req: Request, res: Response) => {
  const result = await projectService.editProject({
    id: req.project!.projectId,
    name: req.body?.projectName,
    description: req.body.description,
  });

  return res.status(200).json({ data: result });
};
export const removeProject = async (req: Request, res: Response) => {
  await projectService.removeProject(req.project!.projectId);
  return res.status(204).send();
};
