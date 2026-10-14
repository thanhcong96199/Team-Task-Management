import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { AppProviders, AppRouterProvider } from "./app/providers.tsx";
import { bootstrapAuth } from "./features/auth/bootstrap.ts";
import { setupAuth } from "./features/auth/session.ts";

// Order matters: the interceptor needs its handlers before the first request goes out
setupAuth();
bootstrapAuth();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AppRouterProvider />
    </AppProviders>
  </StrictMode>,
);
