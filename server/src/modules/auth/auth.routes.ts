import { Router, type Request, type Response } from "express";
import { signUp } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", signUp);
// authRouter.post("/login", )

export default authRouter;