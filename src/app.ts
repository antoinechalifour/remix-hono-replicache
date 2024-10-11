import { Hono } from "hono";
import { usersRoute } from "./users.route.js";
import { remixRoute } from "./remix.route.js";

const app = new Hono();

app.route("/users", usersRoute).route("/", remixRoute);

export default app;
