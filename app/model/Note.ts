import { JSONContent } from "@tiptap/react";
import { ReadTransaction, WriteTransaction } from "replicache";
import { raise } from "../utils";

export type Note = {
  id: string;
  title: string;
  content: JSONContent;
  createdAt: string;
  updatedAt: string;
};

export const saveNote = async (tx: WriteTransaction, note: Note) => {
  await tx.set(`notes/${note.id}`, note);
};

export const getNotes = (tx: ReadTransaction) =>
  tx.scan<Note>({ prefix: "notes/" }).values().toArray();

export const getNote = async (
  tx: ReadTransaction,
  id: string,
): Promise<Note> => {
  const note = await tx.get<Note>(`notes/${id}`);
  return (note as Note) ?? raise(`Note not found ${id}`);
};
