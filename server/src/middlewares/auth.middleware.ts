import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";
import { AppError } from "../utils/app-error.js";
import { tokenPayloadSchema } from "../modules/auth/auth.validation.js";

const BEARER_REGEX = /^Bearer\s+(\S+)$/;

// Errors thrown here are forwarded to errorHandler, so every 401 has the same response format
export const authenticate = (req: Request, _res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.match(BEARER_REGEX)?.[1];
  if (!token) {
    throw new AppError(401, "Missing or invalid Authorization header");
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    const message = error instanceof jwt.TokenExpiredError ? "Token expired" : "Invalid token";
    throw new AppError(401, message);
  }

  // A valid signature does not guarantee the payload shape (e.g. tokens issued by older code)
  const payload = tokenPayloadSchema.safeParse(decoded);
  if (!payload.success) {
    throw new AppError(401, "Invalid token");
  }

  req.user = { id: payload.data.userId, email: payload.data.email };
  next();
};
