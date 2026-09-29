import { Router } from "express";
import { getMe, login, refreshToken, signUp } from "./auth.controller.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { loginSchema, refreshPayloadSchema, registerSchema } from "./auth.validation.js";
import { authenticate } from "../../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), signUp);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.get("/me", authenticate, getMe);
authRouter.post("/refresh", validateBody(refreshPayloadSchema), refreshToken)

export default authRouter;