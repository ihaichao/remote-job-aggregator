# Remote Job Aggregator

Aggregates remote job positions in software development from across the web. Supports filtering by job category, region restriction, and work type.

## Tech Stack

- **Frontend**: Next.js 14 + Tailwind CSS
- **Backend**: NestJS + Prisma + PostgreSQL
- **Scraper**: Python (httpx + BeautifulSoup + Playwright)
- **Search**: Meilisearch
- **Cache**: Redis
- **Monorepo**: pnpm + Turborepo
- **Deployment**: Docker + Docker Compose + Nginx

## Project Structure

```
remote-job-aggregator/
├── apps/
│   ├── web/                 # @remote/web - Next.js frontend
│   └── backend/             # @remote/backend - NestJS backend
├── packages/
│   └── shared/              # @remote/shared - Shared types and constants
├── scraper/                 # Python scraper
├── docs/                    # Documentation
│   ├── PRD.md              # Product Requirements Document
│   └── TECH_DESIGN.md      # Technical Design Document
├── nginx/                   # Nginx configuration
├── pnpm-workspace.yaml      # pnpm workspace config
├── turbo.json               # Turborepo config
└── docker-compose.yml       # Docker orchestration
```

## Packages

| Package | Path | Description |
|---------|------|-------------|
| `@remote/web` | `apps/web` | Next.js frontend application |
| `@remote/backend` | `apps/backend` | NestJS backend API |
| `@remote/shared` | `packages/shared` | Shared type definitions and constants |

## Quick Start

### 1. Environment Setup

```bash
# Install pnpm (if not installed)
npm install -g pnpm

# Copy environment variables
cp .env.example .env
cp .env apps/backend/.env
cp .env apps/web/.env.local

# Install dependencies
pnpm install

# Install Python scraper dependencies
cd scraper && pip install -r requirements.txt
```

### 2. Local Development

```bash
# Start database services
docker compose up -d postgres redis meilisearch

# Run database migrations
pnpm prisma:migrate

# Start frontend and backend (parallel via Turborepo)
pnpm dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000/api
- Prisma Studio: `pnpm prisma:studio`

### 3. Common Commands

```bash
# Development
pnpm dev                    # Start all apps
pnpm --filter @remote/web dev      # Start frontend only
pnpm --filter @remote/backend dev  # Start backend only

# Build
pnpm build                  # Build all apps

# Prisma
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Run database migrations
pnpm prisma:studio          # Open Prisma Studio

# Clean
pnpm clean                  # Clean build artifacts
```

### 4. Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## Data Sources

- V2EX (Jobs section)
- RemoteOK
- BOSS Zhipin (planned)
- LinkedIn (planned)
- We Work Remotely (planned)
- Remote.com (planned)

## Development Roadmap

See [TECH_DESIGN.md](./docs/TECH_DESIGN.md) for the detailed development plan.

## License

MIT
