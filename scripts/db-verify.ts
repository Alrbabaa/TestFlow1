import 'dotenv/config';
import { createPool } from '../src/db/index.ts';
import { resolveDatabaseConfiguration } from '../src/db/config.ts';

const requiredTables = [
  'users',
  'developers',
  'apps',
  'campaigns',
  'applications',
  'campaign_rewards',
  'feedbacks',
  'bug_reports',
  'db_smoke_checks',
];

const configuration = resolveDatabaseConfiguration();
if (configuration.error || !configuration.poolConfig) {
  console.error('Database connection: FAILED');
  console.error('Cloud SQL readiness: FAILED (database configuration is missing or invalid)');
  process.exit(1);
}

const pool = createPool();
try {
  await pool.query('SELECT 1');
  console.log('Database connection: OK');

  const result = await pool.query<{ table_name: string }>(
    `SELECT table_name
     FROM information_schema.tables
     WHERE table_schema = current_schema()
       AND table_type = 'BASE TABLE'
       AND table_name = ANY($1::text[])`,
    [requiredTables]
  );
  const found = new Set(result.rows.map((row) => row.table_name));
  const missing = requiredTables.filter((table) => !found.has(table));
  if (missing.length) {
    console.error('Required tables: FAILED');
    console.error(`Missing tables: ${missing.join(', ')}`);
    console.error('Cloud SQL readiness: FAILED');
    process.exitCode = 1;
  } else {
    console.log('Required tables: OK');
    console.log('Cloud SQL readiness: OK');
  }
} catch {
  console.error('Database connection: FAILED');
  console.error('Required tables: NOT CHECKED');
  console.error('Cloud SQL readiness: FAILED');
  process.exitCode = 1;
} finally {
  await pool.end();
}
