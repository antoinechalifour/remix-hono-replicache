import { JSONContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { notesTable } from "./db/schema.js";
import { Transaction, VersionSearchResult } from "./db.utils.js";

export const incrementVersion = () => sql`${notesTable.version} + 1`;

export type Note = {
  id: string;
  title: string;
  previewContent: string;
  content: JSONContent;
  createdAt: string;
  updatedAt: string;
};

export const createNoteSchema = z.object({
  id: z.string(),
  title: z.string(),
});
export type CreateNote = z.infer<typeof createNoteSchema>;

export const createNote = (
  tx: Transaction,
  userId: string,
  input: CreateNote,
) => {
  const now = new Date();
  return tx.insert(notesTable).values({
    id: input.id,
    userId,
    title: input.title,
    content: { type: "doc", content: [{ type: "paragraph" }] },
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    version: 1,
  });
};

export const updateNoteSchema = z.object({
  id: z.string(),
  title: z.string().optional(),
  content: z.any().optional(),
});

export type UpdateNote = z.infer<typeof updateNoteSchema>;

export const updateNote = (
  tx: Transaction,
  userId: string,
  input: UpdateNote,
) => {
  return tx
    .update(notesTable)
    .set({
      title: input.title,
      content: input.content,
      updatedAt: new Date(),
      version: incrementVersion(),
    })
    .where(and(eq(notesTable.userId, userId), eq(notesTable.id, input.id)));
};

export const getNotesVersion = async (
  tx: Transaction,
  userId: string,
): Promise<VersionSearchResult[]> => {
  const results = await tx
    .select()
    .from(notesTable)
    .where(and(eq(notesTable.userId, userId), isNull(notesTable.deletedAt)));

  return results.map((result) => ({
    id: result.id,
    version: result.version,
  }));
};

// Function to extract plain text from Tiptap JSON
const extractPlainTextFromJSON = (node: JSONContent): string => {
  if (node.type === "text") {
    return node.text || "";
  }

  if (node.content && Array.isArray(node.content)) {
    return node.content.map(extractPlainTextFromJSON).join("");
  }

  return "";
};

export const getNotes = async (
  tx: Transaction,
  ids: string[],
): Promise<Note[]> => {
  if (ids.length === 0) return [];
  const results = await tx
    .select()
    .from(notesTable)
    .where(inArray(notesTable.id, ids));

  return results.map((result) => {
    return {
      id: result.id,
      title: result.title,
      content: result.content as JSONContent,
      previewContent: extractPlainTextFromJSON(
        result.content as JSONContent,
      ).slice(0, 300),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.updatedAt.toISOString(),
    };
  });
};
