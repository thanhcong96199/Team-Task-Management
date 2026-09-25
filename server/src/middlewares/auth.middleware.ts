import type { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import { env } from "../config/env.js";


export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Chua dang nhap'});
    }

    const token = authHeader.split(' ')[1] || '';

    const secret = env.JWT_ACCESS_SECRET;

    if (!secret) throw new Error('Missing JWT_ACCESS_SECRET');

    try {
        const decoded = jwt.verify(token, secret, { algorithms: ["HS256"] }) as { userId: number; email: string };
        req.user = { id: decoded.userId, email: decoded.email };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Token khong hop le' });
    }
}