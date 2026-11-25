import type { DatabaseAdapter } from "./interface";
import { LocalJsonDatabase } from "./local";
import { PostgresDatabase } from "./postgres";

declare global {
  // eslint-disable-next-line no-var
  var __ayamBakarDb: DatabaseAdapter | undefined;
}

export function getDbMode(): "postgres" | "local" {
  return process.env.DATABASE_URL ? "postgres" : "local";
}

export function getDb(): DatabaseAdapter {
  let db = globalThis.__ayamBakarDb as
    | (DatabaseAdapter & { adapterVersion?: number })
    | undefined;
  if (!db || db.adapterVersion !== 6) {
    const dbUrl = process.env.DATABASE_URL;
    db = dbUrl ? new PostgresDatabase(dbUrl) : new LocalJsonDatabase();
    globalThis.__ayamBakarDb = db;
  }
  return db;
}
