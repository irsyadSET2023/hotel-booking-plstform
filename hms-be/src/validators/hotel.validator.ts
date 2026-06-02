import { z } from "zod";

const uuidParam = z.object({
  uuid: z.string().uuid("Invalid hotel identifier"),
});

export const createHotelBodySchema = z.object({
  name: z.string().min(1, "Hotel name is required").trim(),
  starRating: z.number().int().min(1).max(5).nullable().optional(),
});

export const updateHotelParamSchema = uuidParam;
export const updateHotelBodySchema = z.object({
  name: z.string().min(1, "Hotel name cannot be empty").trim().optional(),
  starRating: z.number().int().min(1).max(5).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const createHotelAdminParamSchema = uuidParam;
export const createHotelAdminBodySchema = z.object({
  email: z
    .string()
    .email("A valid email address is required")
    .transform((v) => v.toLowerCase()),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  firstName: z.string().min(1, "First name is required").trim(),
  lastName: z.string().min(1, "Last name is required").trim(),
});

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const listHotelsQuerySchema = paginationSchema.extend({
  search: z.string().optional(),
});

export const getHotelParamSchema = uuidParam;
export const deleteHotelParamSchema = uuidParam;
export const listHotelAdminsParamSchema = uuidParam;

export const toggleHotelAdminParamSchema = z.object({
  uuid: z.string().uuid("Invalid hotel identifier"),
  adminUuid: z.string().uuid("Invalid admin identifier"),
});
export const toggleHotelAdminBodySchema = z.object({
  isActive: z.boolean({ message: "isActive must be a boolean" }),
});
