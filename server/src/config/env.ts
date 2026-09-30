import "dotenv/config";
import { z } from "zod";
import type { SignOptions } from "jsonwebtoken";

type JwtExpiresIn = NonNullable<SignOptions["expiresIn"]>;

const envSchema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),

    JWT_ACCESS_SECRET: z.string().min(32, "JWT_ACCESS_SECRET must be at least 32 characters"),
    JWT_REFRESH_SECRET: z.string().min(32, "JWT_REFRESH_SECRET must be at least 32 characters"),
    JWT_ACCESS_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, "Use format like 15m, 1h, 7d")
      .default("15m")
      .transform((v) => v as JwtExpiresIn),
    JWT_REFRESH_EXPIRES_IN: z
      .string()
      .regex(/^\d+[smhd]$/, "Use format like 15m, 1h, 7d")
      .default("7d")
      .transform((v) => v as JwtExpiresIn),
  })
  .refine((env) => env.JWT_ACCESS_SECRET !== env.JWT_REFRESH_SECRET, {
    message: "JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different",
    path: ["JWT_REFRESH_SECRET"],
  });

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
