import type { Request, Response } from "express";
import { workspaceService } from "./workspace.service.js";

export const allWorkspaces = async (req: Request, res: Response) => {
    const userId = req.params.id;

    const result = workspaceService.getWorkspaceOfUser(Number(userId)); 

    return res.status(201).json({
    data: result,
  });

}