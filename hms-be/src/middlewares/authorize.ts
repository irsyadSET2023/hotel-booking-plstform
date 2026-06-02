import type { Context, Next } from "hono";
import type { UserRole } from "../../generated/prisma/index.js";
import { sendError } from "../utils/response";
import type { AppEnv } from "../utils/jwt";

/**
 * Role-based access control middleware.
 * Place after `authenticate` — requires `c.get("user")` to be populated.
 */
export const authorize =
  (...roles: UserRole[]) =>
  async (c: Context<AppEnv>, next: Next): Promise<Response | void> => {
    const user = c.get("user");

    if (!user) {
      return sendError(c, "Unauthorized", 401);
    }

    if (!roles.includes(user.role)) {
      return sendError(c, "Forbidden — insufficient permissions", 403);
    }

    await next();
  };
