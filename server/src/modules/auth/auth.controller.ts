import type { Request, Response, NextFunction } from "express";
import { authService } from "./auth.service.js";

export const signUp = async (
    req: Request,
    res: Response,
    next: NextFunction,
) => {
    try {
        const userParam = {
            name: req.body?.name,
            email: req.body?.email,
            password: req.body?.password
        }
        const userInfor = await authService.signUpService(userParam);

        return res.status(200).json({
            data: userInfor,
        })
    } catch (error) {
        next(error)
    }

}