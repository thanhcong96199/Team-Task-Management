import { Outlet } from "react-router";
import { AppHeader } from "./components/AppHeader";

export const AppLayout = () => {
  return (
    <div className="flex min-h-svh flex-col">
      <AppHeader />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
};
