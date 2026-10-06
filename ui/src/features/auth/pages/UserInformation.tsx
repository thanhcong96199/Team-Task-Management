import { useAuthStore } from "../store";
import { useLogout } from "../hooks";

export default function AuthInformation() {
    const { user } = useAuthStore();
    const logoutMutation = useLogout();
    const handleLogout = () => {
        logoutMutation.mutate();
    }
    return (
        <div>
            <h1>User Information</h1>
            <p>This is the user information page.</p>
            <p>Name: {user?.name}</p>
            <p>Email: {user?.email}</p>
            <button onClick={handleLogout}>
                Logout
            </button>
        </div>
    );
}