import { Hono } from "hono";
import { AppLoadContext, createRequestHandler } from "@remix-run/node";
import { serveStatic } from "@hono/node-server/serve-static";

const app = new Hono();

app.use("/public/*", serveStatic({ root: "./public" }));

app.use("*", async (c) => {
  // @ts-expect-error it's not typed
  const build = await import("virtual:remix/server-build");
  const handler = createRequestHandler(build, "development");
  const remixContext = {
    cloudflare: {
      env: c.env,
    },
  } as unknown as AppLoadContext;
  return handler(c.req.raw, remixContext);
});

export default app;
