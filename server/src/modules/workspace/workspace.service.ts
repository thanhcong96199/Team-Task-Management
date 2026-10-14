import { prisma } from "../../config/database.js"

export const workspaceService = {
    async getWorkspaceOfUser(userId: number) {
        const findUserInWorkspace = await prisma.workspaceMember.findMany({
            where: {
                userId: userId,
                workspace: {
                    deletedAt: null,
                },
                user: {
                    deletedAt: null,
                }
            }
        });

        console.log('findUserInWorkspace', findUserInWorkspace);
        return findUserInWorkspace;
    }
}