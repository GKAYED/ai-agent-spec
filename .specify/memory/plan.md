# Implementation Plan

## Executive Summary

This plan details HOW to build the AI News & Learning Resource Aggregator based on the specification. It covers technology choices, architecture design, API contracts, database schema, deployment strategy, and development workflow.

---

## Technology Stack

### Runtime & Core

**Node.js 20.x LTS** (Required)
- **Why**: Long-term support, excellent ecosystem, native async/await
- **Version**: 20.17.0 (latest LTS as of October 2024)
- **Rationale**: Stable, widely deployed, no breaking changes expected

**SQLite 3** via `better-sqlite3@9.2.2`
- **Why**: Embedded database, no external server, synchronous API
- **Alternatives Rejected**:
  - `sqlite3` (asynchronous, callback-based, more complex)
  - PostgreSQL (requires external server, overkill for single-user)
  - MongoDB (schemaless, not ideal for structured data)
- **Rationale**: Simple deployment, zero configuration, ACID transactions

### Web Framework

**Express.js 4.18.2**
- **Why**: Minimal, unopinionated, proven, massive ecosystem
- **Middleware Used**:
  - `express.json()` - Body parsing
  - `express.static()` - Serve public folder
  - `cors` - Enable cross-origin requests
- **Alternatives Rejected**:
  - Fastify (overkill for this use case)
  - Koa (less ecosystem support)
  - Raw http module (too low-level, reinvent the wheel)
- **Rationale**: Simplicity, community, tooling

### Data Fetching

**RSS Parsing**: `rss-parser@3.13.0`
- **Why**: Simple API, handles various RSS/Atom formats
- **Usage**: `await parser.parseURL(feedUrl)`

**HTTP Client**: `axios@1.6.5`
- **Why**: Promise-based, interceptors, broad browser compatibility
- **Alternatives**: `fetch` (no built-in retry), `got` (heavier)

**HTML Parsing**: `cheerio@1.0.0-rc.12`
- **Why**: jQuery-like API, fast, server-side DOM manipulation
- **Usage**: Extract metadata from web pages (courses, manual resources)

### CLI & Developer Experience

**Commander.js 4.1.2**
- **Why**: Industry-standard CLI framework
- **Usage**: Define `fetch` and `stats` commands

**Chalk 4.x**
- **Why**: Terminal colors for better logging UX
- **Usage**: Green for success, red for errors, yellow for warnings

### Containerization

**Docker**
- **Base Image**: `node:20-alpine` (Alpine Linux for minimal size)
- **Build Dependencies**: `python3`, `make`, `g++` (required for better-sqlite3 native build)
- **Why Alpine**: Image size ~150MB vs ~900MB for full Debian-based image

**Docker Compose**
- **Why**: Single-command orchestration, volume management
- **Version**: 3.8 (widely supported)

---

## Architecture Design

### Layered Architecture

```
┌─────────────────────────────────────────────────┐
│                Frontend Layer                    │
│  (public/index.html - Vanilla JS/CSS/HTML)      │
└─────────────────┬───────────────────────────────┘
                  │ HTTP (REST API)
┌─────────────────▼───────────────────────────────┐
│              API Layer (Express)                 │
│           (src/server.js)                        │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Business Logic Layer                    │
│  (src/organizer.js - categorization logic)      │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Data Access Layer                       │
│  (src/db.js - SQLite operations)                │
└─────────────────┬───────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────┐
│          Data Source Layer                       │
│  (src/sources/ - RSS & web scrapers)            │
└─────────────────────────────────────────────────┘
```

### File Structure

