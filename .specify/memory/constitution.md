# Project Constitution

## Project Overview

**Project Name**: AI News & Learning Resource Aggregator  
**Purpose**: An automated system that aggregates, organizes, and tracks AI-related news, courses, and reading materials from trusted sources, providing users with a centralized hub for staying current with AI developments.

**Target Users**: AI practitioners, researchers, students, and enthusiasts who need to stay updated with the rapidly evolving AI landscape without manual monitoring of dozens of sources.

---

## Core Principles

### 1. Simplicity First
- **Minimal Dependencies**: Use standard libraries and proven packages; avoid framework bloat
- **Clear Architecture**: Separation of concerns between data fetching, storage, presentation, and business logic
- **No Over-Engineering**: Build what's needed now, not what might be needed later
- **Plain Technologies**: Prefer vanilla JavaScript, HTML, CSS over complex frameworks unless justified

### 2. Data Integrity & Reliability
- **Trusted Sources Only**: Curate high-quality sources (academic, industry labs, established publications)
- **Deduplication**: URLs are unique - never store duplicates of the same resource
- **Persistence**: All data must survive application restarts
- **Transactional Operations**: Batch inserts should be atomic

### 3. User Experience
- **Fast & Responsive**: UI should load instantly, operations should feel immediate
- **Visual Clarity**: Clean, uncluttered interface with clear information hierarchy
- **Progress Tracking**: Users should see their learning journey and accomplishments
- **No Account Required**: Local-first approach, no signup barriers

### 4. Deployment & Operations
- **Containerized**: Application must run consistently across environments via Docker
- **Self-Contained**: No external database servers; embedded SQLite
- **Port Flexibility**: Support configuration via environment variables
- **Data Portability**: Data directory can be volume-mounted for persistence

### 5. Code Quality Standards
- **Readability**: Code should be self-documenting; comments explain why, not what
- **Error Handling**: Graceful degradation; log errors but don't crash
- **Modularity**: Each file has a single, clear responsibility
- **No Premature Optimization**: Correctness first, performance second

---

## Development Guidelines

### Architecture Patterns

**Backend Structure**:
```
src/
├── server.js       // Express app, HTTP API endpoints
├── db.js           // Database operations (SQLite)
├── config.js       // Configuration, data sources
├── organizer.js    // Business logic (categorization)
├── index.js        // CLI entry point
└── sources/
    ├── rssSource.js     // RSS feed fetcher
    └── webScraper.js    // Generic web scraper
```

**Frontend Structure**:
```
public/
└── index.html      // Single-page application (SPA)
                    // - Embedded CSS
                    // - Embedded JavaScript
                    // - No build step required
```

### Technology Constraints

**Required Stack**:
- **Runtime**: Node.js (LTS version, currently 20.x)
- **Database**: SQLite 3 via better-sqlite3 (synchronous API)
- **Web Framework**: Express.js (minimal, no middleware bloat)
- **Data Fetching**: 
  - RSS: rss-parser
  - HTTP: axios
  - HTML Parsing: cheerio
- **CLI**: commander + chalk (for colored output)
- **Container**: Docker (alpine-based for small image size)

**Prohibited**:
- No TypeScript (keep it simple, plain JavaScript)
- No React/Vue/Angular (use vanilla JS)
- No Webpack/Vite/build tools (direct file serving)
- No external databases (PostgreSQL, MySQL, MongoDB)
- No authentication systems (local-first, no accounts)
- No cloud dependencies (AWS, Azure, GCP services)

### API Design

**REST Principles**:
- Use standard HTTP methods (GET, POST)
- Endpoints are resource-oriented (`/api/items`, `/api/stats`)
- Return JSON for all responses
- Use appropriate status codes (200, 400, 500)
- CORS enabled for flexibility

**API Endpoints** (must implement):
```
POST   /api/fetch              # Fetch new items from all sources
GET    /api/items              # Get items (query: category, checked)
POST   /api/items/:id/toggle   # Toggle checked state
POST   /api/items/:id/vote     # Vote up/down (body: {type})
GET    /api/stats              # Get counts by category
GET    /api/sources/top        # Get ranked sources by votes
GET    /api/journey            # Get progress stats
```

### Database Schema

**Core Table**:
```sql
items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT,                    -- Unique when not null
  summary TEXT,
  source TEXT,                 -- Source name/publication
  category TEXT NOT NULL,      -- 'news', 'courses', 'reading'
  date TEXT,                   -- ISO 8601 format
  checked INTEGER DEFAULT 0,   -- 0=unchecked, 1=checked
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
)
```

**Indexes**:
- `idx_category` on `category` (for filtering)
- `idx_checked` on `checked` (for progress tracking)
- `idx_url` unique on `url` WHERE url IS NOT NULL (deduplication)

### UI/UX Requirements

**Layout**:
- Tabbed interface: All | News | Courses | Reading | Journey
- Each item displays: title, summary, source, date, checkbox, vote buttons
- Stats bar showing: total items, checked count, category breakdown
- Journey tab showing: progress circle, milestones, top sources

