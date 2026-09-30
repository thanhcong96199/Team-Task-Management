import { Router } from "express";
import { getMe, login, logout, refreshToken, signUp } from "./auth.controller.js";
import { validateBody } from "../../middlewares/validate.middleware.js";
import { loginSchema, refreshPayloadSchema, registerSchema } from "@ttm/shared";
import { authenticate } from "../../middlewares/auth.middleware.js";

const authRouter = Router();

authRouter.post("/register", validateBody(registerSchema), signUp);
authRouter.post("/login", validateBody(loginSchema), login);
authRouter.get("/me", authenticate, getMe);
authRouter.post("/refresh", validateBody(refreshPayloadSchema), refreshToken);
authRouter.post("/logout", validateBody(refreshPayloadSchema), logout);

export default authRouter;
