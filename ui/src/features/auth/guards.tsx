import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "./store";

export function ProtectedRoute() {
  const status = useAuthStore((s) => s.status);
  const location = useLocation();

  if (status === "loading") return <div>Loading...</div>;
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function GuestRoute() {
  const status = useAuthStore((s) => s.status);

  if (status === "loading") return <div>Loading...</div>;
  if (status === "authenticated") return <Navigate to="/" replace />;

  return <Outlet />;
}
