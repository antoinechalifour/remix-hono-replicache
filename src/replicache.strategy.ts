import { db } from "./drizzle.js";
import { z } from "zod";
import {
  getClient,
  getClientGroup,
  getClientVersionOfClientGroup,
  getCvr,
  saveClient,
  saveClientGroup,
  saveCvr,
} from "./replicache.db.js";
import { HTTPException } from "hono/http-exception";
import {
  checkTodo,
  checkTodoSchema,
  createTodo,
  createTodoSchema,
  deleteTodo,
  deleteTodoSchema,
  getTodos,
  getTodosVersion,
  uncheckTodo,
  uncheckTodoSchema,
} from "./todo.db..js";
import {
  ReplicacheCVR,
  ReplicacheCVRDiff,
  ReplicacheCVREntries,
} from "./replicache.types.js";
import { Transaction, VersionSearchResult } from "./db.utils.js";
import { PatchOperation, PullResponse } from "replicache";
import {
  createNote,
  createNoteSchema,
  getNotes,
  getNotesVersion,
  updateNote,
  updateNoteSchema,
} from "./notes.db.js";

const mutationSchema = z.object({
  id: z.number(),
  clientID: z.string(),
  name: z.string(),
  args: z.any(),
});

export type Mutation = z.infer<typeof mutationSchema>;

export const pushRequestSchema = z.object({
  clientGroupID: z.string(),
  mutations: z.array(mutationSchema),
});

const unauthorized = () => new HTTPException(401, { message: "Unauthorized" });

const processMutation = (
  mutation: Mutation,
  clientGroupID: string,
  userID: string,
  errorMode = false, // 1. let errorMode = false
) => {
  return db.transaction(
    // 2. Begin transaction
    async (tx) => {
      // 3. getClientGroup(body.clientGroupID), or default
      const clientGroup = await getClientGroup(tx, clientGroupID, userID);
      // 4. Verify requesting user owns specified client group.
      if (clientGroup.userID !== userID) throw unauthorized();
      // 5. getClient(mutation.clientID) or default
      const client = await getClient(tx, mutation.clientID, clientGroup.id);
      // 6. Verify requesting client group owns requested client
      if (client.clientGroupID !== clientGroupID) throw unauthorized();
      // 7. let nextMutationID = client.lastMutationID + 1
      const nextMutationID = client.lastMutationID + 1;

      // 8. Rollback transaction and skip mutation if already processed (mutation.id < nextMutationID)
      if (mutation.id < nextMutationID) return;
      // 9. Rollback transaction and error if mutation from future (mutation.id > nextMutationID)
      if (mutation.id > nextMutationID) tx.rollback();

      // 10. If errorMode != true then
      if (!errorMode) {
        try {
          await mutate(tx, userID, mutation);
        } catch (e) {
          console.error(
            `Could not process mutation ${mutation.name}`,
            mutation.args,
            e,
          );
          throw e;
        }
      }

      // 11. putClientGroup()
      await saveClientGroup(tx, {
        id: clientGroupID,
        userID,
        cvrVersion: clientGroup.cvrVersion,
      });

      // 12. saveClientGroup()
      await saveClient(tx, {
        id: mutation.clientID,
        clientGroupID: clientGroupID,
        lastMutationID: nextMutationID,
      });
    },
    {
      isolationLevel: "repeatable read",
    },
  );
};

export const mutate = (tx: Transaction, userID: string, mutation: Mutation) => {
  switch (mutation.name) {
    case "createNote":
      return createNote(tx, userID, createNoteSchema.parse(mutation.args));
    case "updateNote":
      return updateNote(tx, userID, updateNoteSchema.parse(mutation.args));
    case "createTodo":
      return createTodo(tx, userID, createTodoSchema.parse(mutation.args));
    case "deleteTodo":
      return deleteTodo(tx, userID, deleteTodoSchema.parse(mutation.args));
    case "checkTodo":
      return checkTodo(tx, userID, checkTodoSchema.parse(mutation.args));
    case "uncheckTodo":
      return uncheckTodo(tx, userID, uncheckTodoSchema.parse(mutation.args));
    default:
      console.error("Unhandled mutation", mutation);
      throw new HTTPException(400, { message: "Invalid mutation" });
  }
};

export type PushRequest = z.infer<typeof pushRequestSchema>;

export const push = async (userID: string, push: PushRequest) => {
  for (const mutation of push.mutations) {
    try {
      await processMutation(mutation, push.clientGroupID, userID);
    } catch (e) {
      await processMutation(mutation, push.clientGroupID, userID, true);
    }
  }
};

const cookie = z.object({
  order: z.number(),
  cvrID: z.string(),
});

type Cookie = z.infer<typeof cookie>;

export const pullRequestSchema = z.object({
  clientGroupID: z.string(),
  cookie: z.union([cookie, z.null()]),
});

export const cvrEntriesFromSearch = (result: VersionSearchResult[]) => {
  const r: ReplicacheCVREntries = {};
  for (const row of result) {
    r[row.id] = row.version;
  }
  return r;
};

export const diffCVR = (prev: ReplicacheCVR, next: ReplicacheCVR) => {
  const r: ReplicacheCVRDiff = {};
  const names = [...new Set([...Object.keys(prev), ...Object.keys(next)])];
  for (const name of names) {
    const prevEntries = prev[name] ?? {};
    const nextEntries = next[name] ?? {};
    r[name] = {
      puts: Object.keys(nextEntries).filter(
        (id) =>
          prevEntries[id] === undefined || prevEntries[id] < nextEntries[id],
      ),
      dels: Object.keys(prevEntries).filter(
        (id) => nextEntries[id] === undefined,
      ),
    };
  }
  return r;
};

