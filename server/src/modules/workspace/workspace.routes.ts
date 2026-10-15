import { Router } from "express";
import { allWorkspaces, createWorkspace, workspaceDetail } from "./workspace.controller.js";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createWorkspaceSchema } from "@ttm/shared";
import { requireWorkspaceMember } from "./workspace.middleware.js";

const workspaceRouter = Router();
workspaceRouter.use(authenticate);

workspaceRouter.get("/", allWorkspaces);
workspaceRouter.post("/", validateBody(createWorkspaceSchema), createWorkspace);
workspaceRouter.get("/:workspaceId", requireWorkspaceMember(), workspaceDetail);

export default workspaceRouter;
