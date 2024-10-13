import { Replicache, TEST_LICENSE_KEY, WriteTransaction } from "replicache";
import { deleteTodo, getTodo, saveTodo } from "./model/Todo";

export const MUTATORS = {
  async create(tx: WriteTransaction, input: { id: string; title: string }) {
    await saveTodo(tx, {
      id: input.id,
      title: input.title,
      done: false,
    });
  },
  async delete(tx: WriteTransaction, input: { id: string }) {
    await deleteTodo(tx, input.id);
  },
  async check(tx: WriteTransaction, input: { id: string }) {
    const todo = await getTodo(tx, input.id);
    await saveTodo(tx, {
      ...todo,
      done: true,
    });
  },
  async uncheck(tx: WriteTransaction, input: { id: string }) {
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
    licenseKey: TEST_LICENSE_KEY,
    mutators: MUTATORS,
    pullURL: "/replicache/pull",
    pushURL: "/replicache/push",
  });
  cache.set(userId, fresh);
  return fresh;
};