```
ai-agent/
├── .dockerignore
├── .gitignore
├── docker-compose.yml
├── Dockerfile
├── package.json
├── package-lock.json
├── README.md
├── QUICKSTART.md
├── SETUP.md
├── RESOURCES.md
├── CHANGELOG.md
├── AI-EXPERIMENT.md
├── data/                        # SQLite database (volume-mounted)
│   └── resources.db
├── public/                      # Frontend (static files)
│   └── index.html               # SPA with embedded CSS/JS
└── src/                         # Backend (Node.js)
    ├── index.js                 # CLI entry point
    ├── server.js                # Express app, API routes
    ├── db.js                    # Database operations
    ├── config.js                # Data sources configuration
    ├── organizer.js             # Categorization logic
    └── sources/
        ├── rssSource.js         # RSS feed fetcher
        └── webScraper.js        # Generic web scraper
```

### Data Flow

**Fetch Flow**:
```
CLI/API Request → index.js/server.js → rssSource.js (parallel fetch)
                                     ↓
                            Parse RSS feeds → Extract items
                                     ↓
                            organizer.js → Categorize items
                                     ↓
                            db.js → Insert items (skip duplicates)
                                     ↓
                            Return count → Respond to client
```

**Display Flow**:
```
Browser → GET /api/items?category=news
                ↓
        server.js → db.js (SELECT query with filters)
                ↓
        JSON response → Frontend renders cards
```

**Toggle/Vote Flow**:
```
Browser → POST /api/items/:id/toggle
                ↓
        server.js → db.js (UPDATE checked column)
                ↓
        Return new state → Frontend updates UI
```

---

## API Contract

### Endpoint: POST /api/fetch

**Purpose**: Fetch new content from all configured sources

**Request**:
```http
POST /api/fetch HTTP/1.1
Host: localhost:3000
Content-Length: 0
```

**Response** (Success):
```json
{
  "success": true,
  "count": 1234
}
```

**Response** (Partial Failure):
```json
{
  "success": true,
  "count": 800,
  "errors": [
    "Failed to fetch from arXiv cs.AI: Timeout",
    "Failed to fetch from DeepMind Blog: 404"
  ]
}
```

**Behavior**:
- Fetches from all RSS feeds in `config.js` (parallel, max 5 concurrent)
- Parses RSS XML, extracts items
- Categorizes items via `organizer.js`
- Inserts into database (skips duplicates via unique URL constraint)
- Returns count of newly inserted items
- Timeout per source: 10 seconds
- Total timeout: 60 seconds

---

### Endpoint: GET /api/items

**Purpose**: Retrieve items with optional filters

**Request**:
```http
GET /api/items?category=news&checked=0 HTTP/1.1
Host: localhost:3000
```

**Query Parameters**:
- `category` (optional): "news", "courses", "reading"
- `checked` (optional): "0" (unchecked), "1" (checked)

**Response**:
```json
[
  {
    "id": 1,
    "title": "GPT-5 Announced",
    "url": "https://openai.com/blog/gpt-5",
    "summary": "OpenAI announces GPT-5 with 10 trillion parameters...",
    "source": "OpenAI Blog",
    "category": "news",
    "date": "2024-10-20T14:30:00Z",
    "checked": 0,
    "upvotes": 15,
    "downvotes": 2,
    "created_at": "2024-10-20T15:00:00Z"
  },
  ...
]
```

**Behavior**:
- Returns items ordered by date (newest first)
- Applies filters if provided
- No pagination (client-side handles large lists)
- Empty array if no matches

---

### Endpoint: POST /api/items/:id/toggle

**Purpose**: Toggle checked state of an item

**Request**:
```http
POST /api/items/42/toggle HTTP/1.1
Host: localhost:3000
Content-Length: 0
```

**Response**:
```json
{
  "success": true,
  "checked": 1
}
```

**Behavior**:
- Flips `checked` column: 0→1 or 1→0
- Returns new state
- If item ID not found, returns 404

---

### Endpoint: POST /api/items/:id/vote

**Purpose**: Cast upvote or downvote on an item

**Request**:
```http
POST /api/items/42/vote HTTP/1.1
Host: localhost:3000
Content-Type: application/json

{
  "type": "up"
}
```

**Request Body**:
- `type`: "up" or "down"

