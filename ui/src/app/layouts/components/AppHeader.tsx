import { useAuthStore } from "@/features/auth/store";
import { AvatarDropdown } from "./AvatarDropdown";
import { useLogout } from "@/features/auth/hooks";

export const AppHeader = () => {
  const user = useAuthStore((state) => state.user);
  const logout = useLogout();
  const handleLogout = () => {
    logout.mutate();
  };
  return (
    <header className="flex flex-row justify-between items-center p-2 bg-blue-100 border border-blue-200">
      <h2>Home</h2>
      <AvatarDropdown name={user?.name.slice(0, 1) ?? ""} onLogout={handleLogout} />
    </header>
  );
};
