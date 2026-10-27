import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { requireWorkspaceMember } from "../workspace/workspace.middleware.js";
import { requireProject } from "../project/project.middleware.js";
import {
  allBoardOfProject,
  createBoardOfProject,
  editBoardOfProject,
  getAllTaskOfBoard,
  removeBoardOfProject,
} from "./board.controller.js";
import { requireBoard } from "./board.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { createBoardSchema, updateBoardSchema } from "@ttm/shared";

const boardRouter = Router({ mergeParams: true });
boardRouter.use(authenticate);
boardRouter.get("", requireWorkspaceMember(), requireProject(), allBoardOfProject);
boardRouter.post(
  "",
  requireWorkspaceMember(),
  requireProject(),
  validateBody(createBoardSchema),
  createBoardOfProject,
);
boardRouter.patch(
  "/:boardId",
  requireWorkspaceMember(),
  requireProject(),
  requireBoard(),
  validateBody(updateBoardSchema),
  editBoardOfProject,
);
boardRouter.delete(
  "/:boardId",
  requireWorkspaceMember("ADMIN"),
  requireProject(),
  requireBoard(),
  removeBoardOfProject,
);
boardRouter.get(
  "/:boardId/tasks",
  requireWorkspaceMember(),
  requireProject(),
  requireBoard(),

  getAllTaskOfBoard,
);

export default boardRouter;
