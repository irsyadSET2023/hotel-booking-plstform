import type { Context } from "hono";
import { sendSuccess, sendError } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import { loginService } from "../../services/auth/login.service";
import { myProfileService } from "../../services/auth/my-profile.service";
import type { AppEnv } from "../../utils/jwt";

export const login = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const { email, password } = (c.req as any).valid("json") as {
      email: string;
      password: string;
    };
    const result = await loginService(email, password);
    return sendSuccess(c, result, "Login successful");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const myProfile = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const result = await myProfileService(c.get("user").uuid);
    return sendSuccess(c, result, "Profile retrieved successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      console.error("Unexpected error in myProfile controller:", error);
      return sendError(c, "Internal server error", 500);
    }
  }
};
