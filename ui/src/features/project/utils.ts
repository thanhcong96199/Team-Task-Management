import { TASK_STATUSES, type TaskStatus, type TaskSummary } from "@ttm/shared";
import type { TasksByStatus } from "./hooks";

export function parseTask(tasks: TaskSummary[]) {
  const result: TasksByStatus = {
    DONE: [],
    IN_PROGRESS: [],
    REJECT: [],
    TODO: [],
  };

  tasks.forEach((element) => {
    result[element.status].push(element);
  });

  return result;
}

export function moveTask(columns: TasksByStatus, taskId: number, toStatus: TaskStatus) {
  const task = Object.values(columns)
    .flat()
    .find((el) => el.id === taskId);
  if (task) {
    const newColumns = { ...columns };
    const result = TASK_STATUSES.reduce((pre, curr) => {
      if (curr === toStatus) {
        task.status = toStatus;
        pre[curr] = [...pre[curr], task];
      } else if (curr !== toStatus) {
        pre[curr] = pre[curr].filter((el) => el.id !== taskId);
      }

      return pre;
    }, newColumns);
    return result;
  }

  return columns;
}
