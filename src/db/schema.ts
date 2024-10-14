import {
  boolean,
  integer,
  jsonb,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const usersTable = pgTable("users", {
  id: uuid().primaryKey(),
  name: varchar({ length: 255 }).notNull(),
  age: integer().notNull(),
  email: varchar({ length: 255 }).notNull().unique(),
});

export const notesTable = pgTable("notes", {
  id: uuid().primaryKey(),
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  title: varchar({ length: 255 }).notNull(),
  content: jsonb().notNull(),
  createdAt: timestamp().notNull(),
  updatedAt: timestamp().notNull(),
  deletedAt: timestamp(),
  version: integer().default(1).notNull(),
});

export const replicacheClientGroupsTable = pgTable("replicache_client_groups", {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  userId: uuid()
    .references(() => usersTable.id, { onDelete: "cascade" })
    .notNull(),
  cvrVersion: integer().notNull(),
  updatedAt: timestamp().notNull(),
});

export const replicacheClientsTable = pgTable("replicache_client", {
  id: varchar({ length: 36 }).primaryKey().notNull(),
  clientGroupId: varchar({ length: 36 })
    .references(() => replicacheClientGroupsTable.id, { onDelete: "cascade" })
    .notNull(),
  lastMutationId: integer().notNull(),
  updatedAt: timestamp().notNull(),
});
