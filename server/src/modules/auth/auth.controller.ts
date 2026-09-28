import type { Request, Response } from "express";
import { authService } from "./auth.service.js";
import { AppError } from "../../utils/app-error.js";

// Express 5 forwards errors thrown in async handlers to errorHandler automatically
export const signUp = async (req: Request, res: Response) => {
    const userParam = {
        name: req.body?.name,
        email: req.body?.email,
        password: req.body?.password
    }
    const userInfor = await authService.signUpService(userParam);

    return res.status(201).json({
        data: userInfor,
    })
};

export const login = async (req: Request, res: Response) => {
    const userParam = {
        email: req.body?.email,
        password: req.body?.password
    }
    const result = await authService.loginService(userParam);

    return res.status(200).json({
        data: result,
    })

};

export const getMe = async (req: Request, res: Response) => {
    // req.user is set by authenticate; this guard only exists if the route forgets that middleware
    if (!req.user) {
        throw new AppError(401, "Unauthorized");
    }
    const result = await authService.getInfor(req.user.id);

    return res.status(200).json({
        data: result
    })
}
