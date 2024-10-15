import { generateJSON } from "@tiptap/html";
import { StarterKit } from "@tiptap/starter-kit";
import { Hono } from "hono";
import { DateTime } from "luxon";
import { default as wiki } from "wikipedia";
import { notesTable } from "./db/schema.js";
import { db } from "./drizzle.js";
import { remixRoute } from "./remix.route.js";
import { replicacheRoute } from "./replicache.route.js";
import { getUsers } from "./users.db.js";
import { usersRoute } from "./users.route.js";

const app = new Hono();

app
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
