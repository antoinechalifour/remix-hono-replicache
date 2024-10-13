import { db } from "./drizzle.js";

export type Transaction = Parameters<
  Parameters<(typeof db)["transaction"]>[0]
>[0];

export type VersionSearchResult = {
  id: string;
  version: number;
};
