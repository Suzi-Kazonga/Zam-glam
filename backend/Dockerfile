# Two stages: install dependencies in the first, and copy only what is needed to run into
# the second, so the image does not ship a build toolchain.
#
# This used to copy backend/config, backend/controllers, backend/middleware, backend/models,
# backend/routes and backend/services — none of which exist. They all live under
# backend/src/, so the build failed on the first of them and no image was ever produced.

# --- Build stage: install dependencies ---
FROM node:18-alpine AS builder

WORKDIR /app

# Copy the manifests first, so a source change does not invalidate the dependency layer.
COPY backend/package*.json ./

RUN npm ci --omit=dev

# --- Production stage ---
FROM node:18-alpine

WORKDIR /app

# dumb-init forwards signals properly, so docker stop shuts the server down cleanly
# instead of killing it. curl is for the health check.
RUN apk add --no-cache dumb-init curl

COPY --from=builder /app/node_modules ./node_modules
COPY backend/package*.json ./

# The whole application, and the entry point that starts it.
COPY backend/src ./src
COPY backend/server.js ./server.js

# Uploaded product photos are written here. Mount a volume over it to keep them between
# rebuilds — docker-compose.yml already does.
RUN mkdir -p uploads

ENV NODE_ENV=production

# The server answers /health as soon as the database is connected and the schema is ready.
HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:' + (process.env.PORT || 5000) + '/health', (r) => { if (r.statusCode !== 200) process.exit(1); }).on('error', () => process.exit(1))"

EXPOSE 5000

ENTRYPOINT ["dumb-init", "--"]

CMD ["node", "server.js"]
