import { useAuthStore } from "./store";

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const { status } = useAuthStore();
    
    if (status === "loading") {
        return <div>Loading...</div>;
    }
    return <>{children}</>;
};