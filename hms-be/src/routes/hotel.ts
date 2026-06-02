import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  createHotel,
  listHotels,
  getHotel,
  updateHotel,
  deleteHotel,
  createHotelAdmin,
  listHotelAdmins,
  toggleHotelAdmin,
} from "../controllers/hotel/hotel.controller";
import {
  createHotelBodySchema,
  updateHotelParamSchema,
  updateHotelBodySchema,
  createHotelAdminParamSchema,
  createHotelAdminBodySchema,
  listHotelsQuerySchema,
  getHotelParamSchema,
  deleteHotelParamSchema,
  listHotelAdminsParamSchema,
  toggleHotelAdminParamSchema,
  toggleHotelAdminBodySchema,
} from "../validators/hotel.validator";
import { authenticate } from "../middlewares/authenticate";
import { authorize } from "../middlewares/authorize";
import type { AppEnv } from "../utils/jwt";

const hotelRouter = new Hono<AppEnv>();

// All hotel routes require authentication
hotelRouter.use(authenticate);

// ─── Hotel CRUD ───────────────────────────────────────────────────────────────
// POST   /api/hotels              → create hotel (SUPER_ADMIN)
// GET    /api/hotels              → list hotels  (SUPER_ADMIN)
// GET    /api/hotels/:uuid        → get hotel    (SUPER_ADMIN | own HOTEL_ADMIN)
// PATCH  /api/hotels/:uuid        → update hotel (SUPER_ADMIN | own HOTEL_ADMIN)
// DELETE /api/hotels/:uuid        → soft delete  (SUPER_ADMIN)

hotelRouter.post(
  "/",
  authorize("SUPER_ADMIN"),
  zValidator("json", createHotelBodySchema),
  createHotel,
);

hotelRouter.get(
  "/",
  authorize("SUPER_ADMIN"),
  zValidator("query", listHotelsQuerySchema),
  listHotels,
);

hotelRouter.get(
  "/:uuid",
  authorize("SUPER_ADMIN", "HOTEL_ADMIN"),
  zValidator("param", getHotelParamSchema),
  getHotel,
);

hotelRouter.patch(
  "/:uuid",
  authorize("SUPER_ADMIN", "HOTEL_ADMIN"),
  zValidator("param", updateHotelParamSchema),
  zValidator("json", updateHotelBodySchema),
  updateHotel,
);

hotelRouter.delete(
  "/:uuid",
  authorize("SUPER_ADMIN"),
  zValidator("param", deleteHotelParamSchema),
  deleteHotel,
);

// ─── Hotel Admins ─────────────────────────────────────────────────────────────
// POST   /api/hotels/:uuid/admins                   → create admin (SUPER_ADMIN)
// GET    /api/hotels/:uuid/admins                   → list admins  (SUPER_ADMIN)
// PATCH  /api/hotels/:uuid/admins/:adminUuid/toggle → toggle active (SUPER_ADMIN)

hotelRouter.post(
  "/:uuid/admins",
  authorize("SUPER_ADMIN"),
  zValidator("param", createHotelAdminParamSchema),
  zValidator("json", createHotelAdminBodySchema),
  createHotelAdmin,
);

hotelRouter.get(
  "/:uuid/admins",
  authorize("SUPER_ADMIN"),
  zValidator("param", listHotelAdminsParamSchema),
  listHotelAdmins,
);

hotelRouter.patch(
  "/:uuid/admins/:adminUuid/toggle",
  authorize("SUPER_ADMIN"),
  zValidator("param", toggleHotelAdminParamSchema),
  zValidator("json", toggleHotelAdminBodySchema),
  toggleHotelAdmin,
);

export default hotelRouter;
