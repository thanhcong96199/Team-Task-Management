import type { WorkspaceRole } from "@ttm/shared";

declare global {
  namespace Express {
    interface Request {
      user?: { id: number; email: string };
      membership?: { workspaceId: number; role: WorkspaceRole };
    }
  }
}

export {};
