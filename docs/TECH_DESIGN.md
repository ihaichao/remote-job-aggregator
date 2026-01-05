# Technical Design - Remote Job Aggregator

## 1. Technology Stack

### 1.1 Frontend
- **Framework**: Next.js 14+ (App Router)
  - Reason: SSR/SSG support, SEO-friendly, easy dynamic route generation
- **Styling**: Tailwind CSS
  - Reason: Rapid development, easy maintenance
- **State Management**: React Context + SWR
  - Reason: Lightweight, suitable for data display applications
- **Search Component**: Native implementation + Debounce
  - Can integrate Algolia/Meilisearch later
- **i18n**: next-intl or next-i18next
  - Reason: Native Next.js App Router support, type-safe translations

### 1.2 Backend
- **Language**: Node.js (TypeScript)
  - Reason: Unified with frontend stack, convenient for full-stack development
- **Framework**: NestJS
  - Reason: Enterprise-grade architecture, modular design, built-in dependency injection
- **ORM**: Prisma
  - Reason: Type-safe, excellent developer experience, simple migration management, good performance
- **API Design**: RESTful API
  - Core endpoints:
    - `GET /api/jobs` - Get job list (with filter parameters)
    - `GET /api/jobs/:id` - Get job details
    - `GET /api/stats` - Get statistics (for homepage display)

### 1.3 Database
- **Primary Database**: PostgreSQL
  - Reason: Relational data suitable for structured job information, supports full-text search
- **Cache Layer**: Redis
  - Reason: Cache popular query results, reduce database load
- **Search Engine**: Meilisearch (open source) or Algolia (commercial)
  - Reason: Millisecond search response, supports Chinese tokenization

### 1.4 Scraper
- **Language**: Python 3.11+
  - Reason: Mature scraping ecosystem, rich libraries
- **Framework**:
  - Playwright (dynamic pages, e.g., LinkedIn)
  - httpx + BeautifulSoup4 (static pages, e.g., V2EX)
- **Task Scheduling**:
  - GitHub Actions (scheduled triggers, generous free tier)
  - Or Celery + Redis (self-hosted solution)
- **Proxy**: Bright Data / ScraperAPI (anti-blocking)

### 1.5 Deployment
- **Monorepo Management**: pnpm + Turborepo
  - Reason: Efficient dependency management, parallel builds, cache optimization
- **Containerization**: Docker + Docker Compose
  - Frontend: Next.js (Node image)
  - Backend: NestJS (Node image)
  - Database: PostgreSQL (official image)
  - Cache: Redis (official image)
  - Search: Meilisearch (official image)
- **Server**: VPS (self-hosted)
- **Reverse Proxy**: Nginx (handles HTTPS, load balancing)
- **Scraper Scheduling**: Cron + Docker (separate container for scheduled execution)

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                       User Browser                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                  Nginx (Reverse Proxy + HTTPS)               │
└────────────┬───────────────────────┬────────────────────────┘
             │                       │
             ▼                       ▼
┌──────────────────────┐  ┌──────────────────────────────────┐
│  Next.js Frontend    │  │     NestJS Backend API           │
│  (Docker Container)  │  │     (Docker Container)           │
│  - SSR/SSG pages     │  │  - GET /api/jobs                 │
│  - Dynamic routes    │  │  - GET /api/jobs/:id             │
│  - SEO optimization  │  │  - GET /api/stats                │
│  - i18n (en/zh)      │  │                                  │
└──────────────────────┘  └────────────┬─────────────────────┘
                                       │
                     ┌─────────────────┼─────────────────┐
                     │                 │                 │
                     ▼                 ▼                 ▼
          ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
          │ PostgreSQL   │  │    Redis     │  │ Meilisearch  │
          │  (Docker)    │  │  (Docker)    │  │  (Docker)    │
          └──────┬───────┘  └──────────────┘  └──────────────┘
                 ▲
                 │
          ┌──────┴────────────────────────────────────────────┐
          │         Scraper Service (Python + Docker)         │
          │  - V2EX Scraper                                   │
          │  - RemoteOK Scraper                               │
          │  - BOSS Zhipin Scraper                            │
          │  - LinkedIn Scraper                               │
          │  - Cron scheduled tasks                           │
          └───────────────────────────────────────────────────┘

