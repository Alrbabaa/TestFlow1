import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { createPool } from '../src/db/index.ts';
import { resolveDatabaseConfiguration } from '../src/db/config.ts';

const configuration = resolveDatabaseConfiguration();
if (configuration.error || !configuration.poolConfig) {
  console.error('Database smoke test: FAILED (database configuration is missing or invalid)');
  process.exit(1);
}

const pool = createPool();
const id = `smoke-${randomUUID()}`;
const payload = `testflow-cloud-sql-smoke-${randomUUID()}`;
let client;
let failed = false;

try {
  client = await pool.connect();
  await client.query('BEGIN');
  await client.query(
    'INSERT INTO db_smoke_checks (id, payload) VALUES ($1, $2)',
    [id, payload]
  );
  await client.query('COMMIT');

  const result = await client.query<{ payload: string }>(
    'SELECT payload FROM db_smoke_checks WHERE id = $1',
    [id]
  );
  if (result.rowCount !== 1 || result.rows[0]?.payload !== payload) {
    throw new Error('Smoke record did not round-trip.');
  }

  await client.query('DELETE FROM db_smoke_checks WHERE id = $1', [id]);
  const remaining = await client.query('SELECT 1 FROM db_smoke_checks WHERE id = $1', [id]);
  if (remaining.rowCount !== 0) throw new Error('Smoke record cleanup failed.');
  console.log('Database smoke test: OK (insert, read, delete)');
} catch {
  failed = true;
  console.error('Database smoke test: FAILED');
} finally {
  if (client) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // The transaction may already have committed or rolled back.
    }
    try {
      await client.query('DELETE FROM db_smoke_checks WHERE id = $1', [id]);
    } catch {
      failed = true;
      console.error('Database smoke test cleanup: FAILED');
    }
    client.release();
  }
  await pool.end();
}

if (failed) process.exitCode = 1;
