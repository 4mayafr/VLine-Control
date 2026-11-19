import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";
import { SCHEMA } from "./schema";
import { seedDatabase } from "./seed";

export type SqlValue = string | number | null | Uint8Array;

declare global {
  // eslint-disable-next-line no-var
  var __vlineDb: DatabaseSync | undefined;
}

function databaseFile(): string {
  const configured = process.env.DATABASE_FILE ?? "./data/vline.db";
  return path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);
}

function open(): DatabaseSync {
  const file = databaseFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec("PRAGMA busy_timeout = 5000;");

  const existing = db
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='settings'")
    .get();
  if (!existing) {
    db.exec(SCHEMA);
    seedDatabase(db);
  }
  return db;
}

/** Lazily opened, process-wide database handle. */
export function getDb(): DatabaseSync {
  if (!globalThis.__vlineDb) {
    globalThis.__vlineDb = open();
  }
  return globalThis.__vlineDb;
}

/**
 * Rows returned by node:sqlite have a null prototype, which React refuses to
 * serialise across the server/client boundary. Materialising them into plain
 * objects here keeps that detail inside the data layer.
 */
function toPlain<T>(row: unknown): T {
  return { ...(row as Record<string, unknown>) } as T;
}

export function all<T>(sql: string, params: SqlValue[] = []): T[] {
  const rows = getDb().prepare(sql).all(...params);
  return rows.map((row) => toPlain<T>(row));
}

export function one<T>(sql: string, params: SqlValue[] = []): T | null {
  const row = getDb().prepare(sql).get(...params);
  return row === undefined ? null : toPlain<T>(row);
}

export function run(
  sql: string,
  params: SqlValue[] = [],
): { changes: number; lastInsertRowid: number } {
  const result = getDb().prepare(sql).run(...params);
  return {
    changes: Number(result.changes),
    lastInsertRowid: Number(result.lastInsertRowid),
  };
}

export function transaction<T>(fn: () => T): T {
  const db = getDb();
  db.exec("BEGIN");
  try {
    const result = fn();
    db.exec("COMMIT");
    return result;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function resetDatabase(): void {
  if (globalThis.__vlineDb) {
    globalThis.__vlineDb.close();
    globalThis.__vlineDb = undefined;
  }
  const file = databaseFile();
  for (const suffix of ["", "-wal", "-shm"]) {
    const candidate = `${file}${suffix}`;
    if (fs.existsSync(candidate)) fs.rmSync(candidate);
  }
}
