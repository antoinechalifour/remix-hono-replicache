import app from "./app.js";
import { serve } from "@hono/node-server";

serve(app, () => {
  console.log("App running");
});
