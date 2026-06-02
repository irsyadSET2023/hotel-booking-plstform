import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import {
  listRoomCategoriesQuerySchema,
  listRoomsQuerySchema,
} from "../validators/room.validator";
import { authenticate } from "../middlewares/authenticate";
import {
  listRoomCategories,
  listRooms,
} from "../controllers/room/room.controller";

const roomRouter = new Hono();

// optional auth (public allowed, but enrich if logged in)

roomRouter.get(
  "/",
  authenticate,
  zValidator("query", listRoomsQuerySchema),
  listRooms,
);

roomRouter.get(
  "/categories",
  zValidator("query", listRoomCategoriesQuerySchema),
  listRoomCategories,
);

export default roomRouter;
