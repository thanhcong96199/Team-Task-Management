import type { FieldValues, Path, UseFormSetError } from "react-hook-form";
import type { ApiError } from "@/shared/api/errors";

// Shows a server error on the form:
// - field errors the form knows about go under their input
// - anything else (401, network, 500...) goes to `errors.root.server`
export function applyApiErrorToForm<T extends FieldValues>(
  error: ApiError,
  setError: UseFormSetError<T>,
  fields: readonly Path<T>[],
): void {
  const knownFieldErrors = Object.entries(error.fieldErrors ?? {}).filter(([name]) =>
    (fields as readonly string[]).includes(name),
  );

  for (const [name, messages] of knownFieldErrors) {
    setError(name as Path<T>, { type: "server", message: messages[0] });
  }

  if (knownFieldErrors.length === 0) {
    setError("root.server", { type: "server", message: error.message });
  }
}
