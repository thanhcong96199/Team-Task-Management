import type { Request, Response, NextFunction } from "express";
import z from 'zod';

export const boardParamsSchema = z.object({
    boardId: z.coerce.number().int().positive()
});

export const validateParams = (schema: z.ZodType) =>
    (req: Request, res: Response, next: NextFunction) => {
        const result = schema.safeParse(req.params);
        if (!result.success) {
            return res.status(400).json({ errors: z.flattenError(result.error).fieldErrors });
        }
        next();
    };

export const validateBody = (schema: z.ZodType) => 
    (req: Request, res: Response, next: NextFunction) => {
        console.log('req', req.body);
        const result = schema.safeParse(req.body);
        if (!result.success) {
            return res.status(400).json({ errors: z.flattenError(result.error).fieldErrors });
        }

        req.body = result;
        next();
    }