**Interactions**:
- Click checkbox → item marked complete (persists immediately)
- Click vote button → upvote/downvote increments (persists immediately)
- Tab switching → instant filter (no page reload)
- Every 5th completed item → celebration modal with GIF (3-second auto-dismiss)

**Styling**:
- Clean, modern, card-based layout
- Responsive (works on mobile, tablet, desktop)
- Color scheme: neutral with accent colors for categories
- Typography: readable sans-serif, proper hierarchy

### Error Handling Philosophy

**Backend**:
- Log all errors to console with chalk colors (red for errors)
- Never crash the server; catch and return 500 with error message
- Retry logic for network requests (RSS feeds, scrapers)
- Transaction rollback on batch operation failures

**Frontend**:
- Display user-friendly error messages (not stack traces)
- Graceful degradation if API unavailable
- Console.error for debugging (not alert/confirm popups)

---

## Feature Priorities

### Must-Have (MVP)
1. Fetch from 20+ curated RSS feeds
2. Store in SQLite with deduplication
3. Categorize into news/courses/reading
4. Web UI with checkbox tracking
5. Basic statistics display
6. Docker deployment

### Phase 2 (Gamification)
1. Upvote/downvote functionality
2. Journey tab with progress tracking
3. Milestone achievements (5, 10, 20, 50, 100 completed)
4. Top sources ranking by community votes
5. Celebration GIFs on milestones

### Future Considerations (Not in Scope)
- User accounts / authentication
- Multi-user support / social features
- Mobile apps (native iOS/Android)
- Browser extensions
- Email digests / notifications
- AI-powered recommendations
- Content summarization (beyond source summaries)
- Search functionality
- Export/import features
- Dark mode toggle

---

## Quality Metrics

### Performance Targets
- Server startup: < 3 seconds
- API response time: < 200ms (except /api/fetch)
- /api/fetch complete: < 60 seconds for all sources
- UI initial load: < 1 second
- Database operations: < 50ms

### Reliability Targets
- Server uptime: 99%+ (no crashes from normal operations)
- Data durability: 100% (no data loss on restarts)
- Successful fetch rate: 80%+ of sources (some may be down)

### Code Quality
- Files under 300 lines (except single-page HTML)
- Functions under 50 lines
- Clear naming (no abbreviations unless standard)
- No console.log in production (use proper logging)

---

## Testing Philosophy

**What We Test**:
- Database operations (insert, query, update)
- API endpoints (request/response validation)
- Categorization logic (news vs courses vs reading)
- Data source fetching (mocked for reliability)

**What We Don't Test** (for this scope):
- UI interactions (no Selenium/Playwright)
- Integration with live RSS feeds (too brittle)
- Docker container internals
- Third-party library internals

**Testing Approach**:
- Simple test runner (no Jest/Mocha framework)
- Inline assertions
- Test data cleanup after each test
- Tests should complete in < 10 seconds total

---

## Documentation Standards

**README.md Must Include**:
- One-sentence project description
- Feature list with emojis
- Quick Start with Docker (3 steps max)
- Manual installation steps (for non-Docker users)
- API endpoint documentation
- Project structure overview
- License

**Additional Docs**:
- `QUICKSTART.md` - Get running in 5 minutes
- `SETUP.md` - Detailed installation, troubleshooting
- `RESOURCES.md` - List of all data sources
- `CHANGELOG.md` - Version history
- Docker-specific docs in Dockerfile comments

---

## Security Considerations

**Current Scope** (minimal security needed for local-first app):
- No authentication (single-user, local deployment)
- No sensitive data storage
- CORS enabled (trusting all origins)
- No rate limiting (local API)
- No input sanitization (trusted data sources)

**Future Scope** (if multi-user):
- Input validation for API endpoints
- SQL injection prevention (use parameterized queries)
- Rate limiting on /api/fetch
- HTTPS enforcement
- CSP headers

---

## Constraints & Assumptions

### Assumptions
- Single user per deployment
- Trusted execution environment (user's own machine/network)
- Modern browser (ES6+ JavaScript support)
- Stable internet connection for fetching
- English-language content primarily

### Constraints
- No budget for paid APIs
- No dedicated hosting (user self-hosts)
- No analytics/telemetry
- No auto-updates (user manages versions)
- SQLite database size limit (140TB theoretical, ~10GB practical)

---

## Success Criteria

**Project is successful if**:
1. User can fetch 1000+ AI resources in < 60 seconds
2. UI loads instantly and feels responsive
3. Progress is never lost (checkbox state persists)
4. Docker image builds in < 20 seconds
5. Container starts in < 5 seconds
6. User finds 5+ new valuable resources per week
7. Zero crashes during normal operation
8. Documentation enables setup in < 10 minutes

---

## Version History

- **v0.1.0** - Initial MVP (basic aggregation, checkbox tracking)
- **v0.2.0** - Gamification features (voting, journey, celebrations)
- **v0.3.0** (proposed) - Enhanced categorization, search

---

**Constitution established**: October 2025  
**AI-Assisted Development**: This project was created through conversational AI specification  
**Experiment Context**: Part of research into AI-accelerated software development capabilities
