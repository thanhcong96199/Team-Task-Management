import z from "zod";

export const projectParamsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  workspaceId: z.coerce.number().int().positive(),
});

export const createProjectSchema = z.object({
  projectName: z.string().trim().min(1).max(100),
});

export const updateProjectSchema = z.object({
  projectName: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(100).optional(),
});
