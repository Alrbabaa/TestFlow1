# Google Cloud SQL for TestFlow

TestFlow uses PostgreSQL through Drizzle and `pg`. Production database support is Google Cloud SQL for PostgreSQL only. Never put connection credentials in source control, frontend variables, logs, or screenshots.

## Cloud Run native Cloud SQL connection

For Cloud Run, use `CLOUD_SQL_MODE=auth-proxy`. When the Cloud SQL instance is attached to the Cloud Run service, Cloud Run supplies a private Unix socket at `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME`. TestFlow passes that path to `pg` as `host`; this is the native Cloud Run connection path and does not expose port 5432, use a public IP, or require a manually started Cloud SQL Auth Proxy.

Set `SQL_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME` explicitly. If it is omitted, TestFlow derives that exact socket path from `CLOUD_SQL_CONNECTION_NAME` in `auth-proxy` mode. `SQL_SSL_MODE=disable` is correct for this local Unix-socket hop because Cloud Run's managed Cloud SQL connector handles the authenticated, encrypted connection to Cloud SQL.

`CLOUD_SQL_CONNECTION_NAME` has the format `PROJECT_ID:REGION:INSTANCE_NAME`. It is required in `auth-proxy` mode. It is not a credential, but keep it in server-side configuration; it is never sent to the browser.

For Cloud Run, use the discrete PostgreSQL settings: `SQL_USER`, `SQL_PASSWORD`, and `SQL_DB_NAME`, plus the Unix-socket `SQL_HOST` above. `SQL_PORT` defaults to 5432 and may remain set to 5432. Do not use `DATABASE_URL` for this deployment model. Production requires an explicit `CLOUD_SQL_MODE` and rejects loopback database URLs/hosts.

The pool reads these settings only in the server process. Use Secret Manager or the deployment environment's secret store for `DATABASE_URL`/`SQL_PASSWORD`, and set `ADMIN_UIDS` to a comma-separated list of approved Firebase Auth UIDs. Do not configure any of these with a `VITE_` prefix.

## Cloud Run deployment configuration

1. Enable the Cloud SQL Admin API in the Google Cloud project.
2. Create a dedicated Cloud Run runtime service account and grant it `Cloud SQL Client` (`roles/cloudsql.client`) on the project or the specific Cloud SQL instance.
3. In Cloud Run, deploy or edit the TestFlow service. Under **Connections**, add the Cloud SQL instance using its instance connection name. This makes the `/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME` socket available to each revision.
4. Set non-secret environment variables on the Cloud Run service:

   ```text
   NODE_ENV=production
   CLOUD_SQL_MODE=auth-proxy
   CLOUD_SQL_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME
   SQL_HOST=/cloudsql/PROJECT_ID:REGION:INSTANCE_NAME
   SQL_PORT=5432
   SQL_SSL_MODE=disable
   SQL_POOL_MAX=10
   SQL_CONNECT_TIMEOUT_MS=5000
   SQL_IDLE_TIMEOUT_MS=30000
   ```

5. Store `SQL_USER`, `SQL_PASSWORD`, `SQL_DB_NAME`, and `ADMIN_UIDS` in Secret Manager, and inject the latest secret versions into the Cloud Run service as environment variables. Do not use `VITE_` names or put any of these values in the frontend.
6. Deploy the revision with the runtime service account from step 2. Cloud Run's integration authenticates to Cloud SQL with that identity; no service-account key file and no standalone proxy process are required.
7. With these real environment variables configured, run `npm run db:migrate`, `npm run db:verify`, and `npm run db:smoke` from a Cloud Run job or other environment attached to the same Cloud SQL instance. Then verify `GET /api/health` on the deployed service returns HTTP 200 with `server: "ok"` and `database: { "status": "ok" }`.

## Firebase Admin on Cloud Run

The Firebase client and Firebase Admin SDK both read `firebase-applet-config.json`, so they target the same Firebase project. The Admin SDK initializes with Application Default Credentials, which Cloud Run supplies through the runtime service account; do not add a local service-account key to the image or set `GOOGLE_APPLICATION_CREDENTIALS` in Cloud Run.

Grant the Cloud Run runtime service account `Firebase Authentication Admin` (`roles/firebaseauth.admin`) in addition to `Cloud SQL Client` and `Secret Manager Secret Accessor`. This allows the server to verify ID tokens and retrieve an authenticated Firebase user's email when an ID token does not include it.

## Local Auth Proxy workflow

1. Create or select the Google Cloud project and Cloud SQL PostgreSQL instance. Enable the Cloud SQL Admin API.
2. Install the Cloud SQL Auth Proxy using Google's official installation instructions.
3. Authenticate locally with Application Default Credentials, or use a service account that has `Cloud SQL Client` (`roles/cloudsql.client`) on the project/instance.
4. Start the proxy in a terminal, replacing the placeholders with the actual instance connection name:

   ```powershell
   cloud-sql-proxy --port 5432 PROJECT_ID:REGION:INSTANCE_NAME
   ```

5. In the untracked local `.env`, set `CLOUD_SQL_MODE=auth-proxy`, `CLOUD_SQL_CONNECTION_NAME=PROJECT_ID:REGION:INSTANCE_NAME`, `SQL_HOST=127.0.0.1`, `SQL_USER`, `SQL_PASSWORD`, and `SQL_DB_NAME`. Keep `SQL_SSL_MODE=disable` only for this local proxy hop. Do not use this host in Cloud Run.
6. In another terminal, run `npm run db:migrate`, then `npm run db:verify` and `npm run db:smoke`, and start TestFlow.

Never deploy the proxy's local listener as a public service. For production, run the proxy as a private sidecar or use a supported Cloud SQL Connector integration with the runtime identity.

## Production checklist

- A Google Cloud project with Cloud SQL for PostgreSQL provisioned, backups enabled, and a database/user created.
- The Cloud Run runtime service account is attached to the application and has `Cloud SQL Client` permission. Do not distribute service-account private keys.
- The Cloud SQL instance is attached under Cloud Run Connections, which provides the Unix socket.
- Set `CLOUD_SQL_MODE=auth-proxy`, `CLOUD_SQL_CONNECTION_NAME`, and the `/cloudsql/...` `SQL_HOST`, plus server-side database secrets in the production environment.
- Set `ADMIN_UIDS` in the server environment to the approved Firebase UIDs; role assignment is not accepted from frontend input.
- Deploy the application, run `npm run db:migrate` as a release step, and require `npm run db:verify`, `npm run db:smoke`, and `GET /api/health` to pass before routing user traffic.
- `GET /api/health` runs `SELECT 1`; it returns HTTP 503 when configuration or the database is unavailable and never returns connection details.
- Verify an anonymous tester submission is committed, restart the service, verify it remains, and test owner/non-owner developer reads against two real developer accounts before production approval.

A successful frontend build is not evidence of database readiness. Do not mark the deployment ready until the live Cloud SQL checks and persistence/isolation checks above pass.
