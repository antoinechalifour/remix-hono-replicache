import { serve } from "@hono/node-server";
import app from "./app.js";

serve(app, () => {
  console.log("App running");
});
