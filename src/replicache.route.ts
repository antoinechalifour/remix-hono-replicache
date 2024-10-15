import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import {
  pull,
  pullRequestSchema,
  push,
  pushRequestSchema,
} from "./replicache.strategy.js";
import { getUsers } from "./users.db.js";

export const replicacheRoute = new Hono();

replicacheRoute
  .post("/push", zValidator("json", pushRequestSchema), async (c) => {
    const [user] = await getUsers();
    await push(user.id, c.req.valid("json"));
    return c.json({}, 200);
  })
  .post("/pull", zValidator("json", pullRequestSchema), async (c) => {
    const [user] = await getUsers();
    const resp = await pull(user.id, c.req.valid("json"));
    return c.json(resp, 200);
  });
