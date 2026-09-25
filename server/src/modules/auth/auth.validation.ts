import z, { email } from "zod";

export const registerSchema = z.object({
    name: z.string().trim().min(1).max(100),
    email: z.email().trim().toLowerCase(),
    password: z.string().min(8).max(72)
});

export const loginSchema = z.object({
    email: z.email().trim().toLowerCase(),
    password: z.string()
})