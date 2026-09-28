import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { AppError } from "../../utils/app-error.js";
import { tokenPayloadSchema } from "./auth.validation.js";
import { createHash } from "node:crypto"

interface User {
    id: number
    email: string
    name: string
}

export const signAccessToken = (user: User) => {
    const secretKey = env.JWT_ACCESS_SECRET;
    const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        secretKey,
        {
            algorithm: 'HS256',
            expiresIn: env.JWT_ACCESS_EXPIRES_IN
        });

    return {
        accessToken: accessToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        }
    }

}

export const signRefreshToken = (user: User) => {
    const secretRefreshKey = env.JWT_REFRESH_SECRET;
    const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        secretRefreshKey,
        {
            algorithm: 'HS256',
            expiresIn: env.JWT_REFRESH_EXPIRES_IN
        });

    return {
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name
        }
    }
}

export const verifyRefreshToken = (token: string) => {
    if (!token) {
        throw new AppError(401, "Missing or invalid Authorization header");
    }

    let decoded: unknown;
    try {
        decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, { algorithms: ["HS256"] });
    } catch (error) {
        const message = error instanceof jwt.TokenExpiredError ? "Token expired" : "Invalid token";
        throw new AppError(401, message);
    }

    // A valid signature does not guarantee the payload shape (e.g. tokens issued by older code)
    const payload = tokenPayloadSchema.safeParse(decoded);
    if (!payload.success) {
        throw new AppError(401, "Invalid token");
    }

    return payload.data
}

export const hashToken = (token: string) => {
    if (!token) {
        throw new AppError(401, "Missing or invalid Authorization header");
    }
    const createdHash = createHash("sha256");

    return hashToken;

}