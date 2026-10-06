import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import AuthGate from "./features/auth/AuthGate.tsx";
import { AppProviders, AppRouterProvider } from "./app/providers.tsx";
import { bootstrapAuth } from "./features/auth/bootstrap.ts";

bootstrapAuth();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <AuthGate>
        <AppRouterProvider />
      </AuthGate>
    </AppProviders>
  </StrictMode>,
);
