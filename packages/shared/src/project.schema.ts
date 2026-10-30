import z from "zod";

export const projectParamsSchema = z.object({
  projectId: z.coerce.number().int().positive(),
  workspaceId: z.coerce.number().int().positive(),
});

export const createProjectSchema = z.object({
  projectName: z.string().trim().min(1).max(100),
});

export const updateProjectSchema = z.object({
  projectName: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().min(1).max(100).optional(),
});

// export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE" | "REJECT";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export type TaskSummary = {
  id: number;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date;
  assigneeId: number;
  assigneeName: string;
  comments: string;
};
// type TaskDetail = Record<TaskStatus, TaskSummary[]>;
export type AllTaskOfProject = {
  name: string;
  _count: {
    tasks: number;
  };
  tasks: TaskSummary[];
};
export type TaskCounts = Record<TaskStatus, number>;

export type AllBoardOfProject = {
  id: number;
  title: string;
  active: boolean;
  taskCounts: TaskCounts;
};

// shared: một mảng dùng được cả lúc runtime lẫn để suy ra type
export const TASK_STATUSES = ["TODO", "IN_PROGRESS", "DONE", "REJECT"] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export function isTaskStatus(value: unknown): value is TaskStatus {
  return TASK_STATUSES.includes(value as TaskStatus);
}
