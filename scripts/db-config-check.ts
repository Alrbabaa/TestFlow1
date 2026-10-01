import { resolveDatabaseConfiguration } from '../src/db/config.ts';

const originalEnvironment = { ...process.env };
const assert = (condition: boolean, message: string) => {
  if (!condition) throw new Error(message);
};
const resetEnvironment = () => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnvironment)) delete process.env[key];
  }
  Object.assign(process.env, originalEnvironment);
};

try {
  for (const key of [
    'DATABASE_URL', 'CLOUD_SQL_CONNECTION_NAME', 'CLOUD_SQL_MODE', 'SQL_HOST',
    'SQL_PORT', 'SQL_USER', 'SQL_PASSWORD', 'SQL_DB_NAME', 'SQL_SSL_MODE',
    'DATABASE_SSL_MODE', 'DATABASE_SSL_CA',
  ]) delete process.env[key];

  process.env.NODE_ENV = 'production';
  process.env.CLOUD_SQL_MODE = 'auth-proxy';
  process.env.CLOUD_SQL_CONNECTION_NAME = 'project:region:instance';
  delete process.env.SQL_HOST;
  process.env.SQL_USER = 'placeholder-user';
  process.env.SQL_PASSWORD = 'placeholder-password';
  process.env.SQL_DB_NAME = 'placeholder-db';
  process.env.SQL_SSL_MODE = 'disable';
  const proxy = resolveDatabaseConfiguration();
  assert(!proxy.error && proxy.poolConfig?.host === '/cloudsql/project:region:instance', 'Cloud Run Unix socket configuration should be accepted.');

  process.env.SQL_HOST = '/cloudsql/project:region:instance';
  const explicitSocket = resolveDatabaseConfiguration();
  assert(!explicitSocket.error && explicitSocket.poolConfig?.host === '/cloudsql/project:region:instance', 'Explicit Cloud Run Unix socket configuration should be accepted.');

  process.env.CLOUD_SQL_MODE = 'private-ip';
  process.env.SQL_HOST = '10.20.30.40';
  process.env.SQL_SSL_MODE = 'verify-ca';
  process.env.DATABASE_SSL_CA = 'placeholder-ca';
  const privateIp = resolveDatabaseConfiguration();
  assert(!privateIp.error, 'Private IP with CA-verified TLS should be accepted.');

  process.env.CLOUD_SQL_MODE = 'auth-proxy';
  process.env.SQL_SSL_MODE = 'disable';
  process.env.SQL_HOST = '127.0.0.1';
  const loopback = resolveDatabaseConfiguration();
  assert(Boolean(loopback.error), 'Production loopback should be rejected.');

  process.env.CLOUD_SQL_MODE = 'private-ip';
  process.env.SQL_HOST = '10.20.30.40';
  process.env.SQL_SSL_MODE = 'disable';
  const insecureDirect = resolveDatabaseConfiguration();
  assert(Boolean(insecureDirect.error), 'Direct production Cloud SQL without TLS should be rejected.');

  console.log('Cloud SQL config modes: OK');
  console.log('Production loopback/TLS guards: OK');
} finally {
  resetEnvironment();
}
