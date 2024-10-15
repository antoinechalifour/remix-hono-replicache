import { serveStatic } from "@hono/node-server/serve-static";
import { AppLoadContext, ServerBuild } from "@remix-run/node";
import { Hono } from "hono";
import { remix } from "remix-hono/handler";
import { importDevBuild } from "./dev/server.js";
import { getUsers } from "./users.db.js";

const mode = process.env.NODE_ENV;
const isDev = mode === "development";

export const remixRoute = new Hono();

remixRoute
  .use("/*", serveStatic({ root: "./build/client" }))
  .use("*", async (c, next) => {
    const users = await getUsers();
    const build = isDev
      ? ((await importDevBuild()) as unknown as ServerBuild)
      : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        // eslint-disable-next-line import/no-unresolved -- this expected until you build the app
        ((await import("../build/server/index.js")) as ServerBuild);

    return remix({
      build,
      mode: mode === "production" ? "production" : "development",
      getLoadContext() {
        return {
          user: users[0],
        } satisfies AppLoadContext;
      },
    })(c, next);
  });
