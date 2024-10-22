import { serveStatic } from "@hono/node-server/serve-static";
import { ServerBuild } from "@remix-run/node";
import { Hono } from "hono";
import { setCookie, setSignedCookie } from "hono/cookie";
import { remix } from "remix-hono/handler";
import { importDevBuild } from "./dev/server.js";
import { authenticate } from "./users.db.js";

const mode = process.env.NODE_ENV;
const isDev = mode === "development";

export const remixRoute = new Hono<{
  Variables: { user?: { id: string; name: string } };
}>();

remixRoute
  .use("/*", serveStatic({ root: "./build/client" }))
  .use("*", async (c, next) => {
    const user = c.get("user");
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
        return { user };
      },
    })(c, next);
  });
