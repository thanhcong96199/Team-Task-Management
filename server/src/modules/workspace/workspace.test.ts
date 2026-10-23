import { describe, expect, it } from "vitest";
import request from "supertest";
import app from "../../app.js";
import { createUserAndLogin } from "../../../test/helpers.js";

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

    it("Get list workspaces", async () => {
        const a = await createUserAndLogin("A");

        await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .send({ name: "SRA workspace", projectName: 'UI SRA' })
            .expect(201);

        const res = await request(app)
            .get("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .expect(200);

        expect(Array.isArray(res.body.data)).toBe(true);

        expect(res.body.data).toMatchObject([
            { name: "SRA workspace", role: "ADMIN", projectCount: 1 }
        ]);
    });

    it("Get detail workspace with param is correct", async () => {
        const a = await createUserAndLogin("A");

        const workspaceItem = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .send({ name: "SRA workspace", projectName: 'UI SRA' })
            .expect(201);

        const workspaceId = workspaceItem.body.data.id;

        const res = await request(app)
            .get(`/api/v1/workspaces/${workspaceId}`)
            .set("Authorization", `Bearer ${a.accessToken}`)
            .expect(200);

        expect(res.body.data).toMatchObject(
            { 
                name: "SRA workspace", 
                role: "ADMIN", 
                projectCount: 1, 
                projects: [
                {   
                    name: "UI SRA"
                }
            ] }
        );
    });

    it("Get detail workspace with param is wrong", async () => {
        const a = await createUserAndLogin("A");

        await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .send({ name: "SRA workspace", projectName: 'UI SRA' })
            .expect(201);

        await request(app)
            .get(`/api/v1/workspaces/abc`)
            .set("Authorization", `Bearer ${a.accessToken}`)
            .expect(400);
    });

});

describe("POST /api/v1/workspaces", () => {
    it("returns 401 without a token", async () => {
        await request(app).get("/api/v1/workspaces").expect(401);
    });

    it("creates a workspace with the creator as ADMIN", async () => {
        const a = await createUserAndLogin("A");

        const res = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .send({ name: "Team A" })
            .expect(201);

        expect(res.body.data).toMatchObject({ name: "Team A", role: "ADMIN", memberCount: 1 });
    });

    it("creates a workspace with validate name", async () => {
        const a = await createUserAndLogin("A");

        await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .send({ name: "       " })
            .expect(400);
    });

    it("creates a workspace with projectName", async () => {
        const a = await createUserAndLogin("A");

        const res = await request(app)
            .post("/api/v1/workspaces")
            .set("Authorization", `Bearer ${a.accessToken}`)
            .send({ name: "SRA workspace", projectName: 'UI SRA' })
            .expect(201);

        expect(res.body.data).toMatchObject({ name: "SRA workspace", role: "ADMIN", projectCount: 1 });
    });

})