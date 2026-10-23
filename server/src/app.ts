import express, { type Express } from "express";
import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";
import cookieParser from "cookie-parser";
import workspaceRouter from "./modules/workspace/workspace.routes.js";
import projectRouter from "./modules/project/project.routes.js";
import boardRouter from "./modules/board/board.routes.js";
const app: Express = express();

app.use(cookieParser());
app.use(express.json());

app.use("/api/v1/auth", authRouter);
app.use("/api/v1/workspaces", workspaceRouter);
app.use("/api/v1/workspaces/:workspaceId/projects", projectRouter);
app.use("/api/v1/workspaces/:workspaceId/projects/:projectId/boards", boardRouter);

// Must be registered after all routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
