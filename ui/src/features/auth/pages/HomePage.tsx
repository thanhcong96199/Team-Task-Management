import { useAuthStore } from "../store";
import { useLogout } from "../hooks";
import { Button } from "@/shared/ui/button";

export default function HomePage() {
  const user = useAuthStore((state) => state.user);
  const logoutMutation = useLogout();
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div>
      <h1>User Information</h1>
      <p>This is the user information page.</p>
      <p>Name: {user?.name}</p>
      <p>Email: {user?.email}</p>
      <Button variant={"default"} onClick={handleLogout}>
        Logout
      </Button>
    </div>
  );
}
