import type { Context } from "hono";
import type { AppEnv } from "../../utils/jwt";
import { sendError, sendSuccess } from "../../utils/response";
import { listRoomsService } from "../../services/room/list-rooms.service";
import { AppError } from "../../utils/app-error";
import { listRoomCategoriesService } from "../../services/room/list-room-categories.service";

export const listRooms = async (c: Context<AppEnv>) => {
  try {
    const query = (c.req as any).valid("query");

    const user = c.get("user"); // may be undefined (public access)

    const result = await listRoomsService(query, user);

    return sendSuccess(c, result, "Rooms fetched successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    }

    return sendError(c, "Internal server error", 500);
  }
};

// controllers/room-category.controller.ts

export const listRoomCategories = async (c: Context) => {
  try {
    const query = (c.req as any).valid("query");
    // const user = c.get("user"); // optional auth (may be undefined)

    const result = await listRoomCategoriesService(query, undefined);

    return sendSuccess(c, result);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    }
    return sendError(c, "Internal server error", 500);
  }
};
