import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import bcrypt from "bcrypt";
import type z from "zod";
import type { loginSchema, registerSchema } from "@ttm/shared";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "./token.util.js";

export const authService = {
  async signUpService(userInfor: z.infer<typeof registerSchema>) {
    // check email is exist

    const findUser = await prisma.user.findUnique({
      where: {
        email: userInfor.email,
        deletedAt: null,
      },
    });
    if (findUser) {
      throw new AppError(409, "Email already exists");
    }
    // save user into db
    const salt = 10;

    const hashedPassword = await bcrypt.hash(userInfor.password, salt);
    const newUser = await prisma.user.create({
      data: {
        email: userInfor.email,
        name: userInfor.name,
        passwordHash: hashedPassword,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });

    return newUser;
  },
  async loginService(userInfor: z.infer<typeof loginSchema>) {
    const x: number = "abc";
    const { email, password } = userInfor;
    const findUser = await prisma.user.findUnique({
      where: {
        email,
        deletedAt: null,
      },
    });

    if (!findUser) {
      throw new AppError(401, "Invalid email or password");
    }

    const isPasswordValid = await bcrypt.compare(password, findUser.passwordHash);
    if (isPasswordValid) {
      const accessToken = signAccessToken(findUser);
      const refreshToken = signRefreshToken(findUser);
      const hashedToken = hashToken(refreshToken.refreshToken);

      await prisma.refreshToken.create({
        data: {
          userId: findUser.id,
          tokenHash: hashedToken,
          expiresAt: refreshToken.expiresAt,
        },
      });

      return {
        accessToken: accessToken,
        refreshToken: refreshToken.refreshToken,
        user: {
          id: findUser.id,
          email: findUser.email,
          name: findUser.name,
        },
      };
    }
    throw new AppError(401, "Invalid email or password");
  },
  async getInfor(userId: number) {
    const findUser = await prisma.user.findUnique({
      where: {
        id: userId,
        deletedAt: null,
      },
      select: { id: true, email: true, name: true, createdAt: true },
    });
    // Token is still valid but the user was deleted
    if (!findUser) {
      throw new AppError(401, "User no longer exists");
    }
    return findUser;
  },
  async rotateRefreshToken(refreshToken: string) {
    verifyRefreshToken(refreshToken);
    const hashedToken = hashToken(refreshToken);
    const findTokenHased = await prisma.refreshToken.findUnique({
      where: {
        tokenHash: hashedToken,
      },
    });

    if (!findTokenHased) throw new AppError(401, "Invalid refresh token");

    if (findTokenHased.revokedAt || findTokenHased.expiresAt < new Date()) {
      throw new AppError(401, "Invalid refresh token");
    }

    const findUser = await prisma.user.findUnique({
      where: {
        id: findTokenHased.userId,
        deletedAt: null,
      },
    });

    if (!findUser) throw new AppError(401, "User no longer exists");

    const newRefreshToken = signRefreshToken(findUser);
    const newAccessToken = signAccessToken(findUser);

    const newHasedToken = hashToken(newRefreshToken?.refreshToken);
    await prisma.$transaction([
      prisma.refreshToken.update({
        where: {
          id: findTokenHased.id,
        },
        data: {
          revokedAt: new Date(),
        },
      }),
      prisma.refreshToken.create({
        data: {
          tokenHash: newHasedToken,
          userId: findTokenHased.userId,
          expiresAt: newRefreshToken.expiresAt,
        },
      }),
    ]);

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken.refreshToken,
    };
  },
  async logout(refreshToken: string) {
    const hashedToken = hashToken(refreshToken);
    await prisma.refreshToken.updateMany({
      where: {
        tokenHash: hashedToken,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  },
};
