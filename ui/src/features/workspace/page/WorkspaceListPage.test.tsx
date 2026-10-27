import { describe, expect, it } from "vitest";
import { screen, waitFor, waitForElementToBeRemoved, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { delay, http, HttpResponse } from "msw";
import { server } from "@/test/server";
import { renderWithProviders } from "@/test/render";
import type { WorkspaceSummary } from "@ttm/shared";
import WorkspaceListPage from "./WorkspaceListPage";

describe("WorkspaceListPage", () => {
  it("shows the empty state when the user has no workspace", async () => {
    renderWithProviders(<WorkspaceListPage />);

    // findBy* chờ cho tới khi phần tử xuất hiện (dữ liệu tải xong)
    expect(await screen.findByText(/don't have any workspace/i)).toBeInTheDocument();
  });

  it("shows workspace cards", async () => {
    server.use(
      http.get("/api/v1/workspaces", () =>
        HttpResponse.json({
          data: [
            {
              id: 1,
              name: "Team A",
              role: "ADMIN",
              memberCount: 1,
              projectCount: 0,
              createdAt: "2026-10-19T00:00:00.000Z",
            },
          ],
        }),
      ),
    );

    renderWithProviders(<WorkspaceListPage />);

    expect(await screen.findByRole("link", { name: /team a/i })).toBeInTheDocument();
  });

  it("shows skeleton while waiting for the API", async () => {
    server.use(
      http.get("/api/v1/workspaces", async () => {
        await delay(50);
        return HttpResponse.json({ data: [] });
      }),
    );
    renderWithProviders(<WorkspaceListPage />);

    const skeleton = screen.getByTestId("skeleton-list_workspace");

    expect(skeleton).toBeInTheDocument();

    await waitForElementToBeRemoved(skeleton);
    expect(await screen.findByText(/You don't have any workspace/i)).toBeInTheDocument();
  });

  it("shows error when has error from server", async () => {
    server.use(
      http.get("/api/v1/workspaces", async () => {
        return new HttpResponse(null, { status: 500 });
      }),
    );

    renderWithProviders(<WorkspaceListPage />);
    expect(await screen.findByRole("button", { name: /Try again/i })).toBeInTheDocument();
  });

  describe("create workspace", () => {
    // Opens the dialog from the page, like a user would. Returns the dialog element
    // so each test can search inside it with `within`.
    const openCreateDialog = async (user: ReturnType<typeof userEvent.setup>) => {
      await user.click(await screen.findByRole("button", { name: /create workspace/i }));
      return screen.findByRole("dialog", { name: /create workspace/i });
    };
    it("does not show the dialog before clicking Create workspace", async () => {
      renderWithProviders(<WorkspaceListPage />);
      expect(await screen.findByRole("button", { name: /Create workspace/i })).toBeInTheDocument();

      expect(screen.queryByRole("dialog", { name: /Create Workspace/i })).not.toBeInTheDocument();
    });
    it("opens on click and closes on Esc", async () => {
      renderWithProviders(<WorkspaceListPage />);
      const btnCreate = await screen.findByRole("button", { name: /Create workspace/i });
      expect(btnCreate).toBeInTheDocument();
      await userEvent.click(btnCreate);
      expect(await screen.findByRole("dialog", { name: /Create Workspace/i })).toBeInTheDocument();
      await userEvent.keyboard("{Escape}");
      await waitFor(() =>
        expect(screen.queryByRole("dialog", { name: /Create Workspace/i })).not.toBeInTheDocument(),
      );
    });

    it("creates a workspace, closes the dialog and shows it in the list", async () => {
      // A fake "database": POST adds to it, GET reads from it,
      // so the refetch after creating sees the new workspace.
      const workspaces: WorkspaceSummary[] = [];
      let postedBody: unknown;
      server.use(
        http.get("/api/v1/workspaces", () => HttpResponse.json({ data: workspaces })),
        http.post("/api/v1/workspaces", async ({ request }) => {
          postedBody = await request.json();
          const created: WorkspaceSummary = {
            id: 1,
            name: "Team A",
            role: "ADMIN",
            memberCount: 1,
            projectCount: 1,
            createdAt: "2026-10-27T00:00:00.000Z",
          };
          workspaces.push(created);
          return HttpResponse.json({ data: created }, { status: 201 });
        }),
      );
      const user = userEvent.setup();
      renderWithProviders(<WorkspaceListPage />);

      const dialog = await openCreateDialog(user);
      await user.type(within(dialog).getByLabelText(/workspace name/i), "Team A");
      await user.type(within(dialog).getByLabelText(/project name/i), "Website");
      await user.click(within(dialog).getByRole("button", { name: /submit/i }));

      // The list refetched after success, and the dialog is gone
      expect(await screen.findByRole("link", { name: /team a/i })).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(postedBody).toEqual({ name: "Team A", projectName: "Website" });
    });

    it("shows an error and sends no request when the name is empty", async () => {
      let postCount = 0;
      server.use(
        http.post("/api/v1/workspaces", () => {
          postCount++;
          return HttpResponse.json({}, { status: 201 });
        }),
      );
      const user = userEvent.setup();
      renderWithProviders(<WorkspaceListPage />);

      const dialog = await openCreateDialog(user);
      await user.click(within(dialog).getByRole("button", { name: /submit/i }));

      // FormField links the error to the input via aria-describedby,
      // so we check the input is marked invalid and has an error description
      const nameInput = within(dialog).getByLabelText(/workspace name/i);
      await waitFor(() => expect(nameInput).toHaveAttribute("aria-invalid", "true"));
      expect(nameInput).toHaveAccessibleDescription();
      expect(postCount).toBe(0);
    });

    it("shows the server field error under the name and keeps the dialog open", async () => {
      server.use(
        http.post("/api/v1/workspaces", () =>
          HttpResponse.json(
            { message: "Validation failed", errors: { name: ["Name is already taken"] } },
            { status: 400 },
          ),
        ),
      );
      const user = userEvent.setup();
      renderWithProviders(<WorkspaceListPage />);

      const dialog = await openCreateDialog(user);
      const nameInput = within(dialog).getByLabelText(/workspace name/i);
      await user.type(nameInput, "Team A");
      await user.click(within(dialog).getByRole("button", { name: /submit/i }));

      expect(await within(dialog).findByText("Name is already taken")).toBeInTheDocument();
      expect(nameInput).toHaveAccessibleDescription("Name is already taken");
      expect(dialog).toBeInTheDocument();
    });

    it("shows a form-level error when the server fails", async () => {
      server.use(
        http.post("/api/v1/workspaces", () =>
          HttpResponse.json({ message: "Internal server error" }, { status: 500 }),
        ),
      );
      const user = userEvent.setup();
      renderWithProviders(<WorkspaceListPage />);

      const dialog = await openCreateDialog(user);
      await user.type(within(dialog).getByLabelText(/workspace name/i), "Team A");
      await user.click(within(dialog).getByRole("button", { name: /submit/i }));

      // No field to attach a 500 to, so it goes to the role="alert" box at the top of the form
      expect(await within(dialog).findByRole("alert")).toHaveTextContent("Internal server error");
      expect(dialog).toBeInTheDocument();
    });
  });
});
