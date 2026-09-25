import type { Request, Response } from "express";
import { authService } from "./auth.service.js";

// Express 5 forwards errors thrown in async handlers to errorHandler automatically
export const signUp = async (req: Request, res: Response) => {
    const userParam = {
        name: req.body?.data?.name,
        email: req.body?.data?.email,
        password: req.body?.data?.password
    }
    const userInfor = await authService.signUpService(userParam);

    if (!userInfor) return res.status(400).json({ message: 'Something error'});

    return res.status(201).json({
        data: userInfor,
    })
};

export const login = async (req: Request, res: Response) => {
    const userParam = {
        email: req.body?.data?.email,
        password: req.body?.data?.password
    }
    const result = await authService.loginService(userParam);
    if (!result) return res.status(400).json({ message: 'Email or Password invalid'});

    return res.status(200).json({
        data: result,
    })

};
