# syntax = docker/dockerfile:1

ARG NODE_VERSION=20
FROM node:${NODE_VERSION}-slim AS base
LABEL fly_launch_runtime="Node.js"
WORKDIR /app
ENV NODE_ENV="production"

# === Production Dependencies ===
FROM base AS deps

# Install only production dependencies for better caching
COPY package-lock.json package.json ./
RUN npm ci --omit=dev

# === Final Image ===
FROM base

# Copy production dependencies
COPY --from=deps /app/node_modules /app/node_modules
COPY package.json ./

# Copy configuration files
COPY app-config.json ./
COPY import-config.json ./

# Copy pre-built application
COPY dist/ /app/dist/

# Create data directory and copy database
RUN mkdir -p /app/data
COPY data/gtfs_lrt_only.db /app/data/gtfs_lrt_only.db
RUN chmod 444 /app/data/gtfs_lrt_only.db

ENV DATABASE_URL="file:///app/data/gtfs_lrt_only.db"

EXPOSE 3000

# Make sure your app reads DATABASE_URL or uses this default

CMD ["node", "./dist/server.js"]
