import { Router } from "express";
import { allWorkspaces } from "./workspace.controller.js";
import { validateParams } from "../../middlewares/validate.middleware.js";
import { userParamSchema } from "./workspace.validation.js";

const workspaceRouter = Router();

// Get all workspace of userId
workspaceRouter.get("/workspaces/:userId", validateParams(userParamSchema), allWorkspaces);

export default workspaceRouter;