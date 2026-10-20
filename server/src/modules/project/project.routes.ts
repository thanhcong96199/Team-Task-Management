import { Router } from "express";
import { authenticate } from "../../middlewares/auth.middleware.js";
import { validateBody } from "../../middlewares/validate.middleware.js";

const projectRouter = Router({ mergeParams: true });
projectRouter.use(authenticate);


export default projectRouter;
