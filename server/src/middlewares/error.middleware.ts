import type { Request, Response } from "express";

interface ErrorHandle extends Error {
    code?: number;
}

export const errorHandler = (
    err: ErrorHandle,
    _req: Request,
    res: Response
): void => {
    res.status(err.code || 500).json({ message: err.message, statusCode: err.code || 500 })
}