import { Router } from "express";
import { login, signUp } from "./auth.controller.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { loginSchema, registerSchema } from "./auth.validation.js";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), signUp);
authRouter.post("/login", validateBody(loginSchema), login);

export default authRouter;