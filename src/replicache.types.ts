export type ReplicacheClientGroup = {
  id: string;
  userID: string;
  cvrVersion: number;
};

export type ReplicacheClient = {
  id: string;
  clientGroupID: string;
  lastMutationID: number;
};

export type ReplicacheCVREntries = Record<string, number>;

export type ReplicacheCVR = Record<string, ReplicacheCVREntries>;

export type ReplicacheCVREntryDiff = {
  puts: string[];
  dels: string[];
};
export type ReplicacheCVRDiff = Record<string, ReplicacheCVREntryDiff>;
