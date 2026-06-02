import { Hono } from "hono";

const healthRouter = new Hono();

healthRouter.get("/", (c) => {
  return c.json({ message: "Health check GET endpoint" });
});
healthRouter.post("/", (c) => {
  return c.json({ message: "Health check POST endpoint" });
});

healthRouter.get("/success", (c) => {
  return c.json({ message: "success" });
});

healthRouter.get("/cancel", (c) => {
  return c.json({ message: "cancel" });
});

export default healthRouter;
