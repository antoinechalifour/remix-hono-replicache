import { ReadTransaction, WriteTransaction } from "replicache";
import { raise } from "../utils";

export type Todo = {
  id: string;
  title: string;
  done: boolean;
};
export const getTodo = async (
  tx: WriteTransaction,
  id: string,
): Promise<Todo> => {
  const todo = await tx.get<Todo>(`todos/${id}`);
  return todo ?? raise(`Todo not found ${id}`);
};

export const saveTodo = async (tx: WriteTransaction, todo: Todo) => {
  await tx.set(`todos/${todo.id}`, todo);
};

export const deleteTodo = async (tx: WriteTransaction, id: string) => {
  return tx.del(`todos/${id}`);
};

export const getTodos = (tx: ReadTransaction) =>
  tx.scan<Todo>({ prefix: "todos/" }).values().toArray();
