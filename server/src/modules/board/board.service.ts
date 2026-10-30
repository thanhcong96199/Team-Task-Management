import { prisma } from "../../config/database.js";
import type { TaskStatus, TaskPriority } from "../../generated/prisma/enums.js";
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

type BodyCreateTaskBoard = {
  creatorId: number;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  assigneeId: number;
  boardId: number;
  description: string;
  comment?: string;
};

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
        title: true,
      },
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
    const result = await prisma.board.findUnique({
      where: { id: boardId, projectId: projectId, deletedAt: null },
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
          orderBy: { createdAt: "desc" },
          select: { id: true, title: true, status: true },
        },
      },
    });
    return result;
  },
  async createTaskForBoard(input: BodyCreateTaskBoard) {
    const { boardId, title, creatorId, status, priority, assigneeId, description, comment } = input;
    const result = await prisma.task.create({
      data: {
        title: title,
        status: status,
        priority: priority,
        assigneeId: assigneeId,
        creatorId: creatorId,
        boardId: boardId,
        description: description,
        ...(comment && {
          comments: {
            create: {
              content: comment,
              userId: creatorId,
            },
          },
        }),
      },
      select: { id: true, title: true, description: true, comments: true, assigneeId: true },
    });
    return result;
  },
};