**Response**:
```json
{
  "success": true,
  "upvotes": 16,
  "downvotes": 2
}
```

**Behavior**:
- Increments `upvotes` or `downvotes` column by 1
- Returns updated counts
- If type invalid, returns 400
- If item not found, returns 404

---

### Endpoint: GET /api/stats

**Purpose**: Get aggregate statistics

**Request**:
```http
GET /api/stats HTTP/1.1
Host: localhost:3000
```

**Response**:
```json
{
  "total": 1234,
  "checked": 45,
  "news": 800,
  "courses": 234,
  "reading": 200
}
```

**Behavior**:
- Executes COUNT queries per category
- Executes COUNT WHERE checked=1 for checked count
- Fast (uses indexes)

---

### Endpoint: GET /api/sources/top

**Purpose**: Get top-voted sources

**Request**:
```http
GET /api/sources/top HTTP/1.1
Host: localhost:3000
```

**Response**:
```json
[
  {
    "source": "arXiv cs.AI",
    "netVotes": 42
  },
  {
    "source": "OpenAI Blog",
    "netVotes": 38
  },
  ...
]
```

**Behavior**:
- Groups items by source
- Calculates (SUM(upvotes) - SUM(downvotes)) per source
- Orders by netVotes DESC
- Returns top 10 sources

---

### Endpoint: GET /api/journey

**Purpose**: Get user progress and milestones

**Request**:
```http
GET /api/journey HTTP/1.1
Host: localhost:3000
```

**Response**:
```json
{
  "totalChecked": 23,
  "milestones": [
    { "count": 5, "achieved": true },
    { "count": 10, "achieved": true },
    { "count": 20, "achieved": true },
    { "count": 50, "achieved": false },
    { "count": 100, "achieved": false }
  ]
}
```

**Behavior**:
- Queries COUNT WHERE checked=1
- Compares against hardcoded milestones [5, 10, 20, 50, 100]
- Returns achievement status

---

## Database Design

### Schema Definition

```sql
CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT,
  source TEXT,
  category TEXT NOT NULL,
  date TEXT,
  checked INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_category ON items(category);
CREATE INDEX IF NOT EXISTS idx_checked ON items(checked);
CREATE UNIQUE INDEX IF NOT EXISTS idx_url ON items(url) WHERE url IS NOT NULL;
```

### Column Details

| Column       | Type    | Constraints                     | Purpose                          |
|--------------|---------|---------------------------------|----------------------------------|
| `id`         | INTEGER | PRIMARY KEY AUTOINCREMENT       | Unique identifier                |
| `title`      | TEXT    | NOT NULL                        | Item title/headline              |
| `url`        | TEXT    | UNIQUE (when not null)          | Source URL (deduplication key)   |
| `summary`    | TEXT    | Nullable                        | Item description/excerpt         |
| `source`     | TEXT    | Nullable                        | Source name (e.g., "arXiv cs.AI")|
| `category`   | TEXT    | NOT NULL                        | "news", "courses", "reading"     |
| `date`       | TEXT    | Nullable, ISO 8601 format       | Publication date                 |
| `checked`    | INTEGER | DEFAULT 0 (boolean)             | User completion status           |
| `upvotes`    | INTEGER | DEFAULT 0                       | Upvote count                     |
| `downvotes`  | INTEGER | DEFAULT 0                       | Downvote count                   |
| `created_at` | TEXT    | DEFAULT current timestamp       | When item added to database      |

### Indexes Rationale

- **idx_category**: Fast filtering by tab (News, Courses, Reading)
- **idx_checked**: Fast filtering by completion status
- **idx_url**: Enforce uniqueness, prevent duplicate content

### Database Operations (src/db.js)

**initDatabase()**
```javascript
// Create database connection
// Execute schema creation SQL
// Create indexes
// Return database object
```

**insertItems(items)**
```javascript
// Prepare INSERT statement with OR IGNORE (skip duplicates)
// Execute transaction:
//   - Loop through items
//   - Insert each item
// Return count of inserted items
```

