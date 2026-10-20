import { GuestRoute, ProtectedRoute } from "@/features/auth/guards";
import { createBrowserRouter } from "react-router";
import RouteErrorPage from "./pages/RouteErrorPage";
import { AppLayout } from "./layouts/AppLayout";

const route = createBrowserRouter([
  {
    ErrorBoundary: RouteErrorPage, // bắt lỗi của MỌI route con bên dưới
    children: [
      {
        Component: ProtectedRoute,
        children: [
          {
            Component: AppLayout,
            children: [
              {
                path: "/",

                lazy: async () => {
                  const ListWorkspace = (await import("../features/workspace/page/WorkspaceListPage")).default;
                  return { Component: ListWorkspace };
                },
              },
              {
                path: "/workspaces/:workspaceId",

                lazy: async () => {
                  const WorkspaceDetail = (await import("../features/workspace/page/WorkspaceDetailPage")).default;
                  return { Component: WorkspaceDetail };
                },
              },
            ],
          },
        ],
      },
      {
        Component: GuestRoute, // route cha không có path, chỉ để bọc
        children: [
          {
            path: "/login",
            lazy: async () => {
              const LoginPage = (await import("../features/auth/pages/LoginPage")).default;
              return { Component: LoginPage };
            },
          },
          {
            path: "/register",
            lazy: async () => {
              const RegisterPage = (await import("../features/auth/pages/RegisterPage")).default;
              return { Component: RegisterPage };
            },
          },
        ],
      },
      {
        path: "*",
        lazy: async () => ({
          Component: (await import("./pages/NotFoundPage")).default,
        }),
      },
    ],
  },
]);

export default route;
