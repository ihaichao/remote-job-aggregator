FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm@9.2.0

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all package.json files
COPY apps/backend/package.json ./apps/backend/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

# Generate Prisma client and build
WORKDIR /app/apps/backend
RUN npx prisma generate
RUN pnpm run build

# Production stage - use same image to keep pnpm structure intact
FROM node:20-alpine

WORKDIR /app

# Install pnpm for production
RUN npm install -g pnpm@9.2.0

# Copy entire workspace (simpler approach for pnpm)
COPY --from=builder /app/pnpm-lock.yaml /app/pnpm-workspace.yaml /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend ./apps/backend
COPY --from=builder /app/packages/shared ./packages/shared

WORKDIR /app/apps/backend

EXPOSE 4000

CMD ["node", "dist/main"]
