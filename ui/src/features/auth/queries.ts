import { useQuery } from "@tanstack/react-query";
import { authApi } from "./api";
import { useAuthStore } from "./store";

export const authKeys = {
  all: ["auth"] as const,
  me: () => [...authKeys.all, "me"] as const,
};

export function useMe() {
  const status = useAuthStore((state) => state.status);
  return useQuery({
    queryKey: authKeys.me(),
    queryFn: authApi.getMe,
    enabled: status === "authenticated",
  });
}
