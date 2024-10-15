import { and, eq } from "drizzle-orm";
import {
  replicacheClientGroupsTable,
  replicacheClientsTable,
} from "./db/schema.js";
import { Transaction, VersionSearchResult } from "./db.utils.js";
import {
  ReplicacheClient,
  ReplicacheClientGroup,
  ReplicacheCVR,
} from "./replicache.types.js";

export const getClientGroup = async (
  tx: Transaction,
  clientGroupID: string,
  userID: string,
): Promise<ReplicacheClientGroup> => {
  const [clientGroup] = await tx
    .select()
    .from(replicacheClientGroupsTable)
    .where(and(eq(replicacheClientGroupsTable.id, clientGroupID)))
    .limit(1);

  if (clientGroup == null)
    return {
      id: clientGroupID,
      userID,
      cvrVersion: 0,
    };

  return {
    id: clientGroup.id,
    userID: clientGroup.userId,
    cvrVersion: clientGroup.cvrVersion,
  };
};

export const getClient = async (
  tx: Transaction,
  clientId: string,
  clientGroupId: string,
): Promise<ReplicacheClient> => {
  const [client] = await tx
    .select()
    .from(replicacheClientsTable)
    .where(and(eq(replicacheClientsTable.id, clientId)))
    .limit(1);

  if (client == null)
    return {
      id: clientId,
      clientGroupID: clientGroupId,
      lastMutationID: 0,
    };

  return {
    id: client.id,
    clientGroupID: client.clientGroupId,
    lastMutationID: client.lastMutationId,
  };
};

export const getClientVersionOfClientGroup = async (
  tx: Transaction,
  clientGroupID: string,
): Promise<VersionSearchResult[]> => {
  const results = await tx
    .select()
    .from(replicacheClientsTable)
    .where(eq(replicacheClientsTable.clientGroupId, clientGroupID));

  return results.map((result) => ({
    id: result.id,
    version: result.lastMutationId,
  }));
};

export const saveClientGroup = (
  tx: Transaction,
  clientGroup: ReplicacheClientGroup,
) => {
  return tx
    .insert(replicacheClientGroupsTable)
    .values({
      id: clientGroup.id,
      userId: clientGroup.userID,
      cvrVersion: clientGroup.cvrVersion,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [replicacheClientGroupsTable.id],
      set: {
        userId: clientGroup.userID,
        cvrVersion: clientGroup.cvrVersion,
        updatedAt: new Date(),
      },
    });
};

export const saveClient = (tx: Transaction, client: ReplicacheClient) => {
  return tx
    .insert(replicacheClientsTable)
    .values({
      id: client.id,
      clientGroupId: client.clientGroupID,
      lastMutationId: client.lastMutationID,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [replicacheClientsTable.id],
      set: {
        lastMutationId: client.lastMutationID,
        updatedAt: new Date(),
      },
    });
};

const cvrCache = new Map<string, ReplicacheCVR>();

export const getCvr = async (
  cvrId: string,
): Promise<ReplicacheCVR | undefined> => {
  return cvrCache.get(cvrId);
};

export const saveCvr = async (id: string, cvr: ReplicacheCVR) => {
  cvrCache.set(id, cvr);
};
