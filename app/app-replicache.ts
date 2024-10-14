import { Replicache, TEST_LICENSE_KEY, WriteTransaction } from "replicache";
import { deleteTodo, getTodo, saveTodo } from "./model/Todo";
import { getNote, saveNote } from "./model/Note";

export const MUTATORS = {
  async createNote(tx: WriteTransaction, input: { id: string; title: string }) {
    await saveNote(tx, {
      id: input.id,
      title: input.title,
      createdAt: new Date().toISOString(),
      content: { type: "doc", content: [{ type: "paragraph" }] },
    });
  },
  async updateNote(
    tx: WriteTransaction,
    input: { id: string; title?: string; content?: any },
  ) {
    const note = await getNote(tx, input.id);
    await saveNote(tx, {
      ...note,
      ...input,
    });
  },
  async createTodo(tx: WriteTransaction, input: { id: string; title: string }) {
    await saveTodo(tx, {
      id: input.id,
      title: input.title,
      done: false,
    });
  },
  async deleteTodo(tx: WriteTransaction, input: { id: string }) {
    await deleteTodo(tx, input.id);
  },
  async checkTodo(tx: WriteTransaction, input: { id: string }) {
    const todo = await getTodo(tx, input.id);
    await saveTodo(tx, {
      ...todo,
      done: true,
    });
  },
  async uncheckTodo(tx: WriteTransaction, input: { id: string }) {
    const todo = await getTodo(tx, input.id);
    await saveTodo(tx, {
      ...todo,
      done: false,
    });
  },
};
const cache = new Map<string, Replicache<typeof MUTATORS>>();

export const getReplicache = (userId: string) => {
  const fromCache = cache.get(userId);
  if (fromCache != null) return fromCache;
  const fresh = new Replicache({
    name: userId,
    licenseKey: import.meta.env.VITE_REPLICACHE_KEY,
    mutators: MUTATORS,
    pullURL: "/replicache/pull",
    pushURL: "/replicache/push",
  });
  cache.set(userId, fresh);
  return fresh;
};
