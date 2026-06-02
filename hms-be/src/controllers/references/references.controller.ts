import type { Context } from "hono";
import { listCountriesService } from "../../services/references/list-countries.service";
import { listCitiesService } from "../../services/references/list-cities.service";
import { listTimezonesService } from "../../services/references/list-timezones.service";
import { sendSuccess, sendError } from "../../utils/response";
import { AppError } from "../../utils/app-error";

// ─── Countries ────────────────────────────────────────────────────────────────

export const listCountries = async (c: Context): Promise<Response> => {
  try {
    const { page, limit, search } = (c.req as any).valid("query") as {
      page?: number;
      limit?: number;
      search?: string;
    };
    const result = await listCountriesService(
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

// ─── Cities ──────────────────────────────────────────────────────────────────

export const listCities = async (c: Context): Promise<Response> => {
  try {
    const { countryId } = (c.req as any).valid("param") as {
      countryId: string;
    };
    const { page, limit, search } = (c.req as any).valid("query") as {
      page?: number;
      limit?: number;
      search?: string;
    };
    const result = await listCitiesService(
      countryId,
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

// ─── Timezones ────────────────────────────────────────────────────────────────

export const listTimezones = async (c: Context): Promise<Response> => {
  try {
    const { countryId } = (c.req as any).valid("param") as {
      countryId: string;
    };
    const { page, limit } = (c.req as any).valid("query") as {
      page?: number;
      limit?: number;
    };
    const result = await listTimezonesService(
      countryId,
      Math.max(1, page ?? 1),
      Math.min(100, Math.max(1, limit ?? 50)),
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
