import { endSession, refreshSession } from "./session";

let bootstrapPromise: Promise<void> | null = null;

// Runs once per page load and keeps its promise: calling it again (e.g. StrictMode)
// returns the same result instead of sending a second /refresh.
// Goes through refreshSession so several tabs opening at once take turns (Web Locks).
export const bootstrapAuth = (): Promise<void> => {
  bootstrapPromise ??= refreshSession().then(
    () => undefined, // refreshSession already stored the user
    () => endSession(), // no valid session (or backend down): show the app as logged out
  );
  return bootstrapPromise;
};
