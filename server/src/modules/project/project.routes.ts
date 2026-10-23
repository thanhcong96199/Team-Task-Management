import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import {
  createProject,
  detailProject,
  editProject,
  getAllProjects,
  removeProject,
} from "./project.controller.js";
import { requireWorkspaceMember } from "../workspace/workspace.middleware.js";
import { requireProject } from "./project.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createProjectSchema, updateProjectSchema } from "@ttm/shared";

const projectRouter = Router({ mergeParams: true });
projectRouter.use(authenticate);
projectRouter.get("/", requireWorkspaceMember(), getAllProjects);
projectRouter.post(
  "/",
  requireWorkspaceMember("ADMIN"),
  validateBody(createProjectSchema),
  createProject,
);
projectRouter.get("/:projectId", requireWorkspaceMember(), requireProject(), detailProject);
projectRouter.patch("/:projectId", requireWorkspaceMember("ADMIN"), requireProject(), validateBody(updateProjectSchema), editProject);
projectRouter.delete(
  "/:projectId",
  requireWorkspaceMember("ADMIN"),
  requireProject(),
  removeProject,
);

export default projectRouter;
