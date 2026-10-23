import { prisma } from "../../config/database.js";
import { AppError } from "../../utils/app-error.js";

type ParamEditProject = {
  id: number;
  name: string;
  description: string;
};

export const projectService = {
  async getAllProjects(workspaceId: number) {
    const projects = await prisma.project.findMany({
      where: {
        deletedAt: null,
        workspace: {
          id: workspaceId,
          deletedAt: null,
        },
      },
      select: { id: true, name: true, description: true },
      orderBy: { createdAt: "desc" },
    });
    return projects;
  },
  async createProjects(input: { workspaceId: number; projectName: string }) {
    const result = await prisma.project.create({
      data: {
        name: input.projectName,
        workspaceId: input.workspaceId,
        description: "",
      },
      select: { id: true, name: true, description: true },
    });
    return result;
  },
  async removeProject(projectId: number) {
    const result = await prisma.project.update({
      where: { id: projectId },
      data: {
        deletedAt: new Date(),
        boards: {
          updateMany: {
            where: {
              projectId: projectId,
            },
            data: {
              deletedAt: new Date(),
            },
          },
        },
      },
    });
    if (!result) {
      throw new AppError(404, "Project not found");
    }
    return result;
  },
  async editProject(input: ParamEditProject) {
    const { id, name, description } = input;
    const result = await prisma.project.update({
      where: { id: id, deletedAt: null },
      data: { name: name, description: description },
    });
    if (!result) {
      throw new AppError(404, "Project not found");
    }
    return result;
  },
};
