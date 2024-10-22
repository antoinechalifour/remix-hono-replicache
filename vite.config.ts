import devServer, { defaultOptions } from "@hono/vite-dev-server";
import adapter from "@hono/vite-dev-server/node";
import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig(() => {
  return {
    plugins: [
      remix({
        routes(defineRoutes) {
          return defineRoutes((route) => {
            route("/", "routes/app/app.route.tsx", () => {
              route(
                "notes/:noteId",
                "routes/app.note-editor/note-editor.route.tsx",
              );
            });
          });
        },
        future: {
          v3_fetcherPersist: true,
          v3_relativeSplatPath: true,
          v3_throwAbortReason: true,
        },
      }),
      tsconfigPaths({ projects: ["tsconfig.client.json"] }),
      devServer({
        adapter,
        entry: "src/app.ts",
        exclude: [...defaultOptions.exclude, "/public/**", "/app/**"],
        injectClientScript: false,
      }),
    ],
  };
});
