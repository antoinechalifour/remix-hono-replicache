import { todosTable } from "./db/schema.js";
import { z } from "zod";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { Transaction, VersionSearchResult } from "./db.utils.js";

export type Todo = {
  id: string;
  title: string;
  done: boolean;
};

export const createTodoSchema = z.object({
  id: z.string(),
  title: z.string(),
});
type CreateTodo = z.infer<typeof createTodoSchema>;

export const createTodo = (
  tx: Transaction,
  userId: string,
  input: CreateTodo,
) => {
  return tx.insert(todosTable).values({
    ...input,
    done: false,
    userId,
  });
};

export const deleteTodoSchema = z.object({ id: z.string() });

export type DeleteTodo = z.infer<typeof deleteTodoSchema>;

export const incrementVersion = () => sql`${todosTable.version} + 1`;

export const deleteTodo = (
  tx: Transaction,
  userId: string,
  input: DeleteTodo,
) => {
  return tx
    .update(todosTable)
    .set({
      deletedAt: new Date(),
      version: incrementVersion(),
    })
    .where(and(eq(todosTable.userId, userId), eq(todosTable.id, input.id)));
};

export const checkTodoSchema = z.object({ id: z.string() });
export type CheckTodo = z.infer<typeof checkTodoSchema>;

export const checkTodo = (
  tx: Transaction,
  userId: string,
  input: CheckTodo,
) => {
  return tx
    .update(todosTable)
    .set({ done: true, version: incrementVersion() })
    .where(and(eq(todosTable.userId, userId), eq(todosTable.id, input.id)));
};

export const uncheckTodoSchema = z.object({ id: z.string() });
export type UncheckTodo = z.infer<typeof uncheckTodoSchema>;

export const uncheckTodo = (
  tx: Transaction,
  userId: string,
  input: UncheckTodo,
) => {
  return tx
    .update(todosTable)
    .set({ done: false, version: incrementVersion() })
    .where(and(eq(todosTable.userId, userId), eq(todosTable.id, input.id)));
};

export const getTodosVersion = async (
  tx: Transaction,
  userId: string,
): Promise<VersionSearchResult[]> => {
  const results = await tx
    .select()
    .from(todosTable)
    .where(and(eq(todosTable.userId, userId), isNull(todosTable.deletedAt)));

  return results.map((result) => ({
    id: result.id,
    version: result.version,
  }));
};

export const getTodos = async (
  tx: Transaction,
  ids: string[],
): Promise<Todo[]> => {
  if (ids.length === 0) return [];
  const results = await tx
    .select()
    .from(todosTable)
    .where(inArray(todosTable.id, ids));

  return results.map((result) => ({
    id: result.id,
    title: result.title,
    done: result.done,
  }));
};
