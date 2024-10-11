import devServer, { defaultOptions } from "@hono/vite-dev-server";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import adapter from "@hono/vite-dev-server/node";
import build from "@hono/vite-build/node";

export default defineConfig({
  plugins: [
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
    devServer({
      adapter,
      entry: "src/main.ts",
      exclude: [...defaultOptions.exclude, "/public/**", "/app/**"],
      injectClientScript: false,
    }),
    build({
      entry: "src/main.ts",
    }),
  ],
});
