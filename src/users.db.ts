import { z } from "zod";
import { usersTable } from "./db/schema.js";
import { db } from "./drizzle.js";

export const createUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});
export const getUsers = () => db.select().from(usersTable);

export const createUser = (input: z.infer<typeof createUserSchema>) =>
  db.insert(usersTable).values(input).returning();
