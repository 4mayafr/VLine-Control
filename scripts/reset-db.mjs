#!/usr/bin/env node
/**
 * Remove the local SQLite database so the next server start reseeds it.
 * Usage: npm run db:reset
 */
import fs from "node:fs";
import path from "node:path";

const configured = process.env.DATABASE_FILE ?? "./data/vline.db";
const file = path.isAbsolute(configured) ? configured : path.join(process.cwd(), configured);

let removed = 0;
for (const suffix of ["", "-wal", "-shm"]) {
  const candidate = `${file}${suffix}`;
  if (fs.existsSync(candidate)) {
    fs.rmSync(candidate);
    removed += 1;
  }
}

if (removed === 0) {
  console.log(`No database found at ${file}. Nothing to do.`);
} else {
  console.log(`Removed ${removed} database file(s) at ${file}. Restart the server to reseed.`);
}
