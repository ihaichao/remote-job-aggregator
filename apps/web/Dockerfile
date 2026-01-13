FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm (Specifying version to match pnpm-lock.yaml)
RUN npm install -g pnpm@9.2.0

# Copy workspace configuration and lockfile
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all package.json files to allow pnpm to resolve dependencies first
COPY apps/web/package.json ./apps/web/
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build web app
WORKDIR /app/apps/web
RUN pnpm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/node_modules ./node_modules
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=builder /app/apps/web/package.json ./
COPY --from=builder /app/apps/web/public ./public

EXPOSE 3000

# Next.js start command
CMD ["npm", "start"]
