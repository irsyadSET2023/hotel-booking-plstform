import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { login, myProfile } from "../controllers/auth/auth.controller";
import { loginSchema } from "../validators/auth.validator";
import { authenticate } from "../middlewares/authenticate";
import type { AppEnv } from "../utils/jwt";

const authRouter = new Hono<AppEnv>();

// POST /api/auth/login
authRouter.post("/login", zValidator("json", loginSchema), login);

// GET /api/auth/my-profile
authRouter.get("/my-profile", authenticate, myProfile);

export default authRouter;
