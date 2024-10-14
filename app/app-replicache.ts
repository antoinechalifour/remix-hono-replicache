import { Replicache, WriteTransaction } from "replicache";
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
