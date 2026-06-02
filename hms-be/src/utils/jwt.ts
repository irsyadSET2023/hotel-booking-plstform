import jwt from "jsonwebtoken";
import type { UserRole } from "../../generated/prisma/index.js";
import serverConfig from "../config/server";

export interface JwtPayload {
  uuid: string; // safe public identifier
}

export interface JwtUserPayload extends JwtPayload {
  role: UserRole;
  hotelId: string | null;
}

const getSecret = (): string => {
  const secret = serverConfig.jwtSecret;
  if (!secret) throw new Error("JWT_SECRET environment variable is not set");
  return secret;
};

export const signToken = (payload: JwtPayload): string => {
  const expiresIn = serverConfig.jwtExpiresIn as jwt.SignOptions["expiresIn"];
  return jwt.sign(payload, getSecret(), { expiresIn });
};

export const verifyToken = (token: string): JwtPayload => {
  return jwt.verify(token, getSecret()) as JwtPayload;
};

// Hono environment type — carries authenticated user through the context
export type AppEnv = {
  Variables: {
    user: JwtUserPayload;
  };
};
