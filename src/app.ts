import { zValidator } from "@hono/zod-validator";
import { generateJSON } from "@tiptap/html";
import { StarterKit } from "@tiptap/starter-kit";
import { Hono } from "hono";
import { getCookie, getSignedCookie, setSignedCookie } from "hono/cookie";
import { DateTime } from "luxon";
import { default as wiki } from "wikipedia";
import { z } from "zod";
import { notesTable } from "./db/schema.js";
import { db } from "./drizzle.js";
import { remixRoute } from "./remix.route.js";
import { replicacheRoute } from "./replicache.route.js";
import { authenticate, getUserOrNull, getUsers } from "./users.db.js";
import { usersRoute } from "./users.route.js";

const app = new Hono<{
  Variables: { user: { id: string; name: string } };
}>();

app
  .use("*", async (c, next) => {
    const userId = await getSignedCookie(c, "the-secret", "userId");
    if (typeof userId === "string") {
      const user = await getUserOrNull(userId);
      c.set("user", user);
    }

    await next();
  })
  .post(
    "/login",
    zValidator("form", z.object({ email: z.string() })),
    async (c) => {
      const form = c.req.valid("form");
      try {
        const userId = await authenticate(form.email);
        await setSignedCookie(c, "userId", userId, "the-secret");
        return c.redirect("/");
      } catch (err) {
        return c.redirect("/login");
      }
    },
  )
  .route("/users", usersRoute)
  .route("/replicache", replicacheRoute)

  .get("/seed", async (c) => {
    const [user] = await getUsers();

    for (let i = 0; i < 500; i += 1) {
      console.log("Fetching random article...");
      // @ts-expect-error wrong types
      const { title } = await wiki.random();
      console.log("Fetched", title);
      // @ts-expect-error wrong types
      const page = await wiki.page(title);
      const summary = await page.summary();
      const html = await page.html();
      const id = crypto.randomUUID();
      const json = generateJSON(html, [StarterKit]);
      await db.insert(notesTable).values({
        id,
        title,
        content: json,
        userId: user.id,
        version: 1,
        createdAt: DateTime.fromISO(summary.timestamp).toJSDate(),
        updatedAt: DateTime.fromISO(page.touched).toJSDate(),
      });
    }
    return c.text("Done");
  })
  .route("/", remixRoute);

export default app;
