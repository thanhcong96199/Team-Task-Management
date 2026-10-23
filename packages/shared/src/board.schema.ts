import z from "zod";

export const boardParamBoardSchema = z.object({
  boardId: z.coerce.number().int().positive(),
});

export const createBoardSchema = z.object({
  boards: z.array(z.object({ title: z.string().trim().min(1).max(100), active: z.boolean().default(true) })).max(10).min(1),
});

export const updateBoardSchema = z.object({
  title: z.string().trim().min(1).max(100).optional(),
  active: z.boolean().optional()
});

export const filterBoardSchema = z.object({
    status: z.enum(["TODO", "IN_PROGRESS", "DONE", "REJECT"]).optional()
})
