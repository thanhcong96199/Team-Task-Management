import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
import bcrypt from 'bcrypt';
import z from "zod";
import jwt from 'jsonwebtoken';
import type { loginSchema, registerSchema } from "./auth.validation.js";
import { env } from "../../config/env.js";


export const authService = {
    async signUpService (userInfor: z.infer<typeof registerSchema>) {
        // check email is exist

        const findUser = await prisma.user.findUnique({
            where: {
                email: userInfor.email,
                deletedAt: null
            }
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
                passwordHash: hashedPassword
            },
            select: { id: true, email: true, name: true, createdAt: true }
            })

        return newUser;
    },
    async loginService (userInfor: z.infer<typeof loginSchema>) {
        const { email, password } = userInfor;
        const findUser = await prisma.user.findUnique({
                where: {
                    email,
                    deletedAt: null
                }
            });

        if (!findUser) {
            throw new AppError(401, "Invalid email or password");
        }

        const isPasswordValid = await bcrypt.compare(password, findUser.passwordHash);
        if (isPasswordValid) {
            const secretKey = env.JWT_ACCESS_SECRET;
            const accessToken = jwt.sign(
                { userId: findUser.id, email: findUser.email }, 
                secretKey, 
                { 
                algorithm: 'HS256', 
                expiresIn: env.JWT_ACCESS_EXPIRES_IN 
            });

            return {
                accessToken: accessToken,
                user: {
                    id: findUser.id,
                    email: findUser.email,
                    name: findUser.name
                }
            }
        }
        throw new AppError(401, 'Invalid email or password');
    },
    async getInfor(userId: number) {
        const findUser = await prisma.user.findUnique({
            where: {
                id: userId,
                deletedAt: null
            },
            select: { id: true, email: true, name: true, createdAt: true }
        });
        // Token is still valid but the user was deleted
        if (!findUser) {
            throw new AppError(401, "User no longer exists");
        }
        return findUser;
    }
};
