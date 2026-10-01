import instance from "@/shared/api/client";
import tokenStore from "@/shared/api/tokenStore";
import type { LoginInput } from "@ttm/shared";

const { setAccessToken, clearAccessToken } = tokenStore;

export const authApi = {
    login: (input: LoginInput) => {
        return instance.post("/auth/login", input).then((response) => {
            
            const { accessToken } = response.data.data;

            setAccessToken(accessToken);

            return response.data.data;

        });
    },
    getMe: () => {
        return instance.get("/auth/me").then((response) => {
            return response.data.data;
        });
    },
    refreshToken: () => {
        return instance.post("/auth/refresh").then((response) => {
            const { accessToken } = response.data.data;

            setAccessToken(accessToken);
            return response.data.data;

        });
    },
    logout: () => {
        return instance.post("/auth/logout").finally(() => {
            clearAccessToken();
        });
    }
}