import request, { type Response } from "supertest";
import { expect } from "vitest";
import app from "../src/app.js";
import type { WorkspaceSummary } from "@ttm/shared";

let counter = 0;

export async function createUserAndLogin(name = "User") {
  counter += 1;
  const input = { name, email: `user${counter}@test.com`, password: "password123" };

  await request(app).post("/api/v1/auth/register").send(input).expect(201);
  const res = await request(app).post("/api/v1/auth/login").send(input).expect(200);

  return { ...input, accessToken: res.body.data.accessToken as string };
}

export async function createWorkspace(
  token: string,
  input: { name?: string; projectName?: string } = {},
): Promise<WorkspaceSummary> {
  const res = await request(app)
    .post("/api/v1/workspaces")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Test workspace", ...input })
    .expect(201);

  return res.body.data as WorkspaceSummary;
}

// Asserts a 400 response that blames `field`, e.g. { errors: { name: ["Too small..."] } }
export function expectFieldError(res: Response, field: string) {
  expect(res.status).toBe(400);
  expect(res.body.errors?.[field]).toEqual(expect.arrayContaining([expect.any(String)]));
}
