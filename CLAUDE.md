# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Remote job aggregator for Chinese developers. Monorepo with Next.js frontend, NestJS backend, Python scrapers, and PostgreSQL. Deployed via Docker Compose to VPS at remotecn.com.

## Commands

```bash
# Install dependencies
pnpm install

# Development (all apps with hot reload)
pnpm dev

# Build all
pnpm build

# Run specific app
pnpm --filter @remote/backend dev
pnpm --filter @remote/web dev

# Database
pnpm prisma:generate        # Generate Prisma client
pnpm prisma:migrate         # Create/apply migration
pnpm prisma:studio          # Visual DB editor

# Scraper
cd scraper && python main.py            # Run all scrapers
cd scraper && python main.py --test     # Test mode (no DB write)
cd scraper && python main.py --json     # JSON output only
cd scraper && python reclassify_jobs.py --all  # Reclassify all jobs

# Docker (production)
docker compose up -d --build
docker compose logs <service> --tail 50
```

## Architecture

```
apps/backend/     NestJS API on port 4000, Prisma ORM
apps/web/         Next.js 14 App Router, SSR + client hydration
packages/shared/  Shared TypeScript types and constants (JobCategory, labels)
scraper/          Python async scrapers + AI classifier
nginx/            Reverse proxy config for remotecn.com
```

### Data Flow
1. **Scrapers** (hourly cron) fetch jobs from V2EX, Eleduck, RWFA, Remote.com
2. **AI Classifier** categorizes each job via OpenRouter API (DeepSeek V3), falls back to local Ollama
3. Jobs inserted into **PostgreSQL** with dedup (content hash + URL uniqueness)
4. **Backend API** serves `GET /api/jobs` with filters (category, region, workType, keyword)
5. **Frontend** SSR renders initial page via `getServerJobs()`, client-side fetch for filters/pagination

### API Endpoints
- `GET /api/jobs` — List jobs with query params: `category`, `regionLimit`, `workType`, `keyword`, `page`, `limit`
- `GET /api/jobs/:id` — Single job

### Database
- `category` is `String[]` (PostgreSQL array), queried with Prisma `has` operator
- `contentHash` (SHA256) + `originalUrl` for dedup
- GIN index on category array

### AI Classification
- **Primary:** OpenRouter API with `OPENROUTER_API_KEY` env var (DeepSeek V3, ~$0.03/400 jobs)
- **Fallback:** Local Ollama if no API key set
- Post-processing rules in `_enforce_category_rules()` fix common LLM errors (keyword validation for fullstack/testing/ai/blockchain/game/mobile)
- 14 categories: frontend, backend, fullstack, mobile, game, devops, ai, blockchain, quant, security, testing, data, embedded, other

### Frontend Patterns
- SSR via `getServerJobs()` (calls `http://backend:4000/api` internally in Docker)
- Client fetch via `getJobs()` (calls `/api` through Nginx proxy)
- SSR failures return empty response gracefully
- Shared types/constants imported from `packages/shared`
- UI components based on Radix UI + Tailwind CSS

## Environment Variables

```bash
POSTGRES_PASSWORD=          # Required
OPENROUTER_API_KEY=         # AI classification (required for VPS)
OPENROUTER_MODEL=           # Default: deepseek/deepseek-chat-v3-0324
V2EX_TOKEN=                 # V2EX API access
NEXT_PUBLIC_API_URL=        # Frontend API base URL
```

## Key Conventions

- UI language is Chinese (labels, placeholders, time formatting)
- Job category is multi-label (array), one job can have 1-3 categories
- Scrapers are async Python with httpx; each scraper has its own parser
- Docker internal DNS: services reference each other by name (e.g., `postgres`, `backend`)
- Prisma migrations auto-run on backend startup in Docker (`prisma migrate deploy`)
