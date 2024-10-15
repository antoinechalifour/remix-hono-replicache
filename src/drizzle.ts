import "dotenv/config";
import { drizzle } from "drizzle-orm/connect";

export const db = await drizzle("node-postgres", {
  logger: false,
  connection: process.env.DATABASE_URL!,
});
