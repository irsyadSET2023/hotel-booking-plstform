import type { Context } from "hono";
import { createHotelService } from "../../services/hotel/create-hotel.service";
import { listHotelsService } from "../../services/hotel/list-hotels.service";
import { getHotelService } from "../../services/hotel/get-hotel.service";
import { updateHotelService } from "../../services/hotel/update-hotel.service";
import { deleteHotelService } from "../../services/hotel/delete-hotel.service";
import { createHotelAdminService } from "../../services/hotel/create-hotel-admin.service";
import { listHotelAdminsService } from "../../services/hotel/list-hotel-admins.service";
import { toggleHotelAdminService } from "../../services/hotel/toggle-hotel-admin.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AppError } from "../../utils/app-error";
import type { AppEnv } from "../../utils/jwt";

// ─── Hotels ───────────────────────────────────────────────────────────────────

export const createHotel = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const hotel = await createHotelService((c.req as any).valid("json") as any);
    return sendSuccess(c, hotel, "Hotel created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const listHotels = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as {
      page?: number;
      limit?: number;
      search?: string;
    };
    const result = await listHotelsService(
      Math.max(1, page ?? 1),
      Math.min(100, Math.max(1, limit ?? 20)),
      search,
    );
    return sendSuccess(c, result);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const getHotel = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const { uuid } = (c.req as any).valid("param") as { uuid: string };
    const hotel = await getHotelService(uuid, c.get("user"));
    return sendSuccess(c, hotel);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const updateHotel = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const { uuid } = (c.req as any).valid("param") as { uuid: string };
    const hotel = await updateHotelService(
      uuid,
      c.get("user"),
      (c.req as any).valid("json") as any,
    );
    return sendSuccess(c, hotel, "Hotel updated successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const deleteHotel = async (c: Context<AppEnv>): Promise<Response> => {
  try {
    const { uuid } = (c.req as any).valid("param") as { uuid: string };
    await deleteHotelService(uuid);
    return sendSuccess(c, null, "Hotel deleted successfully");
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

// ─── Hotel Admins ─────────────────────────────────────────────────────────────

export const createHotelAdmin = async (
  c: Context<AppEnv>,
): Promise<Response> => {
  try {
    const { uuid } = (c.req as any).valid("param") as { uuid: string };
    const admin = await createHotelAdminService(
      uuid,
      (c.req as any).valid("json") as any,
    );
    return sendSuccess(c, admin, "Hotel admin created successfully", 201);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const listHotelAdmins = async (
  c: Context<AppEnv>,
): Promise<Response> => {
  try {
    const { uuid } = (c.req as any).valid("param") as { uuid: string };
    const admins = await listHotelAdminsService(uuid);
    return sendSuccess(c, admins);
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};

export const toggleHotelAdmin = async (
  c: Context<AppEnv>,
): Promise<Response> => {
  try {
    const { uuid, adminUuid } = (c.req as any).valid("param") as {
      uuid: string;
      adminUuid: string;
    };
    const { isActive } = (c.req as any).valid("json") as { isActive: boolean };
    const admin = await toggleHotelAdminService(uuid, adminUuid, isActive);
    return sendSuccess(
      c,
      admin,
      `Admin ${isActive ? "activated" : "deactivated"} successfully`,
    );
  } catch (error) {
    if (error instanceof AppError) {
      return sendError(c, error.message, error.statusCode);
    } else {
      return sendError(c, "Internal server error", 500);
    }
  }
};
