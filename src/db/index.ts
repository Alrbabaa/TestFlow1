import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';
import { resolveDatabaseConfiguration, safeErrorDetails } from './config.ts';

const databaseConfiguration = resolveDatabaseConfiguration();

// Add global connection pool caching to persist across hot-reloads
declare global {
  var _postgresPool: Pool | undefined;
}

// Function to create or retrieve the connection pool.
export const createPool = () => {
  if (!global._postgresPool) {
    global._postgresPool = new Pool(databaseConfiguration.poolConfig || {
      max: 1,
      connectionTimeoutMillis: 1000,
    });

    // Prevent unhandled pool-level errors from crashing the application
    global._postgresPool.on('error', (err) => {
      console.error('Unexpected Cloud SQL pool error.', safeErrorDetails(err));
    });
  }
  return global._postgresPool;
};

// Create or retrieve the pool instance.
const pool = createPool();

// Initialize Drizzle with the pool and schema.
export const db = drizzle(pool, { schema });

export async function checkDatabaseHealth(): Promise<{
  status: 'ok' | 'unavailable' | 'misconfigured';
  latencyMs?: number;
}> {
  if (databaseConfiguration.error || !databaseConfiguration.poolConfig) {
    return { status: 'misconfigured' };
  }

  const startedAt = Date.now();
  try {
    await pool.query('select 1');
    return { status: 'ok', latencyMs: Date.now() - startedAt };
  } catch {
    return { status: 'unavailable' };
  }
}
