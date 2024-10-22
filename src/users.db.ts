import { eq } from "drizzle-orm";
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

export const getUserOrNull = async (id: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, id))
    .limit(1);
  return user ?? null;
};

export const createUser = (input: z.infer<typeof createUserSchema>) =>
  db.insert(usersTable).values(input).returning();

export const getUserByEmailOrNull = async (email: string) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);
  return user ?? null;
};

export const authenticate = async (email: string) => {
  const user = await getUserByEmailOrNull(email);
  if (user == null) throw new Error("Unauthorized");
  return user.id;
};
