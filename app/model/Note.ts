import { JSONContent } from "@tiptap/react";
import { DateTime } from "luxon";
import { ReadTransaction, WriteTransaction } from "replicache";
import { raise } from "../utils";

export type Note = {
  id: string;
  title: string;
  previewContent: string;
  content: JSONContent;
  createdAt: string;
  updatedAt: string;
};

export const saveNote = async (tx: WriteTransaction, note: Note) => {
  await tx.set(`notes/${note.id}`, note);
};

export const getNotes = async (tx: ReadTransaction): Promise<Note[]> => {
  const notes = await tx.scan<Note>({ prefix: "notes/" }).values().toArray();
  return (notes as Note[]).sort(
    (a, b) =>
      DateTime.fromISO(b.createdAt).valueOf() -
      DateTime.fromISO(a.createdAt).valueOf(),
  );
};

export const getNoteOrNull = async (
  tx: ReadTransaction,
  id: string,
): Promise<Note | null> => {
  const note = await tx.get<Note>(`notes/${id}`);
  return (note as Note) ?? null;
};

export const getNote = async (
  tx: ReadTransaction,
  id: string,
): Promise<Note> => {
  const note = await getNoteOrNull(tx, id);
  return (note as Note) ?? raise(`Note not found ${id}`);
};
