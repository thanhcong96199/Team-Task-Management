import { email } from "zod";
import { prisma } from "../../config/database.js";
import bcrypt from "bcrypt";


export interface UserRequest {
    name: string;
    email: string;
    password: string;
}

interface ErrorDefine {
    code: number;
    message: string;
}

class AppError {
    code;
    message;
    constructor({ code, message }: ErrorDefine) {
        this.code = code;
        this.message = message;
    }
}

export const authService = {
    async signUpService (userInfor: UserRequest) {
        // check email is exist
        const findUser = await prisma.user.findUnique({
            where: {
                email: userInfor.email
            }
        });
        if (findUser) {
            throw(new AppError({
                code: 409,
                message: "Conflict user"
            }));
        }
        // save user into db
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(userInfor.password, saltRounds);
        const newUser = await prisma.user.create({
            data: {
                email: userInfor.email,
                name: userInfor.name,
                passwordHash: hashedPassword
            },
            })
        console.log("--- newUser ---", newUser);

        return newUser;
    }
}