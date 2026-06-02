import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  listCountries,
  listCities,
  listTimezones,
} from "../controllers/references/references.controller";
import {
  listCountriesQuerySchema,
  listCitiesParamSchema,
  listCitiesQuerySchema,
  listTimezonesParamSchema,
  listTimezonesQuerySchema,
} from "../validators/references.validator";

const referencesRouter = new Hono();

// GET /api/references/countries?page=&limit=&search=
referencesRouter.get(
  "/countries",
  zValidator("query", listCountriesQuerySchema),
  listCountries,
);

// GET /api/references/cities/:countryId?page=&limit=&search=
referencesRouter.get(
  "/cities/:countryId",
  zValidator("param", listCitiesParamSchema),
  zValidator("query", listCitiesQuerySchema),
  listCities,
);

// GET /api/references/timezones/:countryId?page=&limit=
referencesRouter.get(
  "/timezones/:countryId",
  zValidator("param", listTimezonesParamSchema),
  zValidator("query", listTimezonesQuerySchema),
  listTimezones,
);

export default referencesRouter;
