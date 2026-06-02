import type { Context, Next } from "hono";
import {
  verifyToken,
  type JwtPayload,
  type JwtUserPayload,
  type AppEnv,
} from "../utils/jwt";
import { sendError } from "../utils/response";
import prisma from "../config/prisma";

const verifyUser = async (payload: JwtPayload): Promise<JwtUserPayload> => {
  const user = await prisma.user.findUnique({
    where: { uuid: payload.uuid },
  });
  if (!user) {
    throw new Error("User not found");
  }
  return {
    uuid: user.uuid,
    role: user.role,
    hotelId: user.hotelId as string | null,
  };
};

export const authenticate = async (
  c: Context<AppEnv>,
  next: Next,
): Promise<Response | void> => {
  const authHeader = c.req.header("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return sendError(c, "Unauthorized — no token provided", 401);
  }

  const token = authHeader.slice(7);

  try {
    c.set("user", await verifyUser(verifyToken(token)));
    await next();
  } catch {
    return sendError(c, "Unauthorized — invalid or expired token", 401);
  }
};
