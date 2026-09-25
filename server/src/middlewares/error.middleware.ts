import type { Request, Response, NextFunction } from "express";
import { z } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import { AppError } from "../utils/app-error.js";

interface ErrorResponse {
    message: string;
    errors?: Record<string, string[] | undefined>;
}

const sendError = (res: Response, statusCode: number, body: ErrorResponse): void => {
    res.status(statusCode).json(body);
};

// Error thrown by express.json() when the request body is not valid JSON
const isJsonParseError = (err: unknown): boolean =>
    err instanceof SyntaxError &&
    (err as SyntaxError & { type?: string }).type === "entity.parse.failed";

export const notFoundHandler = (req: Request, res: Response): void => {
    sendError(res, 404, { message: `Route ${req.method} ${req.originalUrl} not found` });
};

export const errorHandler = (
    err: unknown,
    _req: Request,
    res: Response,
    next: NextFunction,
): void => {
    if (res.headersSent) {
        return next(err);
    }

    if (err instanceof AppError) {
        return sendError(res, err.statusCode, {
            message: err.message,
            ...(err.errors && { errors: err.errors }),
        });
    }

    if (err instanceof z.ZodError) {
        return sendError(res, 400, {
            message: "Validation failed",
            errors: z.flattenError(err).fieldErrors,
        });
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
        if (err.code === "P2002") {
            return sendError(res, 409, { message: "Resource already exists" });
        }
        if (err.code === "P2025") {
            return sendError(res, 404, { message: "Resource not found" });
        }
    }

    if (isJsonParseError(err)) {
        return sendError(res, 400, { message: "Invalid JSON body" });
    }

    console.error(err);
    sendError(res, 500, { message: "Internal Server Error" });
};
