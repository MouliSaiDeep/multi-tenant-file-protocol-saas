import type { Database } from "sqlite";

let dbInstance: Database | null = null;
let sqliteDriverModule: Promise<typeof import("sqlite3")> | null = null;
let sqliteModule: Promise<typeof import("sqlite")> | null = null;

async function getSqliteDriver() {
  if (!sqliteDriverModule) {
    sqliteDriverModule = import("sqlite3");
  }

  return sqliteDriverModule;
}

async function getSqliteModule() {
  if (!sqliteModule) {
    sqliteModule = import("sqlite");
  }

  return sqliteModule;
}

export async function getDb(): Promise<Database> {
  if (dbInstance) {
    return dbInstance;
  }

  const dbPath = process.env.DATABASE_PATH || "./db/prod.db";
  const [sqlite3, { open }] = await Promise.all([
    getSqliteDriver(),
    getSqliteModule(),
  ]);

  dbInstance = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });

  await dbInstance.exec("PRAGMA foreign_keys = ON;");
  return dbInstance;
}
