import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";

// Handler mặc định: trường hợp "bình thường". Từng test có thể ghi đè.
export const server = setupServer(
  http.get("/api/v1/workspaces", () => HttpResponse.json({ data: [] })),
);
