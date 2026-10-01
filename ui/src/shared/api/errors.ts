import { apiErrorResponseSchema } from "@ttm/shared";
import axios from "axios";

export type ApiErrorKind = "http" | "network" | "timeout" | "canceled";

export type ApiErrorInit = {
  kind: ApiErrorKind;
  status: number; // 0 when no response was received
  message: string;
  fieldErrors?: Record<string, string[]>;
  cause?: unknown;
};

export class ApiError extends Error {
  readonly kind: ApiErrorKind;
  readonly status: number;
  readonly fieldErrors?: Record<string, string[]>;

  constructor({ kind, status, message, fieldErrors, cause }: ApiErrorInit) {
    super(message, { cause });
    this.name = "ApiError";
    this.kind = kind;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

// Used only when the server did not send a usable message
const DEFAULT_MESSAGES: Record<ApiErrorKind, string> = {
  http: "Something went wrong. Please try again.",
  network: "Cannot connect to the server. Check your connection.",
  timeout: "The server took too long to respond.",
  canceled: "Request was canceled.",
};

// Backend sends Record<string, string[] | undefined>; drop empty entries
const toFieldErrors = (
  errors: Record<string, string[] | undefined> | undefined,
): Record<string, string[]> | undefined => {
  if (!errors) return undefined;
  const entries = Object.entries(errors).filter(
    (entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0,
  );
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
};

// Converts anything thrown by axios (or by our own code) into an ApiError.
// Order matters: a canceled request is also an AxiosError without a response,
// so it must be checked before the network case.
export function normalizeError(error: unknown): ApiError {
  if (isApiError(error)) {
    return error;
  }

  if (axios.isCancel(error)) {
    return new ApiError({
      kind: "canceled",
      status: 0,
      message: DEFAULT_MESSAGES.canceled,
      cause: error,
    });
  }

  if (!axios.isAxiosError(error)) {
    // Not an HTTP problem (e.g. a bug in an interceptor); keep the original for debugging
    return new ApiError({
      kind: "network",
      status: 0,
      message: DEFAULT_MESSAGES.network,
      cause: error,
    });
  }

  if (error.code === "ECONNABORTED" || error.code === "ETIMEDOUT") {
    return new ApiError({
      kind: "timeout",
      status: 0,
      message: DEFAULT_MESSAGES.timeout,
      cause: error,
    });
  }

  if (!error.response) {
    return new ApiError({
      kind: "network",
      status: 0,
      message: DEFAULT_MESSAGES.network,
      cause: error,
    });
  }

  // The body may not be our JSON format (e.g. HTML from a proxy, text when the backend is down)
  const body = apiErrorResponseSchema.safeParse(error.response.data);
  return new ApiError({
    kind: "http",
    status: error.response.status,
    message: body.success ? body.data.message : DEFAULT_MESSAGES.http,
    fieldErrors: body.success ? toFieldErrors(body.data.errors) : undefined,
    cause: error,
  });
}
