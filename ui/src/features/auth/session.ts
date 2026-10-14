import type { LoginResult } from "@ttm/shared";
import { configureAuth } from "@/shared/api/client";
import tokenStore from "@/shared/api/tokenStore";
import { authApi } from "./api";
import { useAuthStore } from "./store";
import { queryClient } from "@/shared/lib/queryClient";

type AuthMessage = { action: "logout" };
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("auth") : null;
const broadcast = (message: AuthMessage) => channel?.postMessage(message);

// Module-level on purpose: every caller in this tab must see the same in-flight refresh
let refreshPromise: Promise<LoginResult> | null = null;

// Tabs share the refresh cookie but not memory. With rotation, two tabs refreshing with
// the same cookie would log one of them out, so tabs take turns via a cross-tab lock.
// The tab that waits then refreshes with the cookie the first tab received.
const withRefreshLock = <T>(fn: () => Promise<T>): Promise<T> =>
  typeof navigator !== "undefined" && "locks" in navigator
    ? navigator.locks.request("auth-refresh", fn)
    : fn();

// Single-flight: concurrent callers share one request. Reset when done so the next
// expiry can refresh again (unlike bootstrapAuth, which runs once per page load).
export function refreshSession(): Promise<LoginResult> {
  refreshPromise ??= withRefreshLock(() => authApi.refreshToken())
    .then((result) => {
      useAuthStore.getState().setAuthenticated(result.user);
      return result;
    })
    .finally(() => {
      refreshPromise = null;
    });
  return refreshPromise;
}

export function clearLocalSession() {
  tokenStore.clearAccessToken();
  useAuthStore.getState().setUnauthenticated();
  queryClient.clear();
}

export function endSession() {
  clearLocalSession();
  broadcast({ action: "logout" });
}

export function listenToOtherTabs() {
  if (channel) {
    channel.onmessage = (event) => {
      if (event.data?.action === "logout") {
        clearLocalSession();
      }
    };
  }
}

// Called once at startup, before any request is sent
export function setupAuth() {
  configureAuth({
    refresh: () => refreshSession().then((result) => result.accessToken),
    onAuthFailure: endSession,
  });
  listenToOtherTabs();
}
