# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS build
WORKDIR /app

# Install the locked dependency graph, including build tooling, in the build stage.
COPY package.json package-lock.json ./
RUN npm ci

# .dockerignore excludes local dependencies, generated assets, Git metadata, and env files.
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

# Only production dependencies and compiled artifacts are present in the runtime image.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
COPY --from=build /app/dist-server ./dist-server
COPY --from=build /app/src/db ./src/db
COPY --from=build /app/drizzle ./drizzle
COPY --from=build /app/scripts ./scripts
RUN groupadd --system testflow && useradd --system --gid testflow testflow \
  && chown -R testflow:testflow /app
USER testflow

# Cloud Run injects PORT at runtime; the application defaults to 3000 only for local use.
EXPOSE 8080
CMD ["npm", "start"]
