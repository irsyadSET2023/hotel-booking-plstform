import type { Context } from "hono";

export const sendSuccess = <T>(
  c: Context,
  data: T,
  message = "Success",
  statusCode = 200,
): Response => {
  return c.json({ success: true, message, data: data }, statusCode as any);
};

export const sendError = (
  c: Context,
  message: string,
  statusCode = 400,
  errors?: unknown,
): Response => {
  return c.json(
    { success: false, message, errors: errors ?? null },
    statusCode as any,
  );
};