**getItems(filters)**
```javascript
// Build SELECT query with optional WHERE clauses
// Execute query with filters: { category, checked }
// Return array of items ordered by date DESC
```

**toggleItem(id)**
```javascript
// Execute: UPDATE items SET checked = 1 - checked WHERE id = ?
// Return new checked value
```

**voteItem(id, type)**
```javascript
// If type === 'up': UPDATE items SET upvotes = upvotes + 1 WHERE id = ?
// If type === 'down': UPDATE items SET downvotes = downvotes + 1 WHERE id = ?
// Return updated upvotes and downvotes
```

**getStats()**
```javascript
// Query: SELECT COUNT(*) AS total FROM items
// Query: SELECT COUNT(*) FROM items WHERE checked = 1
// Query: SELECT COUNT(*) FROM items WHERE category = 'news'
// Query: SELECT COUNT(*) FROM items WHERE category = 'courses'
// Query: SELECT COUNT(*) FROM items WHERE category = 'reading'
// Return aggregated stats object
```

**getTopSources()**
```javascript
// Query: SELECT source, SUM(upvotes) - SUM(downvotes) AS netVotes
//        FROM items
//        GROUP BY source
//        ORDER BY netVotes DESC
//        LIMIT 10
// Return array of {source, netVotes}
```

**getJourneyStats()**
```javascript
// Query: SELECT COUNT(*) FROM items WHERE checked = 1
// Calculate milestone achievements: [5, 10, 20, 50, 100]
// Return {totalChecked, milestones: [{count, achieved}]}
```

---

## Configuration Management

### config.js Structure

```javascript
module.exports = {
  // RSS Feeds
  sources: [
    {
      name: 'arXiv cs.AI',
      url: 'https://export.arxiv.org/rss/cs.AI',
      type: 'rss',
      category: 'reading'
    },
    {
      name: 'OpenAI Blog',
      url: 'https://openai.com/blog/rss/',
      type: 'rss',
      category: 'news'
    },
    // ... 20+ sources
  ],

  // Manual Resources
  manualResources: [
    {
      title: 'Stanford CS229: Machine Learning',
      url: 'https://cs229.stanford.edu/',
      summary: 'Classic ML course by Andrew Ng',
      source: 'Stanford University',
      category: 'courses',
      date: '2024-01-01'
    },
    // ... 5+ courses
  ]
};
```

### Why This Structure?

- **Centralized**: All data sources in one place
- **Typed**: `type` field enables different fetchers (RSS vs web scraper)
- **Categorized**: Pre-assign categories to sources for accuracy
- **Extensible**: Easy to add new sources without code changes

---

## Deployment Strategy

### Docker Image Build

**Dockerfile**:
```dockerfile
FROM node:20-alpine

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create data directory
RUN mkdir -p /app/data

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "src/server.js"]
```

**Build Optimization**:
- Layer caching: `package*.json` copied before source code
- Production-only deps: `npm ci --only=production`
- Alpine base: Smaller image size (~150MB vs ~900MB)

### Docker Compose Orchestration

**docker-compose.yml**:
```yaml
version: '3.8'

services:
  ai-agent:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ai-agent-data:/app/data
    environment:
      - PORT=3000
    restart: unless-stopped

volumes:
  ai-agent-data:
```

**Why Docker Compose?**
- Single command: `docker-compose up`
- Volume management: Named volume for data persistence
- Environment variables: Easy port override
- Restart policy: Auto-restart on crash

### Volume Management

- **Data Location**: `/app/data/resources.db` inside container
- **Persistence**: Mounted to named volume `ai-agent-data`
- **Backup**: `docker cp ai-agent:/app/data/resources.db ./backup.db`
- **Restore**: `docker cp ./backup.db ai-agent:/app/data/resources.db`

---

## Development Workflow

### Setup Phase

