# Product Requirements Document (PRD) - Remote Job Aggregator

## 1. Project Background
Remote job opportunities for software developers are scattered across multiple platforms (V2EX, LinkedIn, RemoteOK, etc.), making it inefficient for developers to find remote work as they need to switch between platforms repeatedly. This project aims to build a **remote job aggregation platform** focused on the **software development** field. By scraping data from various sources and providing precise filtering, we solve the information asymmetry problem while attracting traffic through quality content.

## 2. Target Users
- Software developers seeking remote work opportunities.
- Programmers interested in overseas remote opportunities and digital nomad lifestyle.
- Freelance developers looking for part-time or contract work.

## 3. Core Feature Requirements

### 3.1 Job Data Collection (Scraping & Aggregation)
- **Multi-source Scraping**: Automatically collect job information from the following target sites:
  - Domestic: V2EX (Jobs section), BOSS Zhipin (Remote filter)
  - International: LinkedIn (Remote filter), Remote.com, RemoteOK, We Work Remotely
- **Data Cleaning & Standardization**: Unify data formats from different sources.
- **Deduplication**: Identify and merge duplicate job postings from different platforms during frontend display.

### 3.2 Filtering & Search
Users can filter by the following dimensions:
- **Region Restriction**:
  - Worldwide Remote
  - Specific Region (e.g., Only China, Only US, Only Europe)
  - Timezone Requirements (e.g., UTC+8)
- **Job Category**: Frontend, Backend, Full-stack, Mobile, DevOps, AI, Blockchain, etc.
- **Work Type**: Full-time, Part-time, Contract.

### 3.3 Job Display
- **Minimal List Page**: Display job title, company name, source identifier, posting date, region restriction tags.
- **Detail Page/External Link**: Display job description snapshot with link to original posting.

### 3.4 Traffic & SEO Enhancement
- **Dynamic Page Generation**: Generate SEO-friendly pages for each keyword combination (e.g., "React Remote Jobs").
- **Freshness Maintenance**: Automatically mark or hide jobs older than 30 days.

### 3.5 Multi-language Support (i18n)
- **Supported Languages**: Chinese (zh) and English (en).
- **Language Scope**:
  - UI elements (navigation, buttons, labels, filters)
  - SEO meta tags (title, description) per language
  - Dynamic route generation for each language (e.g., `/en/jobs/react`, `/zh/jobs/react`)
- **Language Detection**:
  - Detect user's browser language preference
  - Allow manual language switching via UI toggle
  - Persist language preference in localStorage/cookie
- **Content Handling**:
  - Job listings display in original scraped language
  - Filter labels and categories translated per locale
  - Error messages and system notifications localized

## 4. Non-functional Requirements
- **Timeliness**: Core data source update delay should not exceed 1 hour.
- **Response Speed**: First contentful paint < 1.5s, search response < 200ms.
- **Security**: Prevent scraper from being blocked by target sites (use proxies, adjust frequency).

## 5. Roadmap
- **Phase 1**: Build basic scraper, implement data collection from V2EX and We Work Remotely, create basic list display page.
- **Phase 2**: Add more international data sources, improve filtering algorithms, implement initial SEO optimization, add multi-language support.
