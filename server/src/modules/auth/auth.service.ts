import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";
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
            throw new AppError(409, "Invalid email or password");
        }
        // save user into db
        const secret = env.JWT_ACCESS_SECRET;
        const expires = env.JWT_ACCESS_EXPIRES_IN;
        const hashedPassword = jwt.sign({ data: userInfor?.password }, secret, { expiresIn: expires, algorithm: 'RS256'  });
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
        console.log('find user', findUser)
        if (!findUser) {
            throw new AppError(409, "Invalid email or password");
        }

        const decodedPass = await jwt.verify(password, findUser?.passwordHash);
        if (decodedPass) {
            return {
                accessToken: findUser?.passwordHash,
                user: {
                    id: findUser?.id,
                    email: findUser?.email,
                    name: findUser?.name
                }
            }
        }
        return null;
    }
};