1. **Initialize Project**:
   ```bash
   npm init -y
   npm install express better-sqlite3 axios rss-parser cheerio cors chalk commander
   ```

2. **Create Directory Structure**:
   ```bash
   mkdir -p src/sources public data
   ```

3. **Create Placeholder Files**:
   ```bash
   touch src/index.js src/server.js src/db.js src/config.js src/organizer.js
   touch src/sources/rssSource.js src/sources/webScraper.js
   touch public/index.html
   ```

### Development Order

**Phase 1: Core Infrastructure** (Day 1)
1. `src/db.js` - Database operations
2. `src/config.js` - Data sources configuration
3. Test: Insert/query items manually

**Phase 2: Data Fetching** (Day 2)
4. `src/sources/rssSource.js` - RSS fetcher
5. `src/organizer.js` - Categorization logic
6. Test: Fetch from 5 sources, verify categories

**Phase 3: API & CLI** (Day 3)
7. `src/server.js` - Express app, 8 endpoints
8. `src/index.js` - CLI commands
9. Test: API endpoints with curl/Postman

**Phase 4: Frontend** (Day 4)
10. `public/index.html` - UI layout
11. JavaScript for tab switching, item display
12. Test: Full user flow (fetch, toggle, vote)

**Phase 5: Gamification** (Day 5)
13. Journey tab UI
14. Celebration modal
15. Test: Milestone achievements

**Phase 6: Docker & Deployment** (Day 6)
16. `Dockerfile`
17. `docker-compose.yml`
18. Test: Build, run, volume persistence

**Phase 7: Documentation** (Day 7)
19. `README.md`
20. `QUICKSTART.md`, `SETUP.md`
21. Final testing & polish

### Testing Strategy

**Manual Testing** (no automated tests for v1):
- Database operations: Insert, query, update (via `sqlite3` CLI)
- API endpoints: Use curl or Postman
- Frontend: Browser testing on Chrome, Firefox, Safari
- Docker: Build, run, stop, restart, volume persistence

**Test Cases**:
1. Fetch 20+ sources, verify >1000 items inserted
2. Toggle checkbox, refresh browser, verify state persisted
3. Vote on item, verify counts incremented
4. Filter by category, verify only matching items shown
5. Check 5 items, verify celebration modal appears
6. Restart Docker container, verify data still present

---

## Error Handling Strategy

### Backend (src/server.js, src/sources/)

**Principles**:
- Never crash the server (wrap in try/catch)
- Log errors with chalk colors (red for errors)
- Return 500 with error message for API failures
- Graceful degradation (skip failed sources, continue)

**Example**:
```javascript
app.post('/api/fetch', async (req, res) => {
  try {
    const items = await fetchAllSources();
    const count = insertItems(items);
    res.json({ success: true, count });
  } catch (error) {
    console.error(chalk.red('Fetch error:'), error.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});
```

### Frontend (public/index.html)

**Principles**:
- Display user-friendly error messages (not stack traces)
- Retry failed API calls (once)
- Revert optimistic updates on failure
- Console.error for debugging

**Example**:
```javascript
async function toggleItem(id) {
  const checkbox = document.getElementById(`item-${id}`);
  const originalState = checkbox.checked;
  
  // Optimistic update
  checkbox.checked = !originalState;
  
  try {
    const res = await fetch(`/api/items/${id}/toggle`, { method: 'POST' });
    const data = await res.json();
    checkbox.checked = data.checked === 1;
  } catch (error) {
    // Revert on failure
    checkbox.checked = originalState;
    alert('Failed to update item. Please try again.');
    console.error('Toggle error:', error);
  }
}
```

---

## Performance Optimization

### Database

- **Indexes**: Create indexes on `category`, `checked`, `url` (already planned)
- **Transactions**: Use transactions for batch inserts (better-sqlite3 default)
- **Synchronous API**: Avoid async overhead (better-sqlite3 benefit)

### API

