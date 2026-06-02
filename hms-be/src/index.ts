import "dotenv/config";
import { Hono } from "hono";
import serverConfig from "./config/server";
import appRouter from "./routes";

// Allow BigInt values to be serialised in JSON responses
(BigInt.prototype as unknown as { toJSON: () => string }).toJSON = function () {
  return this.toString();
};

const app = new Hono();
const port = Number(serverConfig.port) || 8080;

app.route("/", appRouter);

console.log(`Server is running on url ${serverConfig.appUrl}`);

export default {
  port,
  fetch: app.fetch,
};
