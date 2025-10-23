# Project Specification

## Executive Summary

**System Name**: AI News & Learning Resource Aggregator  
**Version**: 0.2.0 (current with gamification features)  
**Type**: Web-based content aggregation and tracking system  
**Deployment**: Docker container, local-first, single-user

**Core Value Proposition**: Automatically aggregate AI-related content from 20+ trusted sources into a single interface where users can track reading progress, vote on quality, and visualize their learning journey.

---

## User Stories

### Primary Personas

**Persona 1: AI Practitioner**
- Job: Machine learning engineer at tech company
- Need: Stay current with latest research, tools, frameworks
- Pain: Information scattered across Reddit, arXiv, Twitter, blogs
- Goal: Spend 30 minutes daily reading curated, high-quality AI content

**Persona 2: AI Researcher**
- Job: PhD student or academic researcher
- Need: Track new papers, courses, educational resources
- Pain: Missing important publications, duplicate effort finding content
- Goal: Comprehensive view of AI developments in specific subfields

**Persona 3: AI Student**
- Job: Self-learner or student entering AI field
- Need: Discover courses, tutorials, introductory materials
- Pain: Overwhelming amount of content, unsure what's high-quality
- Goal: Structured learning path with community-validated resources

### Core User Stories

**Story 1: Content Discovery**
> As an AI practitioner,  
> I want to automatically aggregate content from 20+ trusted sources,  
> So that I don't waste time manually checking each site daily.

**Acceptance Criteria**:
- System fetches from 20+ RSS feeds without manual intervention
- New content appears within 1 minute of fetch command
- Duplicate URLs are automatically filtered
- Content is categorized as news, courses, or reading material

---

**Story 2: Progress Tracking**
> As a user,  
> I want to mark items as "read" with persistent checkboxes,  
> So that I can track what I've already consumed across sessions.

**Acceptance Criteria**:
- Each item has a checkbox that toggles checked/unchecked state
- Checkbox state persists after browser refresh
- Checkbox state persists after server restart
- Stats display shows "X of Y items completed"

---

**Story 3: Quality Voting**
> As a user,  
> I want to upvote/downvote items based on quality,  
> So that I can remember which sources provide valuable content.

**Acceptance Criteria**:
- Each item has thumbs-up and thumbs-down buttons
- Vote increments are immediate (no page reload)
- Vote counts persist across sessions
- Journey tab shows top-voted sources ranked

---

**Story 4: Learning Journey Visualization**
> As a user,  
> I want to see my learning progress and milestones,  
> So that I feel motivated to continue engaging with content.

**Acceptance Criteria**:
- Journey tab displays total items checked
- Progress shown as percentage and visual circle
- Milestone achievements visible (5, 10, 20, 50, 100 items)
- Celebration modal appears when reaching milestones

---

**Story 5: Content Categorization**
> As a user,  
> I want to filter content by type (news, courses, reading),  
> So that I can focus on what's relevant to my current needs.

**Acceptance Criteria**:
- Tabs for: All | News | Courses | Reading | Journey
- Clicking tab instantly filters displayed items
- Stats bar shows count per category
- Categorization is automatic based on source and content analysis

---

**Story 6: One-Command Deployment**
> As a user with Docker installed,  
> I want to run the application with a single docker-compose command,  
> So that I can start using it without complex setup.

**Acceptance Criteria**:
- `docker-compose up` starts the application
- Application accessible at http://localhost:3000
- Data persists in named Docker volume
- First run requires no additional configuration

---

## Functional Requirements

### FR-1: Data Aggregation

**FR-1.1: RSS Feed Fetching**
- System SHALL fetch content from RSS feeds listed in configuration
- System SHALL parse RSS XML using rss-parser library
- System SHALL extract: title, link, summary, publication date, source name
- System SHALL handle fetch failures gracefully (log, continue to next source)
- System SHALL complete fetching all sources within 60 seconds

**FR-1.2: Manual Resource Inclusion**
- System SHALL include manually curated resources from configuration
- Manual resources SHALL have: title, URL, summary, source, category
- Manual resources SHALL be inserted into database like RSS items

