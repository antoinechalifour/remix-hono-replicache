import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createUser, createUserSchema, getUsers } from "./users.db.js";

export const usersRoute = new Hono();

usersRoute
  .get("/", async (c) => c.json({ users: await getUsers() }))
  .post("/", zValidator("json", createUserSchema), async (c) =>
    c.json(await createUser(c.req.valid("json"))),
  );
