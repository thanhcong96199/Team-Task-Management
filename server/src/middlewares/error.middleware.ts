import type { Request, Response } from "express";

export const errorHandler = (
    err: Error,
    _req: Request,
    res: Response
): void => {
    res.status(500).json({ message: err.message })
}