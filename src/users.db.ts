import { z } from "zod";
import { db } from "./drizzle.js";
import { usersTable } from "./db/schema.js";

export const createUserSchema = z.object({
  id: z.string(),
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
});
export const getUsers = () => db.select().from(usersTable);

export const createUser = (input: z.infer<typeof createUserSchema>) =>
  db.insert(usersTable).values(input).returning();
