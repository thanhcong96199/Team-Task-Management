import { prisma } from "../../config/database.js";
import type { TaskStatus } from "../../generated/prisma/enums.js";
import { AppError } from "../../utils/app-error.js";
type BoardItemCreate = {
  title: string;
  active: boolean;
};

type ParamBoardCreate = {
  projectId: number;
  boards: BoardItemCreate[];
};

type ParamEditBoard = {
  projectId: number;
  boardId: number;
  title: string;
  active: boolean;
};
type ParamRemoveBoard = {
  boardId: number;
  projectId: number;
};

type ParamAllTask = {
  boardId: number;
  projectId: number;
  status: TaskStatus;
};

type TaskCounts = Record<TaskStatus, number>;

// New object on every call: boards must not share one counts object
const emptyTaskCounts = (): TaskCounts => ({
  TODO: 0,
  IN_PROGRESS: 0,
  DONE: 0,
  REJECT: 0,
});

export const boardService = {
  async getAllBoard(projectId: number) {
    const data = await prisma.board.findMany({
      where: { deletedAt: null, projectId: projectId },
      select: {
        id: true,
        title: true,
        active: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const groups = await prisma.task.groupBy({
      by: ["boardId", "status"],
      where: { deletedAt: null, boardId: { in: data.map((board) => board.id) } },
      _count: { _all: true },
    });

    // boardId -> { TODO: n, IN_PROGRESS: n, ... }
    const countsByBoard = new Map<number, TaskCounts>();
    for (const group of groups) {
      const counts = countsByBoard.get(group.boardId) ?? emptyTaskCounts();
      counts[group.status] = group._count._all;
      countsByBoard.set(group.boardId, counts);
    }

    return data.map((board) => ({
      ...board,
      taskCounts: countsByBoard.get(board.id) ?? emptyTaskCounts(),
    }));
  },
  async createBoards(input: ParamBoardCreate) {
    const { projectId, boards } = input;
    const data = boards.map((el) => ({
      projectId: projectId,
      title: el.title,
      active: el.active,
    }));
    const result = await prisma.board.createManyAndReturn({
      data: data,
      select: {
        id: true,
        active: true,
        title: true
      }
    });

    return result;
  },
  async editBoardOfProject(input: ParamEditBoard) {
    const { boardId, projectId, title, active } = input;
    const result = await prisma.board.update({
      where: { id: boardId, deletedAt: null, projectId: projectId },
      data: {
        title: title,
        active: active,
      },
    });

    if (!result) {
      throw new AppError(404, "Project not found");
    }
    return result;
  },
  async removeBoard(input: ParamRemoveBoard) {
    const { boardId, projectId } = input;
    const result = await prisma.board.update({
      where: { id: boardId, deletedAt: null, projectId: projectId },
      data: {
        deletedAt: new Date(),
        tasks: {
          updateMany: {
            where: { boardId: boardId },
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
    return;
  },
  async getAllTask(input: ParamAllTask) {
    const { boardId, projectId, status } = input;
    const result = await prisma.board.findMany({
      where: { id: boardId, projectId: projectId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      select: {
        _count: {
          select: {
            tasks: {
              where: { deletedAt: null, status: status },
            },
          },
        },
        tasks: {
          where: { deletedAt: null, status: status },
          select: { id: true, title: true, status: true },
        },
      },
    });
    return result;
  },
};