**FR-1.3: Deduplication**
- System SHALL NOT store items with duplicate URLs
- System SHALL use database unique constraint on URL column
- System SHALL log when duplicates are skipped

### FR-2: Data Storage

**FR-2.1: Database Schema**
- System SHALL use SQLite database stored in `data/resources.db`
- System SHALL create `items` table with columns:
  - `id`: auto-incrementing primary key
  - `title`: text, required
  - `url`: text, unique when not null
  - `summary`: text, nullable
  - `source`: text, source name/publication
  - `category`: text, required (news/courses/reading)
  - `date`: text, ISO 8601 format
  - `checked`: integer, default 0 (boolean)
  - `upvotes`: integer, default 0
  - `downvotes`: integer, default 0
  - `created_at`: text, default current timestamp

**FR-2.2: Database Indexes**
- System SHALL create index on `category` column
- System SHALL create index on `checked` column
- System SHALL create unique index on `url` column (where url IS NOT NULL)

**FR-2.3: Data Persistence**
- System SHALL persist all data to disk immediately on insert/update
- System SHALL use synchronous SQLite operations (better-sqlite3)
- System SHALL support volume mounting for Docker deployments

### FR-3: Web API

**FR-3.1: Fetch Endpoint**
```
POST /api/fetch
Request: (none)
Response: { success: true, count: 1234 }
Behavior: Fetches from all sources, inserts new items, returns count
```

**FR-3.2: Items Endpoint**
```
GET /api/items?category=news&checked=0
Query Params:
  - category: optional, filter by news/courses/reading
  - checked: optional, filter by 0 (unchecked) or 1 (checked)
Response: [{ id, title, url, summary, source, category, date, checked, upvotes, downvotes }, ...]
Behavior: Returns items matching filters, ordered by date descending
```

**FR-3.3: Toggle Endpoint**
```
POST /api/items/:id/toggle
Request: (none)
Response: { success: true, checked: 1 }
Behavior: Flips checked state (0→1 or 1→0), returns new state
```

**FR-3.4: Vote Endpoint**
```
POST /api/items/:id/vote
Request: { type: "up" } or { type: "down" }
Response: { success: true, upvotes: 5, downvotes: 2 }
Behavior: Increments upvotes or downvotes, returns updated counts
```

**FR-3.5: Stats Endpoint**
```
GET /api/stats
Response: {
  total: 1234,
  checked: 45,
  news: 800,
  courses: 234,
  reading: 200
}
Behavior: Returns item counts by category and checked state
```

**FR-3.6: Top Sources Endpoint**
```
GET /api/sources/top
Response: [
  { source: "arXiv cs.AI", netVotes: 42 },
  { source: "OpenAI Blog", netVotes: 38 },
  ...
]
Behavior: Returns sources ranked by (upvotes - downvotes), top 10
```

**FR-3.7: Journey Endpoint**
```
GET /api/journey
Response: {
  totalChecked: 23,
  milestones: [
    { count: 5, achieved: true },
    { count: 10, achieved: true },
    { count: 20, achieved: true },
    { count: 50, achieved: false },
    { count: 100, achieved: false }
  ]
}
Behavior: Returns progress statistics for journey visualization
```

### FR-4: Web User Interface

**FR-4.1: Layout Structure**
- UI SHALL be a single HTML page (`public/index.html`)
- UI SHALL have header with title and stats bar
- UI SHALL have tab navigation: All | News | Courses | Reading | Journey
- UI SHALL have main content area displaying items or journey view
- UI SHALL be responsive (mobile, tablet, desktop)

**FR-4.2: Items Display**
- Each item SHALL display:
  - Title (clickable link to source URL)
  - Summary (truncated if > 200 characters)
  - Source name
  - Publication date (formatted as "MMM DD, YYYY")
  - Checkbox for completion tracking
  - Upvote button with count
  - Downvote button with count
- Items SHALL be displayed as cards in a grid/list layout
- Items SHALL be ordered by date (newest first)

