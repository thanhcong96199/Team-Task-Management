import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { RouterProvider } from "react-router";
import router from "./router";
import { queryClient } from "@/shared/lib/queryClient";

export function AppProviders({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export function AppRouterProvider() {
  return <RouterProvider router={router} />;
}