- **No Pagination**: Return all items (UI handles large lists efficiently)
- **Parallel Fetching**: Fetch RSS feeds concurrently (max 5 at a time)
- **Connection Pooling**: Not needed (SQLite is local, no connection overhead)

### Frontend

- **No Frameworks**: Vanilla JS is fast (no React/Vue overhead)
- **Minimal DOM Manipulation**: Use `innerHTML` for batch updates
- **Debouncing**: Debounce rapid checkbox/vote clicks (300ms)
- **Lazy Loading**: Not needed (1000 items renders fine)

### Docker

- **Alpine Base**: Smaller image, faster downloads
- **Layer Caching**: Optimize Dockerfile layer order
- **Multi-Stage Build**: Not needed (single-stage is simple)

---

## Security Considerations

### Current Scope (Local-First)

**No Security Features Required**:
- No authentication (single-user, trusted environment)
- No input validation (data from trusted RSS feeds)
- No HTTPS (local deployment)
- No CSP headers (local deployment)
- No rate limiting (local API)

**Rationale**: Application designed for local use, user controls environment

### Future Scope (If Multi-User)

**Would Need**:
- Input validation for API endpoints (prevent injection)
- Parameterized SQL queries (already using in better-sqlite3)
- Rate limiting on /api/fetch (prevent abuse)
- HTTPS enforcement (encrypt data in transit)
- CSP headers (prevent XSS)
- User authentication (identify users)

---

## Dependencies & Versions

### Production Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.5",
    "better-sqlite3": "^9.2.2",
    "cheerio": "^1.0.0-rc.12",
    "commander": "^4.1.2",
    "cors": "^2.8.5",
    "express": "^4.18.2",
    "rss-parser": "^3.13.0",
    "chalk": "^4.1.2"
  }
}
```

### Development Dependencies

**None** (keep it simple, no build tools, no test frameworks)

### System Requirements

- Node.js 20.x LTS
- npm 10.x
- Docker 24.x (optional, for containerized deployment)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

---

## Build & Run Instructions

### Local Development

```bash
# Install dependencies
npm install

# Initialize database (automatic on first run)
node src/index.js fetch

# Start server
npm start

# Access UI
open http://localhost:3000
```

### Docker Deployment

```bash
# Build and start
docker-compose up --build

# Run in background
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

### CLI Commands

```bash
# Fetch new content
node src/index.js fetch

# View statistics
node src/index.js stats
```

---

## Rollout Plan

### Phase 1: MVP (v0.1.0)
- Core features: fetch, store, categorize, display, checkbox tracking
- Docker deployment
- Basic documentation
- **Timeline**: 1 week

### Phase 2: Gamification (v0.2.0)
- Voting system
- Journey tab
- Milestone celebrations
- Top sources ranking
- **Timeline**: 1 week

### Phase 3: Polish (v0.3.0)
- Enhanced UI/UX
- Performance optimizations
- Comprehensive documentation
- **Timeline**: 1 week

---

## Risks & Mitigations

| Risk                              | Impact | Mitigation                          |
|-----------------------------------|--------|-------------------------------------|
| RSS feeds become unavailable      | Medium | Graceful error handling, skip source|
| Database file corruption          | High   | Backup strategy, SQLite WAL mode    |
| Memory leak from long-running fetch| Low   | Timeout per source (10s), total 60s |
| UI performance with 10k+ items    | Medium | Pagination or virtual scrolling (v2)|
| Docker build fails (native deps)  | Low    | Document troubleshooting, provide workaround|

---

## Success Metrics

**Project is successful if**:
1. Docker image builds in < 20 seconds
2. Container starts in < 5 seconds
3. Fetch completes in < 60 seconds (1000+ items)
4. API responses < 200ms (95th percentile)
5. UI loads in < 1 second
6. Zero crashes during 1-week continuous operation
7. User completes setup in < 10 minutes (following docs)
8. User finds 5+ new valuable resources per week

---

**Plan Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Complete (matches v0.2.0 implementation)
