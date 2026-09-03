import { email } from "zod";
import { prisma } from "../../config/database.js";
import bcrypt from "bcrypt";


export interface UserRequest {
    name: string;
    email: string;
    password: string;
}

export const authService = {
    async signUpService (userInfor: UserRequest) {
        // check email is exist
        const findUser = await prisma.user.find({
            email: userInfor.email
        });
        if (findUser) {
            throw("User is exist");
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