All services run on the same VPS, orchestrated via Docker Compose
```

## 3. Database Design

### 3.1 Core Table Structure

#### jobs table
```sql
CREATE TABLE jobs (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  company VARCHAR(255) NOT NULL,
  company_logo VARCHAR(500),
  category VARCHAR(50) NOT NULL,  -- frontend, backend, fullstack, etc.
  tags TEXT[],  -- ['React', 'TypeScript', 'Remote']
  region_limit VARCHAR(50) NOT NULL,  -- worldwide, regional, timezone
  location_detail TEXT,
  work_type VARCHAR(50) NOT NULL,  -- fulltime, parttime, contract
  salary_currency VARCHAR(10),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_period VARCHAR(20),  -- yearly, monthly, hourly
  source_site VARCHAR(50) NOT NULL,
  original_url TEXT NOT NULL UNIQUE,
  content_hash VARCHAR(64) UNIQUE,  -- for deduplication
  description TEXT,
  date_posted TIMESTAMP,
  date_scraped TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_region ON jobs(region_limit);
CREATE INDEX idx_jobs_work_type ON jobs(work_type);
CREATE INDEX idx_jobs_date_posted ON jobs(date_posted DESC);
CREATE INDEX idx_jobs_is_active ON jobs(is_active);
```

#### scraper_logs table (monitor scraper status)
```sql
CREATE TABLE scraper_logs (
  id SERIAL PRIMARY KEY,
  source_site VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL,  -- success, failed
  jobs_scraped INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
```

## 4. Scraper Implementation Strategy

### 4.1 Target Site Analysis

| Site | Difficulty | Approach | Frequency |
|------|------------|----------|-----------|
| V2EX | Low | httpx + BS4 HTML parsing | Hourly |
| RemoteOK | Low | Official API (https://remoteok.com/api) | Hourly |
| We Work Remotely | Medium | RSS Feed or HTML parsing | Hourly |
| Remote.com | Medium | HTML parsing + anti-scraping handling | Every 2 hours |
| BOSS Zhipin | High | Playwright + proxy pool + cookie handling | Every 4 hours |
| LinkedIn | High | Playwright + proxy pool + rate limiting | Every 4 hours |

### 4.2 Data Cleaning Process
1. **Field Standardization**: Unify job categories (e.g., "Frontend Engineer" → "frontend")
2. **Deduplication**: Based on `content_hash` (SHA256 of title + company + description)
3. **Freshness Check**: Mark jobs older than 30 days as `is_active = false`
4. **Salary Parsing**: Extract salary information from description (regex)

### 4.3 Anti-Scraping Strategy
- **User-Agent Rotation**
- **Request Rate Limiting**: 2-5 second interval per site
- **Proxy Pool**: Use ScraperAPI or Bright Data
- **Error Retry**: Exponential backoff on failure

## 5. SEO Optimization Strategy

### 5.1 Dynamic Route Generation
Using Next.js `generateStaticParams`, pre-generate popular combination pages:
- `/jobs/react` - React related jobs
- `/jobs/react-worldwide` - React worldwide remote
- `/jobs/golang-china` - Go China remote
- `/jobs/fulltime-frontend` - Full-time frontend

### 5.2 Meta Tag Optimization
Dynamically generate for each page:
```typescript
export async function generateMetadata({ params }) {
  return {
    title: `${params.category} Remote Jobs - Latest 2026 Positions`,
    description: `Curated ${params.category} remote developer positions from V2EX, LinkedIn and more...`,
    openGraph: { ... }
  }
}
```

### 5.3 Automatic Sitemap Generation
Periodically generate `sitemap.xml`, submit to Google Search Console.

## 6. Multi-language (i18n) Implementation

### 6.1 Next.js i18n Configuration
```typescript
// next.config.js
const withNextIntl = require('next-intl/plugin')();

module.exports = withNextIntl({
  // Next.js config
});
```

### 6.2 URL Structure
- English: `/en/jobs`, `/en/jobs/react`
- Chinese: `/zh/jobs`, `/zh/jobs/react`
- Default redirect based on browser locale

### 6.3 Translation Files
```
messages/
├── en.json
└── zh.json
```

### 6.4 SEO per Language
- Separate meta tags per locale
- hreflang tags for language alternates
- Language-specific sitemap entries

## 7. Development Roadmap

### Phase 1 (MVP)
- [ ] Set up Next.js frontend framework
- [ ] Set up NestJS backend framework (Prisma + PostgreSQL)
- [ ] Write Docker Compose configuration
- [ ] Develop V2EX and RemoteOK scrapers
- [ ] Implement basic list page and filtering
- [ ] Configure Nginx reverse proxy
- [ ] Deploy to VPS

### Phase 2 (Feature Enhancement)
- [ ] Add LinkedIn and We Work Remotely scrapers
- [ ] Integrate Meilisearch search engine
- [ ] Implement dynamic route SEO pages
- [ ] Add Redis cache layer
- [ ] Implement i18n (Chinese/English)

### Phase 3 (Growth - Ongoing)
- [ ] Submit Sitemap to search engines
- [ ] Social media auto-posting
- [ ] Analytics and user behavior tracking
- [ ] Email subscription feature

## 8. Docker Deployment Architecture

### 8.1 Docker Compose Service List
```yaml
services:
  frontend:     # Next.js (port 3000)
  backend:      # NestJS (port 4000)
  postgres:     # PostgreSQL (port 5432)
  redis:        # Redis (port 6379)
  meilisearch:  # Meilisearch (port 7700)
  scraper:      # Python scraper (Cron scheduled)
  nginx:        # Reverse proxy (port 80/443)
```

### 8.2 Nginx Routing Configuration
- `yourdomain.com/` → Next.js Frontend (3000)
- `yourdomain.com/api/*` → NestJS Backend (4000)

### 8.3 Data Persistence
- PostgreSQL: `/var/lib/postgresql/data` (Volume)
- Redis: `/data` (Volume)
- Meilisearch: `/meili_data` (Volume)

## 9. Cost Estimation (Monthly)
- VPS: $5-20 (depending on specs, recommend 2C4G)
- Domain: $1/month
- ScraperAPI: $29 (optional, not needed initially)
- **Total**: ~$6-50/month
