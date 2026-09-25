import type { Request, Response, NextFunction } from "express";
import { prisma } from "../../config/database.js";
import z from "zod";
import { boardParamsSchema } from "../../middlewares/validate.middleware.js";

export async function checkBoardAdminAccess(req: Request, res: Response, next: NextFunction) {

        const parsed = boardParamsSchema.safeParse(req.params);
        if (!parsed.success) {
            return res.status(400).json({
                message: "Invalid boardId",
                errors: z.flattenError(parsed.error).fieldErrors
            });
        }
        const boardId = parsed.data.boardId;

        const currentId = req.user?.id;
        if (!currentId) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        const membership = await prisma.workspaceMember.findFirst({
            where: {
                userId: currentId,
                role: 'ADMIN',
                workspace: {
                    projects: {
                        some: {
                            boards: {
                                some: {
                                    id: boardId,
                                    deletedAt: null,
                                }
                            },
                            deletedAt: null,
                        }
                    },
                    deletedAt: null,
                },
            }
        })
        if (!membership) {
            return res.status(404).json({ message: 'Forbidden'})
        }
        return next();

}