import z from "zod";

export const tokenPayloadSchema = z.object({
  userId: z.number().int().positive(),
  email: z.email(),
});
