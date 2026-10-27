import { server } from "@/test/server";
import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import WorkspaceDetailPage from "./WorkspaceDetailPage";
import { renderWithProviders } from "@/test/render";
import { screen } from "@testing-library/react";

describe("WorkspaceDetailPage", () => {
  it("shows not found workspace", async () => {
    server.use(
      http.get<{ workspaceId: string }>("/api/v1/workspaces/:workspaceId", () => {
        return new HttpResponse(null, { status: 404 });
      }),
    );
    renderWithProviders(<WorkspaceDetailPage />, {
      route: "/workspaces/1000",
      path: "/workspaces/:workspaceId",
    });
    expect(
      await screen.findByRole("link", { name: /Go Back to Workspace List Page/i }),
    ).toHaveAttribute("href", "/");
  });

  it("shows information of workspace detail", async () => {
    let workspaceId;
    server.use(
      http.get<{ workspaceId: string }>("/api/v1/workspaces/:workspaceId", ({ params }) => {
        workspaceId = params.workspaceId;
        return HttpResponse.json({
          data: {
            id: 1,
            name: "Team A",
            memberCount: 2,
            projectCount: 1,
            projects: [
              {
                id: 5,
                name: "Website",
              },
            ],
          },
        });
      }),
    );
    renderWithProviders(<WorkspaceDetailPage />, {
      route: "/workspaces/1",
      path: "/workspaces/:workspaceId",
    });

    expect(await screen.findByRole("heading", { name: /team a/i })).toBeInTheDocument();
    expect(screen.getByText(/total member: 2/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Website/i })).toBeInTheDocument();
    expect(workspaceId).toEqual("1");
  });

  it("shows Try again when has 500 error", async () => {
    server.use(
      http.get<{ workspaceId: string }>("/api/v1/workspaces/:workspaceId", () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );
    renderWithProviders(<WorkspaceDetailPage />, {
      route: "/workspaces/2",
      path: "/workspaces/:workspaceId",
    });
    expect(await screen.findByRole("button", { name: /Try again/i })).toBeInTheDocument();
  });
});
