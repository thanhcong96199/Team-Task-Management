import { z } from "zod";

// Normalize first, then validate: z.email().trim() would reject "  a@b.com " before trimming
const emailSchema = z.string().trim().toLowerCase().pipe(z.email());

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: z.string().min(8).max(72),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1).max(72),
});

// Temporary: the refresh token moves to an httpOnly cookie in F1.0, then this schema can be removed
export const refreshPayloadSchema = z.object({
  refreshToken: z.string().min(1),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshPayload = z.infer<typeof refreshPayloadSchema>;
