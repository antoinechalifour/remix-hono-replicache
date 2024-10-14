import "dotenv/config";
import { drizzle } from "drizzle-orm/connect";

export const db = await drizzle("node-postgres", {
  logger: true,
  connection: process.env.DATABASE_URL!,
});