export const isCVRDiffEmpty = (diff: ReplicacheCVRDiff) =>
  Object.values(diff).every((e) => e.puts.length === 0 && e.dels.length === 0);

export type PullRequest = z.infer<typeof pullRequestSchema>;

export const pull = async (
  userID: string,
  pull: PullRequest,
): Promise<PullResponse> => {
  console.log("------------------------------------------------------");
  console.log("PULL");
  // 1. let prevCVR = getCVR(body.cookie.cvrID)
  const prevCVR = pull.cookie ? await getCvr(pull.cookie.cvrID) : undefined;
  console.log("1 > prevCVR", prevCVR);
  // 2. let baseCVR = prevCVR or default
  const baseCVR: ReplicacheCVR = prevCVR ?? {};
  console.log("2 > baseCVR", baseCVR);

  console.log("3 > Begin transaction");
  // 3. Begin transaction
  const result = await db.transaction(
    async (tx) => {
      // 4. getClientGroup(body.clientGroupID), or default
      const clientGroup = await getClientGroup(tx, pull.clientGroupID, userID);
      console.log("4 > clientGroup", clientGroup);

      // 6. Read all id/version pairs from the database that should be in the client view. This query can be any arbitrary function of the DB, including read authorization, paging, etc.
      const [todosVersions, notesVersion] = await Promise.all([
        getTodosVersion(tx, userID),
        getNotesVersion(tx, userID),
      ]);
      console.log("6 > todosVersions", todosVersions);
      console.log("6 > notesVersion", notesVersion);

      // 7: Read all clients in the client group.
      const clientsVersions = await getClientVersionOfClientGroup(
        tx,
        pull.clientGroupID,
      );
      console.log("7 > clientsVersions", clientsVersions);

      // 8. Build nextCVR from entities and clients.
      const nextCVR: ReplicacheCVR = {
        todos: cvrEntriesFromSearch(todosVersions),
        notes: cvrEntriesFromSearch(notesVersion),
        clients: cvrEntriesFromSearch(clientsVersions),
      };
      console.log("8 > nextCVR", nextCVR);

      // 9. Calculate the difference between baseCVR and nextCVR
      const diff = diffCVR(baseCVR, nextCVR);
      console.log("9 > Diff", diff);

      // 10. If prevCVR was found and two CVRs are identical then exit this transaction and return a no-op PullResopnse to client:
      if (prevCVR && isCVRDiffEmpty(diff)) {
        console.log("10 > Empty diff", diff);
        return null;
      }

      // 11. Fetch all entities from database that are new or changed between baseCVR and nextCVR
      const [todos, notes] = await Promise.all([
        getTodos(tx, diff.todos.puts),
        getNotes(tx, diff.notes.puts),
      ]);
      console.log("11 > Todos", todos);
      console.log("11 > Notes", notes);

      // 12. let clientChanges = clients that are new or changed since baseCVR
      const clients: ReplicacheCVREntries = {};
      for (const clientID of diff.clients.puts) {
        clients[clientID] = nextCVR.clients[clientID];
      }
      console.log("12 > clients", clients);

      // 13. let nextCVRVersion = Math.max(pull.cookie?.order ?? 0, clientGroup.cvrVersion) + 1
      const baseCVRVersion = pull.cookie?.order ?? 0;
      const nextCVRVersion =
        Math.max(baseCVRVersion, clientGroup.cvrVersion) + 1;
      console.log(
        "13 > base / next cvr version",
        baseCVRVersion,
        nextCVRVersion,
      );

      // 14. putClientGroup():
      await saveClientGroup(tx, {
        ...clientGroup,
        cvrVersion: nextCVRVersion,
      });
      console.log("14 > Saved client group");

      return {
        entities: {
          todos: { dels: diff.todos.dels, puts: todos },
          notes: { dels: diff.notes.dels, puts: notes },
        },
        clients,
        nextCVR,
        nextCVRVersion,
      };
    },
    {
      isolationLevel: "repeatable read",
    },
  ); // 15. Commit
  console.log("15 > Transaction commited");

  if (result === null) {
    return {
      cookie: pull.cookie,
      lastMutationIDChanges: {},
      patch: [],
    };
  }

  const { entities, clients, nextCVR, nextCVRVersion } = result;

  // 16. let nextCVRID = randomID()
  const cvrID = crypto.randomUUID();

  // 17. putCVR(nextCVR)
  await saveCvr(cvrID, nextCVR);
  console.log("17 > Updated cvr", nextCVR);

  /* 18.
  Create a PullResponse with:
    A patch with:
      op:clear if prevCVR === undefined
      op:put for every created or changed entity
      op:del for every deleted entity
    {order: nextCVRVersion, cvrID} as the cookie.
    lastMutationIDChanges with entries for every client that has changed.
   */
  const patch: PatchOperation[] = [];
  if (prevCVR === undefined) patch.push({ op: "clear" });

  for (const [name, { puts, dels }] of Object.entries(entities)) {
    for (const id of dels) {
      patch.push({ op: "del", key: `${name}/${id}` });
    }
    for (const entity of puts) {
      patch.push({
        op: "put",
        key: `${name}/${entity.id}`,
        value: entity,
      });
    }
  }

  const cookie: Cookie = {
    order: nextCVRVersion,
    cvrID,
  };

  const lastMutationIDChanges = clients;

  console.log("------------------------------------------------------");

  return {
    cookie,
    lastMutationIDChanges,
    patch,
  };
};
