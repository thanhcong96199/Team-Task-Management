import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { createUserAndLogin, createWorkspace, expectFieldError } from "../../../test/helpers.js";

describe("GET /api/v1/workspaces", () => {
  it("returns 401 without a token", async () => {
    await request(app).get("/api/v1/workspaces").expect(401);
  });

  it("returns an empty array for a new user", async () => {
    const a = await createUserAndLogin("A");

    const res = await request(app)
      .get("/api/v1/workspaces")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(200);

    expect(res.body.data).toEqual([]);
  });

  it("returns 200 list workspaces", async () => {
    const a = await createUserAndLogin("A");
    await createWorkspace(a.accessToken, { name: "Team A" });
    await createWorkspace(a.accessToken, { name: "SRA workspace" });

    const res = await request(app)
      .get("/api/v1/workspaces")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(200);

    expect(res.body.data).toMatchObject([
      { name: "SRA workspace", role: "ADMIN", projectCount: 0 },
      { name: "Team A", role: "ADMIN", projectCount: 0 },
    ]);
  });

  it("returns detail workspace with param is correct", async () => {
    const a = await createUserAndLogin("A");

    const workspaceItem = await createWorkspace(a.accessToken, {
      name: "SRA workspace",
      projectName: "UI SRA",
    });

    const workspaceId = workspaceItem.id;

    const res = await request(app)
      .get(`/api/v1/workspaces/${workspaceId}`)
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(200);

    expect(res.body.data).toMatchObject({
      name: "SRA workspace",
      role: "ADMIN",
      projectCount: 1,
      projects: [
        {
          name: "UI SRA",
        },
      ],
    });
  });

  it("returns detail workspace with param is wrong", async () => {
    const a = await createUserAndLogin("A");

    await request(app)
      .get(`/api/v1/workspaces/abc`)
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(400);
  });

  it("returns 404 when a non-member opens the workspace", async () => {
    const a = await createUserAndLogin("A");
    const b = await createUserAndLogin("B");
    const ws = await createWorkspace(a.accessToken, { name: "Team A" });

    await request(app)
      .get(`/api/v1/workspaces/${ws.id}`)
      .set("Authorization", `Bearer ${b.accessToken}`)
      .expect(404);
  });

  it("returns only the user's own workspaces", async () => {
    const a = await createUserAndLogin("A");
    const b = await createUserAndLogin("B");
    await createWorkspace(a.accessToken, { name: "Team A" });
    const wsB = await createWorkspace(b.accessToken, { name: "Team B" });

    const res = await request(app)
      .get(`/api/v1/workspaces/`)
      .set("Authorization", `Bearer ${b.accessToken}`)
      .expect(200);

    expect(res.body.data).toMatchObject([
      {
        name: "Team B",
        role: "ADMIN",
        id: wsB.id,
        createdAt: wsB.createdAt,
        memberCount: wsB.memberCount,
        projectCount: wsB.projectCount,
      },
    ]);
  });

  it("returns 404 when this workspace is removed", async () => {
    const a = await createUserAndLogin("A");
    const wsOne = await createWorkspace(a.accessToken, { name: "Team A" });

    await request(app)
      .delete(`/api/v1/workspaces/${wsOne.id}`)
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(204);
    await request(app)
      .get(`/api/v1/workspaces/${wsOne.id}`)
      .set("Authorization", `Bearer ${a.accessToken}`)
      .expect(404);
  });
});

describe("POST /api/v1/workspaces", () => {
  it("returns 401 without a token", async () => {
    await request(app).post("/api/v1/workspaces").expect(401);
  });

  it("returns created a workspace with the creator as ADMIN", async () => {
    const a = await createUserAndLogin("A");

    const res = await createWorkspace(a.accessToken, { name: "Team A" });

    expect(res).toMatchObject({ name: "Team A", role: "ADMIN", memberCount: 1 });
  });

  it("returns 400 when create a workspace with validate name", async () => {
    const a = await createUserAndLogin("A");

    const res = await request(app)
      .post("/api/v1/workspaces")
      .set("Authorization", `Bearer ${a.accessToken}`)
      .send({ name: "       " })
      .expect(400);
    expectFieldError(res, "name");
  });

  it("returns created a workspace with projectName", async () => {
    const a = await createUserAndLogin("A");

    const res = await createWorkspace(a.accessToken, {
      name: "SRA workspace",
      projectName: "UI SRA",
    });

    expect(res).toMatchObject({ name: "SRA workspace", role: "ADMIN", projectCount: 1 });
  });
});
