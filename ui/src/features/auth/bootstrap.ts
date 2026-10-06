import type { LoginResult } from "@ttm/shared";
import { authApi } from "./api";
import { useAuthStore } from "./store";

const { setAuthenticated, setUnauthenticated } = useAuthStore.getState();

let bootstrapPromise: Promise<void> | null = null;

export const bootstrapAuth = (): Promise<void> => {
    if (bootstrapPromise) {
        return bootstrapPromise;
    }

    bootstrapPromise = authApi.refreshToken()
        .then((result: LoginResult) => {
            setAuthenticated(result.user);
        })
        .catch(() => {
            setUnauthenticated();
        });

    return bootstrapPromise;

};