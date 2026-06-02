import { Hono } from "hono";
import { stripeWebhook } from "../controllers/payment-gateway/payment-gateway.controller";

const webhookRouter = new Hono();

webhookRouter.post("/stripe", stripeWebhook);

export default webhookRouter;
