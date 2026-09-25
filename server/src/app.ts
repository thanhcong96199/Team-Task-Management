import express, { type Express } from "express";
import authRouter from "./modules/auth/auth.routes.js";
import { errorHandler, notFoundHandler } from "./middlewares/error.middleware.js";

const app: Express = express();

app.use(express.json());

app.use("/api/v1/auth", authRouter);

// Must be registered after all routes
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
