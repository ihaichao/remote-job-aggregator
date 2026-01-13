FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (Specifying version to match pnpm-lock.yaml)
RUN npm install -g pnpm@9.2.0

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all package.json files to allow pnpm to resolve dependencies first
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies (frozen-lockfile ensures it matches local version)
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

# Build backend (dependency on shared is handled by pnpm)
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/backend/dist ./dist
COPY --from=builder /app/apps/backend/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/backend/package.json ./
COPY --from=builder /app/apps/backend/prisma ./prisma

EXPOSE 4000

CMD ["node", "dist/main"]
