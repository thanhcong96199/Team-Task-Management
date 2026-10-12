import axios, { type AxiosError, type AxiosResponse, type InternalAxiosRequestConfig } from "axios";
import type { ApiSuccess } from "@ttm/shared";
import { isApiError, normalizeError } from "./errors";
import tokenStore from "./tokenStore";

declare module "axios" {
  interface InternalAxiosRequestConfig {
    // Set on a request that is being replayed after a refresh, so it is never replayed twice
    _retry?: boolean;
  }
}

// shared/ must not import features/, so the auth feature plugs its behavior in at startup
export type AuthHandlers = {
  refresh: () => Promise<string>; // resolves with the new access token
  onAuthFailure: () => void; // the session is gone (refresh got a 401)
};

let authHandlers: AuthHandlers | null = null;

export const configureAuth = (handlers: AuthHandlers) => {
  authHandlers = handlers;
};

const instance = axios.create({ baseURL: "/api/v1", timeout: 15_000 });
instance.defaults.withCredentials = true; // Include cookies in requests

instance.interceptors.request.use((config) => {
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// A 401 here means "wrong password" or "session gone", never "access token expired"
const NO_REFRESH_URLS = ["/auth/login", "/auth/refresh", "/auth/logout"];

type RetryableError = AxiosError & { config: InternalAxiosRequestConfig };

const shouldRefresh = (error: unknown): error is RetryableError => {
  if (!axios.isAxiosError(error) || !error.config || error.response?.status !== 401) {
    return false;
  }
  const { config } = error;
  const sentToken = config.headers.has("Authorization");
  const isAuthEndpoint = NO_REFRESH_URLS.some((url) => config.url?.startsWith(url));
  return sentToken && !isAuthEndpoint && !config._retry;
};

// Refresh must run before normalization: replaying needs the raw AxiosError (error.config)
instance.interceptors.response.use(
  (response) => response,
  async (error: unknown) => {
    if (!authHandlers || !shouldRefresh(error)) {
      return Promise.reject(normalizeError(error));
    }

    const originalRequest = error.config;
    originalRequest._retry = true;

    try {
      await authHandlers.refresh();
    } catch (refreshError) {
      // Only a 401 from /refresh means the session is really over.
      // Network errors / 5xx keep the user logged in; this request just fails.
      if (isApiError(refreshError) && refreshError.status === 401) {
        authHandlers.onAuthFailure();
      }
      return Promise.reject(normalizeError(error));
    }

    // Goes through the request interceptor again, which attaches the new token
    return instance(originalRequest);
  },
);

export const unwrap = <T>(response: AxiosResponse<ApiSuccess<T>>) => response.data.data;
export default instance;
