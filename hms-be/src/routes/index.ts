import { Hono } from "hono";
import type { AppEnv } from "../utils/jwt";
import healthRouter from "./health";
import authRouter from "./auth";
import hotelRouter from "./hotel";
import referencesRouter from "./references";
import roomRouter from "./room";
import customerRouter from "./customer";

const appRouter = new Hono<AppEnv>();

// Module routes
appRouter.route("/", healthRouter);
appRouter.route("/api/auth", authRouter);
appRouter.route("/api/hotels", hotelRouter);
appRouter.route("/api/references", referencesRouter);
appRouter.route("/api/rooms", roomRouter);
appRouter.route("/api/customers", customerRouter);

export default appRouter;
