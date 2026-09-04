import express, { type Express, type Request, type Response } from "express";
import authRouter from "./modules/auth/auth.routes.js";

const app: Express = express();

app.use(express.json());

// app.use("/api/v1/login", authRouter);
app.use("/api/v1/auth", authRouter);


export default app;