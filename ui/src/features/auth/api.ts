import instance, { unwrap } from "@/shared/api/client";
import tokenStore from "@/shared/api/tokenStore";
import type { ApiSuccess, LoginInput, MeResult } from "@ttm/shared";
import type { LoginResult } from "@ttm/shared";

const { setAccessToken, clearAccessToken } = tokenStore;

export const authApi = {
  login: (input: LoginInput) => {
    return instance
      .post<ApiSuccess<LoginResult>>("/auth/login", input)
      .then(unwrap)
      .then((response) => {
        const { accessToken } = response;

        setAccessToken(accessToken);

        return response;
      });
  },
  getMe: () => {
    return instance.get<ApiSuccess<MeResult>>("/auth/me").then(unwrap);
  },
  refreshToken: () => {
    return instance
      .post<ApiSuccess<LoginResult>>("/auth/refresh")
      .then(unwrap)
      .then((response) => {
        const { accessToken } = response;

        setAccessToken(accessToken);
        return response;
      });
  },
  logout: () => {
    return instance.post<ApiSuccess<void>>("/auth/logout").finally(() => {
      clearAccessToken();
    });
  },
};