**FR-4.3: Tab Filtering**
- Clicking "All" tab SHALL display all items
- Clicking "News" tab SHALL display only category=news items
- Clicking "Courses" tab SHALL display only category=courses items
- Clicking "Reading" tab SHALL display only category=reading items
- Clicking "Journey" tab SHALL display progress visualization
- Tab switching SHALL be instant (no page reload)

**FR-4.4: Checkbox Interaction**
- Clicking checkbox SHALL toggle checked state
- UI SHALL update immediately (optimistic update)
- API call SHALL persist state to database
- Stats bar SHALL update checked count

**FR-4.5: Voting Interaction**
- Clicking upvote button SHALL increment upvote count
- Clicking downvote button SHALL increment downvote count
- UI SHALL update counts immediately
- API call SHALL persist votes to database

**FR-4.6: Journey Visualization**
- Journey tab SHALL display:
  - Total items checked (large number)
  - Progress percentage
  - Circular progress indicator
  - Milestone badges (5, 10, 20, 50, 100)
  - Achieved milestones styled differently (colored vs gray)
  - Top 5 sources by net votes

**FR-4.7: Celebration Modal**
- Modal SHALL appear when user reaches milestone (5, 10, 20, 50, 100 checked items)
- Modal SHALL display:
  - "Milestone Achieved!" message
  - Milestone count (e.g., "20 Items Completed")
  - Animated GIF (celebration theme)
- Modal SHALL auto-dismiss after 3 seconds
- Modal SHALL be dismissible by clicking overlay

**FR-4.8: Stats Bar**
- Stats bar SHALL always display:
  - Total items count
  - Checked items count
  - News count
  - Courses count
  - Reading count
- Stats SHALL update after fetch, toggle, filter operations

### FR-5: Content Categorization

**FR-5.1: Category Rules**
- System SHALL categorize items based on source and content analysis
- Default category logic:
  - **Courses**: Keywords in title/summary: "course", "tutorial", "learn", "introduction", "beginner", "workshop", or from known course platforms (Coursera, edX, fast.ai)
  - **News**: From news sources (Hacker News, TechCrunch, VentureBeat, blogs) or keywords: "release", "launch", "announce"
  - **Reading**: From academic sources (arXiv, research labs) or contains: "paper", "research", "study"
- System SHALL allow manual category override in configuration

**FR-5.2: Source Configuration**
- Configuration SHALL define category per source
- Sources SHALL have: name, url (RSS or web), type (rss/web), category

### FR-6: Command-Line Interface

**FR-6.1: Fetch Command**
```bash
node src/index.js fetch
```
- SHALL execute data fetch from all sources
- SHALL display progress (colored console output with chalk)
- SHALL display summary: "Fetched X items from Y sources in Z seconds"

**FR-6.2: Stats Command**
```bash
node src/index.js stats
```
- SHALL display database statistics:
  - Total items
  - By category breakdown
  - By checked status
  - Top sources

### FR-7: Docker Deployment

**FR-7.1: Docker Image**
- Image SHALL be based on `node:20-alpine`
- Image SHALL include Python3, make, g++ (for better-sqlite3 build)
- Image SHALL expose port 3000
- Image SHALL support PORT environment variable override
- Image SHALL create `/app/data` directory for database
- Image build SHALL complete in < 20 seconds

**FR-7.2: Docker Compose**
- Compose SHALL define single service: `ai-agent`
- Compose SHALL map port 3000 to host
- Compose SHALL mount named volume `ai-agent-data` to `/app/data`
- Compose SHALL allow environment variable override (PORT)

---

## Data Requirements

### DR-1: RSS Feed Sources (20+ feeds)

**AI Research Papers**:
1. arXiv cs.AI - https://export.arxiv.org/rss/cs.AI
2. arXiv cs.LG - https://export.arxiv.org/rss/cs.LG
3. arXiv cs.CL - https://export.arxiv.org/rss/cs.CL
4. arXiv cs.CV - https://export.arxiv.org/rss/cs.CV

