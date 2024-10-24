import { JSONContent } from "@tiptap/react";
import { Replicache, WriteTransaction } from "replicache";
import { getNote, saveNote } from "./model/Note";

export const MUTATORS = {
  async createNote(tx: WriteTransaction, input: { id: string; title: string }) {
    const now = new Date().toISOString();
    await saveNote(tx, {
      id: input.id,
      title: input.title,
      createdAt: now,
      updatedAt: now,
      previewContent: "",
      content: { type: "doc", content: [{ type: "paragraph" }] },
    });
  },
  async updateNote(
    tx: WriteTransaction,
    input: { id: string; title?: string; content?: JSONContent },
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
  fresh.getAuth = async () => {
    window.location.reload();
    return null;
  };
  cache.set(userId, fresh);
  return fresh;
};
