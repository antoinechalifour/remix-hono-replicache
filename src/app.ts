import { Hono } from "hono";
import { remixRoute } from "./remix.route.js";
import { replicacheRoute } from "./replicache.route.js";
import { usersRoute } from "./users.route.js";

const app = new Hono();

app
  .route("/users", usersRoute)
  .route("/replicache", replicacheRoute)
  .route("/", remixRoute);

export default app;
