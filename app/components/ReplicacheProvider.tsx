import { createContext, PropsWithChildren, useContext, useMemo } from "react";
import { raise } from "../utils";
import { getReplicache, MUTATORS } from "../app-replicache";
import { Replicache } from "replicache";

const replicacheContext = createContext<Replicache<typeof MUTATORS> | null>(
  null,
);

export const useReplicache = () =>
  useContext(replicacheContext) ?? raise("Missing provider");

export const ReplicacheProvider = ({
  children,
  userId,
}: PropsWithChildren<{ userId: string }>) => {
  const replicache = useMemo(() => getReplicache(userId), [userId]);
  return (
    <replicacheContext.Provider value={replicache}>
      {children}
    </replicacheContext.Provider>
  );
};
