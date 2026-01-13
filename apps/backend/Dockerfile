FROM node:20-alpine AS builder

WORKDIR /app

# Use root package.json for workspace info if needed, but for now focus on the app
COPY apps/backend/package*.json ./
RUN npm ci

COPY apps/backend/ ./
COPY apps/backend/prisma ./prisma

RUN npx prisma generate
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/prisma ./prisma

EXPOSE 4000

CMD ["npm", "run", "start:prod"]
