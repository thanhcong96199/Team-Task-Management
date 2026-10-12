import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "./store";
import { authApi } from "./api";
import { useNavigate } from "react-router";

export function useLogin() {
    const navigate = useNavigate();
    const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

    return useMutation({
        mutationFn: authApi.login,
        onSuccess: (result) => {
            setAuthenticated(result.user);
            navigate("/");
        },
    });
}

export const useLogout = () => {
    const setUnauthenticated = useAuthStore((state) => state.setUnauthenticated);
    const navigate = useNavigate();

    return useMutation({
        mutationFn: authApi.logout,
        onSettled: () => {
            setUnauthenticated();
            navigate("/login");
        },
    });
}