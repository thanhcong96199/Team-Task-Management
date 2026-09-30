import jwt, { type JwtPayload } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { tokenPayloadSchema } from "./auth.validation.js";
import { createHash, randomUUID } from "node:crypto";
import type { User } from "../../generated/prisma/client.js";

export const signAccessToken = (user: Pick<User, "id" | "email">) => {
  const secretKey = env.JWT_ACCESS_SECRET;
  const accessToken = jwt.sign({ userId: user.id, email: user.email }, secretKey, {
    algorithm: "HS256",
    expiresIn: env.JWT_ACCESS_EXPIRES_IN,
    jwtid: randomUUID(),
  });

  return accessToken;
};

export const signRefreshToken = (user: Pick<User, "id" | "email">) => {
  const secretRefreshKey = env.JWT_REFRESH_SECRET;
  const refreshToken = jwt.sign({ userId: user.id, email: user.email }, secretRefreshKey, {
    algorithm: "HS256",
    expiresIn: env.JWT_REFRESH_EXPIRES_IN,
    jwtid: randomUUID(),
  });
  const decodedToken = jwt.decode(refreshToken) as JwtPayload;

  if (!decodedToken.exp) throw new Error("Refresh token has no exp claim");

  const expiresAt = new Date(decodedToken.exp * 1000);

  return {
    refreshToken,
    expiresAt,
  };
};

export const verifyRefreshToken = (token: string) => {
  if (!token) {
    throw new AppError(401, "Invalid refresh token");
  }

  let decoded: unknown;
  try {
    decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
  } catch (error) {
    const message =
      error instanceof jwt.TokenExpiredError ? "Token expired" : "Invalid refresh token";
    throw new AppError(401, message);
  }

  // A valid signature does not guarantee the payload shape (e.g. tokens issued by older code)
  const payload = tokenPayloadSchema.safeParse(decoded);
  if (!payload.success) {
    throw new AppError(401, "Invalid refresh token");
  }

  return payload.data;
};

export const hashToken = (token: string) => {
  const createdHash = createHash("sha256");
  const hashedToken = createdHash.update(token).digest("hex");

  return hashedToken;
};