**Industry Labs & Companies**:
5. OpenAI Blog - https://openai.com/blog/rss/
6. Google AI Blog - https://ai.googleblog.com/feeds/posts/default
7. DeepMind Blog - https://deepmind.com/blog/feed/basic/
8. Meta AI Blog - https://ai.facebook.com/blog/feed/
9. Microsoft Research Blog - https://www.microsoft.com/en-us/research/feed/
10. Anthropic News - https://www.anthropic.com/index/rss.xml

**News & Aggregators**:
11. Hacker News (AI) - https://hnrss.org/newest?q=AI+OR+ML
12. Reddit r/MachineLearning - https://www.reddit.com/r/MachineLearning/.rss
13. TechCrunch AI - https://techcrunch.com/category/artificial-intelligence/feed/
14. VentureBeat AI - https://venturebeat.com/category/ai/feed/
15. The Batch (deeplearning.ai) - https://www.deeplearning.ai/the-batch/feed/
16. Towards Data Science - https://towardsdatascience.com/feed

**Tools & Platforms**:
17. Hugging Face Blog - https://huggingface.co/blog/feed.xml
18. Papers with Code - https://paperswithcode.com/feeds/latest/
19. LangChain Blog - https://blog.langchain.dev/feed/
20. Weights & Biases Blog - https://wandb.ai/site/blog/feed/

### DR-2: Manual Resources (Courses)

