import path from 'path';
import { createRequire } from 'module';
import { createPlatformStore } from '../src/server/platformStore';

type SqliteDatabase = import('better-sqlite3').Database;

async function main() {
  // Ensure migrations + seed are applied before inspection.
  await createPlatformStore();

  const require = createRequire(path.join(process.cwd(), 'server.ts'));
  const Database = require('better-sqlite3') as new (filename: string) => SqliteDatabase;

  const dbPath =
    process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'bosch-ecall-platform.sqlite');

  const db = new Database(dbPath);
  const objects = db
    .prepare(
      "SELECT name, type, sql FROM sqlite_master WHERE type IN ('table','index') AND name NOT LIKE 'sqlite_%' ORDER BY type, name",
    )
    .all() as Array<{ name: string; type: string; sql: string }>;

  console.log(JSON.stringify({ dbPath, objectCount: objects.length, objects }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

