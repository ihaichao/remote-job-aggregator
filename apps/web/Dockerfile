FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.2.0

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all package.json files
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build web app with production API URL (relative path via nginx proxy)
WORKDIR /app/apps/web
ENV NEXT_PUBLIC_API_URL=/api
RUN pnpm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@9.2.0

# Copy entire workspace
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/web ./apps/web
COPY --from=builder /app/packages/shared ./packages/shared

WORKDIR /app/apps/web

EXPOSE 3000

CMD ["pnpm", "start"]
