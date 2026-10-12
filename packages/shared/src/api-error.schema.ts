import { z } from "zod";

// Error body returned by the backend errorHandler: { message, errors? }.
// Shared so the frontend can validate it instead of assuming the shape.
export const apiErrorResponseSchema = z.object({
  message: z.string(),
  errors: z.record(z.string(), z.array(z.string()).optional()).optional(),
});

export type ApiErrorResponse = z.infer<typeof apiErrorResponseSchema>;