**Online Courses**:
1. Stanford CS229 - Machine Learning (https://cs229.stanford.edu/)
2. MIT 6.S191 - Intro to Deep Learning (http://introtodeeplearning.com/)
3. Fast.ai - Practical Deep Learning (https://course.fast.ai/)
4. Coursera - Deep Learning Specialization (https://www.coursera.org/specializations/deep-learning)
5. Hugging Face NLP Course (https://huggingface.co/learn/nlp-course/)

### DR-3: Category Definitions

**News**: Time-sensitive announcements, product launches, industry developments, conference news
**Courses**: Educational content, tutorials, workshops, structured learning paths
**Reading**: Research papers, technical articles, documentation, in-depth guides

---

## Behavioral Specifications

### BS-1: Checkbox Persistence
- **Trigger**: User clicks checkbox on item
- **Actions**:
  1. UI immediately toggles checkbox visual state (optimistic update)
  2. Send POST request to `/api/items/:id/toggle`
  3. Database updates `checked` column (0→1 or 1→0)
  4. Stats bar updates checked count
  5. If new checked count hits milestone, trigger celebration modal
- **Edge Cases**:
  - If API call fails, revert checkbox state and show error
  - Multiple rapid clicks should debounce (last state wins)

### BS-2: Vote Incrementing
- **Trigger**: User clicks upvote or downvote button
- **Actions**:
  1. UI immediately increments displayed vote count
  2. Send POST request to `/api/items/:id/vote` with type
  3. Database increments `upvotes` or `downvotes` column
  4. Response confirms new counts, UI syncs if different
- **Edge Cases**:
  - If API call fails, revert count and show error
  - No limit on votes per user (local-first, single-user)

### BS-3: Celebration Triggers
- **Trigger**: Checked count reaches milestone (5, 10, 20, 50, 100)
- **Actions**:
  1. Fetch random celebration GIF from embedded list
  2. Display modal overlay with GIF and milestone message
  3. Auto-dismiss after 3 seconds
  4. Allow manual dismiss by clicking overlay
- **Edge Cases**:
  - Only trigger on first achievement of milestone (not every time)
  - If user checks multiple items rapidly, show most recent milestone only

### BS-4: Tab Filtering
- **Trigger**: User clicks tab (All, News, Courses, Reading, Journey)
- **Actions**:
  1. Highlight active tab
  2. If All/News/Courses/Reading: Filter displayed items by category
  3. If Journey: Switch view to progress visualization
  4. Update URL hash (e.g., `#news`) for bookmarking
- **Edge Cases**:
  - Empty categories show "No items found" message
  - Journey tab always shows data (even if 0 checked)

### BS-5: Data Fetching
- **Trigger**: User clicks "Fetch New Content" button or runs CLI command
- **Actions**:
  1. Disable fetch button, show loading spinner
  2. Send POST request to `/api/fetch`
  3. Backend fetches all RSS feeds in parallel (max 5 concurrent)
  4. Backend inserts new items (skips duplicates)
  5. Backend returns count of new items
  6. UI shows success message: "Fetched X new items"
  7. UI refreshes item list to include new content
- **Edge Cases**:
  - If all sources fail, show error but don't crash
  - If some sources fail, show partial success message
  - Fetch timeout: 60 seconds total

---

## Non-Functional Requirements

### NFR-1: Performance
- API response time (excluding /api/fetch): < 200ms at 95th percentile
- /api/fetch completion: < 60 seconds for all sources
- UI initial load: < 1 second (HTML parse + render)
- Database operations: < 50ms per query
- Server startup: < 3 seconds

### NFR-2: Scalability
- Support up to 10,000 items in database without performance degradation
- Support up to 50 concurrent RSS sources
- UI remains responsive with 1,000+ items displayed

### NFR-3: Reliability
- Server uptime: 99%+ (no crashes during normal use)
- Data durability: 100% (all state persisted to disk)
- Graceful handling of network failures (log, continue)

### NFR-4: Usability
- Zero-configuration first run (works out of the box)
- No account creation required
- Keyboard shortcuts for common actions (space to toggle checkbox)
- Mobile-friendly responsive design

### NFR-5: Maintainability
- Code structure: modular, single-responsibility files
- Documentation: inline comments for complex logic
- Logging: structured console output with colors
- Error messages: actionable and user-friendly

### NFR-6: Portability
- Works on Linux, macOS, Windows (via Docker)
- No platform-specific dependencies
- Data directory can be backed up/restored simply by copying folder

---

## Acceptance Criteria (System-Level)

**The system is complete when**:

1. ✅ A user can run `docker-compose up` and access UI at http://localhost:3000
2. ✅ Clicking "Fetch" button aggregates 1000+ items in < 60 seconds
3. ✅ Items are categorized into News, Courses, Reading tabs
4. ✅ Clicking checkbox persists state across browser refresh
5. ✅ Upvoting/downvoting updates counts immediately and persists
6. ✅ Journey tab shows progress circle and milestone achievements
7. ✅ Reaching 5th, 10th, 20th, 50th, 100th checked item shows celebration
8. ✅ Top sources ranked by net votes appear in Journey tab
9. ✅ Stats bar shows real-time counts (total, checked, by category)
10. ✅ All data persists after container restart (volume-mounted database)
11. ✅ UI is responsive on mobile, tablet, desktop browsers
12. ✅ No console errors in browser developer tools during normal operation

---

## Out of Scope

The following are explicitly NOT part of this specification:

- User authentication / multi-user support
- Backend admin panel
- Content editing / manual item creation via UI
- Search functionality
- Export to CSV/JSON
- Email notifications / digests
- Mobile native apps
- Browser extensions
- AI-powered summarization (beyond source summaries)
- Social features (sharing, comments)
- Dark mode toggle
- Custom RSS feed management via UI
- Analytics / usage tracking
- Internationalization (English only)

---

## Dependencies & Integrations

### External Dependencies
- **RSS Feeds**: System depends on availability of 20+ external RSS feeds; some may be temporarily unavailable
- **Network**: Requires internet connection for fetching; offline mode not supported
- **Browser**: Requires modern browser with ES6+ JavaScript support

### Internal Dependencies
- Database must be initialized before server starts
- Web UI depends on API server being available
- CLI commands depend on database and source configuration

---

## Glossary

- **Item**: A single piece of content (news article, course, paper) stored in the database
- **Source**: An RSS feed or website that provides items
- **Category**: Classification of content (news, courses, reading)
- **Checked**: Boolean state indicating user has read/completed an item
- **Vote**: User feedback on item quality (upvote or downvote)
- **Milestone**: Achievement threshold (5, 10, 20, 50, 100 checked items)
- **Journey**: User's progress tracking view showing statistics and milestones
- **Net Votes**: Calculation of (upvotes - downvotes) used for ranking

---

**Specification Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Complete (matches v0.2.0 implementation)
