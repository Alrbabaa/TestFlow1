import type { PoolConfig } from 'pg';

export interface DatabaseConfiguration {
  poolConfig: PoolConfig | null;
  sslMode: 'disable' | 'require' | 'verify-ca' | 'verify-full' | null;
  cloudSqlMode: 'auth-proxy' | 'private-ip' | 'public-ssl' | null;
  error: string | null;
}

const SSL_MODES = new Set(['disable', 'require', 'verify-ca', 'verify-full']);

export function safeDatabaseErrorCode(error: unknown): string {
  let current: unknown = error;
  for (let depth = 0; depth < 3 && current && typeof current === 'object'; depth++) {
    const candidate = current as { code?: unknown; cause?: unknown };
    if (typeof candidate.code === 'string' && /^[A-Z0-9_]{2,16}$/.test(candidate.code)) {
      return candidate.code;
    }
    current = candidate.cause;
  }
  return 'unclassified';
}

export function resolveDatabaseConfiguration(): DatabaseConfiguration {
  const connectionString = process.env.DATABASE_URL?.trim();
  const isProduction = process.env.NODE_ENV === 'production';
  const cloudSqlModeValue = process.env.CLOUD_SQL_MODE?.trim().toLowerCase() || null;
  const cloudSqlConnectionName = process.env.CLOUD_SQL_CONNECTION_NAME?.trim() || null;

  if (cloudSqlModeValue && !['auth-proxy', 'private-ip', 'public-ssl'].includes(cloudSqlModeValue)) {
    return { poolConfig: null, sslMode: null, cloudSqlMode: null, error: 'CLOUD_SQL_MODE must be auth-proxy, private-ip, or public-ssl.' };
  }
  const cloudSqlMode = cloudSqlModeValue as DatabaseConfiguration['cloudSqlMode'];
  if (cloudSqlConnectionName && !/^[^:\s]+:[^:\s]+:[^:\s]+$/.test(cloudSqlConnectionName)) {
    return { poolConfig: null, sslMode: null, cloudSqlMode, error: 'CLOUD_SQL_CONNECTION_NAME must use PROJECT_ID:REGION:INSTANCE_NAME format.' };
  }
  if (cloudSqlMode === 'auth-proxy' && !cloudSqlConnectionName) {
    return { poolConfig: null, sslMode: null, cloudSqlMode, error: 'CLOUD_SQL_CONNECTION_NAME is required in auth-proxy mode.' };
  }
  if (isProduction && !cloudSqlMode) {
    return { poolConfig: null, sslMode: null, cloudSqlMode, error: 'Set CLOUD_SQL_MODE to auth-proxy, private-ip, or public-ssl in production.' };
  }

  let parsedUrl: URL | null = null;

  if (connectionString) {
    try {
      parsedUrl = new URL(connectionString);
    } catch {
      return { poolConfig: null, sslMode: null, cloudSqlMode, error: 'DATABASE_URL is not a valid URL.' };
    }
    if (!['postgres:', 'postgresql:'].includes(parsedUrl.protocol)) {
      return { poolConfig: null, sslMode: null, cloudSqlMode, error: 'DATABASE_URL must use PostgreSQL.' };
    }
  }

  const sslModeValue = (process.env.SQL_SSL_MODE || process.env.DATABASE_SSL_MODE)?.trim().toLowerCase() ||
    parsedUrl?.searchParams.get('sslmode') ||
    (cloudSqlMode === 'auth-proxy' ? 'disable' : isProduction ? 'verify-ca' : 'disable');

  if (!SSL_MODES.has(sslModeValue)) {
    return {
      poolConfig: null,
      sslMode: null,
      cloudSqlMode,
      error: 'DATABASE_SSL_MODE must be disable, require, verify-ca, or verify-full.',
    };
  }

  if (isProduction && sslModeValue === 'disable' && cloudSqlMode !== 'auth-proxy') {
    return { poolConfig: null, sslMode: 'disable', cloudSqlMode, error: 'PostgreSQL TLS is required in production unless using the Cloud SQL Auth Proxy.' };
  }
  if (cloudSqlMode === 'auth-proxy' && sslModeValue !== 'disable') {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'Auth Proxy mode terminates TLS; set SQL_SSL_MODE=disable for the Cloud Run Unix socket or local proxy hop.' };
  }
  if ((cloudSqlMode === 'private-ip' || cloudSqlMode === 'public-ssl') && sslModeValue === 'disable') {
    return { poolConfig: null, sslMode: 'disable', cloudSqlMode, error: 'Direct Cloud SQL connections require TLS.' };
  }
  if (isProduction && (cloudSqlMode === 'private-ip' || cloudSqlMode === 'public-ssl') &&
      !['verify-ca', 'verify-full'].includes(sslModeValue)) {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'Direct Cloud SQL production connections require verify-ca or verify-full.' };
  }
  if ((sslModeValue === 'verify-ca' || sslModeValue === 'verify-full') && !process.env.DATABASE_SSL_CA) {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'DATABASE_SSL_CA must contain the trusted Cloud SQL server CA certificate.' };
  }

  const ssl = sslModeValue === 'disable'
    ? false
    : {
        rejectUnauthorized: true,
        ...(process.env.DATABASE_SSL_CA ? { ca: process.env.DATABASE_SSL_CA } : {}),
      };

  if (parsedUrl) {
    if (!parsedUrl.hostname || !parsedUrl.pathname || parsedUrl.pathname === '/') {
      return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'DATABASE_URL must include a host and database name.' };
    }
    if (!parsedUrl.username || !parsedUrl.password) {
      return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'DATABASE_URL must include a username and password.' };
    }
    if (isProduction && ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname)) {
      return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'Loopback DATABASE_URL is not allowed in production; use the Auth Proxy sidecar host.' };
    }
    if (cloudSqlMode === 'private-ip' && !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(parsedUrl.hostname)) {
      return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'private-ip mode requires a private IPv4 database host.' };
    }
    return {
      poolConfig: {
        connectionString,
        ssl,
        max: Number(process.env.SQL_POOL_MAX || 10),
        connectionTimeoutMillis: Number(process.env.SQL_CONNECT_TIMEOUT_MS || 5000),
        idleTimeoutMillis: Number(process.env.SQL_IDLE_TIMEOUT_MS || 30000),
      },
      sslMode: sslModeValue as DatabaseConfiguration['sslMode'],
      cloudSqlMode,
      error: null,
    };
  }

  const missing = [
    ...(cloudSqlMode === 'auth-proxy' ? [] : [['SQL_HOST', process.env.SQL_HOST]]),
    ['SQL_USER', process.env.SQL_USER],
    ['SQL_PASSWORD', process.env.SQL_PASSWORD],
    ['SQL_DB_NAME', process.env.SQL_DB_NAME],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length) {
    return {
      poolConfig: null,
      sslMode: sslModeValue as DatabaseConfiguration['sslMode'],
      cloudSqlMode,
      error: `Missing PostgreSQL configuration: ${missing.join(', ')}.`,
    };
  }

  // Cloud Run mounts an attached Cloud SQL instance as a Unix socket. `pg`
  // connects to that socket when its host is the socket directory, so no
  // localhost listener or standalone Cloud SQL Auth Proxy process is needed.
  // An explicit SQL_HOST is still supported for local proxy development and
  // other private proxy sidecars.
  const cloudRunSocketHost = cloudSqlMode === 'auth-proxy' && cloudSqlConnectionName
    ? `/cloudsql/${cloudSqlConnectionName}`
    : undefined;
  const defaultProxyHost = cloudRunSocketHost || (cloudSqlMode === 'auth-proxy' ? '127.0.0.1' : undefined);
  const port = Number(process.env.SQL_PORT || (cloudSqlMode === 'auth-proxy' ? 5432 : 5432));
  const host = process.env.SQL_HOST || defaultProxyHost;
  if (!host) {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'SQL_HOST is required for direct Cloud SQL connections.' };
  }
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'SQL_PORT must be between 1 and 65535.' };
  }
  if (isProduction && ['localhost', '127.0.0.1', '::1'].includes(host)) {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'Loopback SQL_HOST is not allowed in production; use the Cloud Run Unix socket or a private Auth Proxy host.' };
  }
  if (cloudSqlMode === 'private-ip' && !/^(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(host)) {
    return { poolConfig: null, sslMode: sslModeValue as DatabaseConfiguration['sslMode'], cloudSqlMode, error: 'private-ip mode requires a private IPv4 SQL_HOST.' };
  }

  return {
    poolConfig: {
      host,
      port,
      user: process.env.SQL_USER,
      password: process.env.SQL_PASSWORD,
      database: process.env.SQL_DB_NAME,
      ssl,
      max: Number(process.env.SQL_POOL_MAX || 10),
      connectionTimeoutMillis: Number(process.env.SQL_CONNECT_TIMEOUT_MS || 5000),
      idleTimeoutMillis: Number(process.env.SQL_IDLE_TIMEOUT_MS || 30000),
    },
    sslMode: sslModeValue as DatabaseConfiguration['sslMode'],
    cloudSqlMode,
    error: null,
  };
}

export function getDrizzleDatabaseCredentials() {
  const configuration = resolveDatabaseConfiguration();
  if (configuration.error || !configuration.poolConfig) {
    throw new Error(configuration.error || 'PostgreSQL is not configured.');
  }

  const poolConfig = configuration.poolConfig;
  if (poolConfig.connectionString) {
    return { url: poolConfig.connectionString, ssl: poolConfig.ssl };
  }
  return {
    host: poolConfig.host!,
    port: poolConfig.port,
    user: poolConfig.user,
    password: typeof poolConfig.password === 'string' ? poolConfig.password : undefined,
    database: poolConfig.database!,
    ssl: poolConfig.ssl,
  };
}
