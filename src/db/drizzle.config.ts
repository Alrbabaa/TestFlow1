import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { getDrizzleDatabaseCredentials } from './config.ts';

dotenv.config();

const isGenerateCommand = process.argv.some((argument) => argument === 'generate');
const hasConnectionSettings = Boolean(process.env.DATABASE_URL || (
  process.env.SQL_HOST && process.env.SQL_USER && process.env.SQL_PASSWORD && process.env.SQL_DB_NAME
));
const dbCredentials = hasConnectionSettings
  ? getDrizzleDatabaseCredentials()
  : isGenerateCommand
    ? { host: 'cloud-sql-migration-generation.invalid', port: 5432, user: '', password: '', database: 'testflow' }
    : getDrizzleDatabaseCredentials();

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials,
  verbose: true,
});
