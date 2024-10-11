import { Hono } from "hono";
import { AppLoadContext, ServerBuild } from "@remix-run/node";
import { serveStatic } from "@hono/node-server/serve-static";
import { importDevBuild } from "./dev/server";
import { remix } from "remix-hono/handler";

const app = new Hono();
const mode = process.env.NODE_ENV;
const isDev = mode === "development";

app.use("/public/*", serveStatic({ root: "./public" }));

app.use("*", async (c, next) => {
  const build = isDev
    ? ((await importDevBuild()) as unknown as ServerBuild)
    : // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line import/no-unresolved -- this expected until you build the app
      await import("../build/server/remix.js");

  return remix({
    build,
    mode: mode === "production" ? "production" : "development",
    getLoadContext() {
      return {
        appVersion: isDev ? "dev" : build.assets.version,
      } satisfies AppLoadContext;
    },
  })(c, next);
});

export default app;
