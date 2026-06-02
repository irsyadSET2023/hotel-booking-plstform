import { z } from "zod";

const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const countryIdParamSchema = z.object({
  countryId: z.string().uuid("countryId must be a valid UUID"),
});

export const listCountriesQuerySchema = paginationSchema.extend({
  search: z.string().max(100).trim().optional(),
});

export const listCitiesParamSchema = countryIdParamSchema;
export const listCitiesQuerySchema = paginationSchema.extend({
  search: z.string().max(100).trim().optional(),
});

export const listTimezonesParamSchema = countryIdParamSchema;
export const listTimezonesQuerySchema = paginationSchema;
