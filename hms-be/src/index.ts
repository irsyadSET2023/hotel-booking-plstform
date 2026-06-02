import "dotenv/config";
import { Hono } from "hono";
import serverConfig from "./config/server";
import appRouter from "./routes";
import { cors } from "hono/cors";

// Allow BigInt values to be serialised in JSON responses
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

const app = new Hono();

app.use(
  "*",
  cors({
    origin: "*", // or specify: ["http://localhost:3000", "https://yourdomain.com"]
    allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
  }),
);
const port = Number(serverConfig.port) || 8080;

app.route("/", appRouter);

console.log(`Server is running on url ${serverConfig.appUrl}`);

export default {
  port,
  fetch: app.fetch,
};
