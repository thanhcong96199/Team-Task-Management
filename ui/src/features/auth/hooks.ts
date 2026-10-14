import { useMutation } from "@tanstack/react-query";
import { useAuthStore } from "./store";
import { authApi } from "./api";
import { useLocation, useNavigate } from "react-router";
import z from "zod";
import { endSession } from "./session";

const redirectStateSchema = z.object({ from: z.object({ pathname: z.string() }) });

const getRedirectPath = (state: unknown) => {
  const parsedState = redirectStateSchema.safeParse(state);
  return parsedState.data?.from ?? "/";
};

export function useLogin() {
  const navigate = useNavigate();
  const location = useLocation();
  const redirectPath = getRedirectPath(location.state);

  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (result) => {
      setAuthenticated(result.user);
      navigate(redirectPath, { replace: true });
    },
  });
}

export const useLogout = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      endSession();
      navigate("/login");
    },
  });
};

export const useRegister = () => {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      navigate("/login");
    },
  });
};
