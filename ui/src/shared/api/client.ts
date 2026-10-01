import axios from "axios";
import { normalizeError } from "./errors";
import tokenStore from "./tokenStore";

const instance = axios.create({ baseURL: "/api/v1", timeout: 15_000 });
instance.defaults.withCredentials = true; // Include cookies in requests

instance.interceptors.request.use((config) => {
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// Normalization must stay the LAST step: the refresh logic (F1.3) needs the raw
// AxiosError (error.config) to retry, so it has to run before this.
instance.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(normalizeError(error)),
);

export default instance;
