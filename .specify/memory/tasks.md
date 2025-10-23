# Implementation Tasks

## Overview

This document breaks down the AI News & Learning Resource Aggregator into concrete implementation tasks. Tasks are organized by component, with acceptance criteria for each.

---

## Phase 1: Project Setup

### Task 1.1: Initialize Node.js Project
**Priority**: Critical  
**Estimated Time**: 15 minutes  
**Dependencies**: None

**Steps**:
1. Create project directory: `mkdir ai-agent && cd ai-agent`
2. Initialize npm: `npm init -y`
3. Update package.json with:
   - Name: "ai-agent"
   - Version: "0.1.0"
   - Description: "AI news and learning resource aggregator"
   - Main: "src/index.js"
   - Scripts:
     - `"start": "node src/server.js"`
     - `"server": "node src/server.js"`
     - `"fetch": "node src/index.js fetch"`
     - `"stats": "node src/index.js stats"`
4. Add license: "MIT"
5. Add author field

**Acceptance Criteria**:
- [ ] `package.json` exists with correct metadata
- [ ] `npm start` command defined
- [ ] Project directory structure created

---

### Task 1.2: Install Dependencies
**Priority**: Critical  
**Estimated Time**: 10 minutes  
**Dependencies**: Task 1.1

**Steps**:
1. Install production dependencies:
   ```bash
   npm install express@4.18.2 better-sqlite3@9.2.2 axios@1.6.5 \
     rss-parser@3.13.0 cheerio@1.0.0-rc.12 cors@2.8.5 \
     chalk@4.1.2 commander@4.1.2
   ```
2. Verify `package-lock.json` created
3. Verify `node_modules/` populated

**Acceptance Criteria**:
- [ ] All 8 dependencies installed
- [ ] `package-lock.json` exists
- [ ] `npm list` shows no vulnerabilities (or acceptable level)

---

### Task 1.3: Create Directory Structure
**Priority**: Critical  
**Estimated Time**: 5 minutes  
**Dependencies**: Task 1.1

**Steps**:
1. Create directories:
   ```bash
   mkdir -p src/sources
   mkdir -p public
   mkdir -p data
   ```
2. Create placeholder files:
   ```bash
   touch src/index.js
   touch src/server.js
   touch src/db.js
   touch src/config.js
   touch src/organizer.js
   touch src/sources/rssSource.js
   touch src/sources/webScraper.js
   touch public/index.html
   ```

**Acceptance Criteria**:
- [ ] Directory structure matches plan
- [ ] All 8 source files created
- [ ] `data/` directory exists (for SQLite database)

---

### Task 1.4: Create .gitignore
**Priority**: High  
**Estimated Time**: 5 minutes  
**Dependencies**: None

**Steps**:
1. Create `.gitignore` file with:
   ```
   node_modules/
   data/*.db
   data/*.db-shm
   data/*.db-wal
   .DS_Store
   *.log
   ```

**Acceptance Criteria**:
- [ ] `.gitignore` exists
- [ ] `data/` excluded (database files not committed)
- [ ] `node_modules/` excluded

---

## Phase 2: Database Layer

### Task 2.1: Implement Database Schema
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 1.2, Task 1.3

**Steps**:
1. Open `src/db.js`
2. Import `better-sqlite3`:
   ```javascript
   const Database = require('better-sqlite3');
   const path = require('path');
   ```
3. Define schema SQL:
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
   ```
4. Define index SQL:
   ```sql
   CREATE INDEX IF NOT EXISTS idx_category ON items(category);
   CREATE INDEX IF NOT EXISTS idx_checked ON items(checked);
   CREATE UNIQUE INDEX IF NOT EXISTS idx_url ON items(url) WHERE url IS NOT NULL;
   ```
5. Implement `initDatabase()` function:
   - Create database connection to `data/resources.db`
   - Execute schema SQL
   - Execute index SQL
   - Return database object

**Acceptance Criteria**:
- [ ] `src/db.js` exports `initDatabase()` function
- [ ] Running `initDatabase()` creates `data/resources.db`
- [ ] Schema includes all 11 columns
- [ ] 3 indexes created
- [ ] Unique constraint on `url` column

---

### Task 2.2: Implement insertItems Function
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `insertItems(db, items)`:
   - Prepare INSERT statement: `INSERT OR IGNORE INTO items (title, url, summary, source, category, date) VALUES (?, ?, ?, ?, ?, ?)`
   - Use transaction for batch insert
   - Loop through items, execute statement
   - Return count of successfully inserted items
2. Export function

**Acceptance Criteria**:
- [ ] Function accepts database object and items array
- [ ] Uses transaction (faster for batch inserts)
- [ ] `OR IGNORE` skips duplicates (unique URL constraint)
- [ ] Returns count of inserted items
- [ ] Handles errors gracefully (log, don't crash)

**Test**:
```javascript
const db = initDatabase();
const items = [
  { title: 'Test', url: 'http://example.com', summary: 'Test summary', source: 'Test Source', category: 'news', date: '2024-10-20' }
];
const count = insertItems(db, items);
console.log(`Inserted ${count} items`);
// Expected: 1 (first insert)
// Run again: 0 (duplicate URL ignored)
```

---

### Task 2.3: Implement getItems Function
**Priority**: Critical  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `getItems(db, filters = {})`:
   - Build SELECT query: `SELECT * FROM items`
   - Add WHERE clauses if filters provided:
     - `category`: `WHERE category = ?`
     - `checked`: `WHERE checked = ?`
   - Order by date DESC
   - Execute query, return results as array
2. Export function

**Acceptance Criteria**:
- [ ] Returns all items if no filters
- [ ] Filters by category if provided
- [ ] Filters by checked if provided
- [ ] Combines multiple filters with AND
- [ ] Returns empty array if no matches
- [ ] Orders by date descending (newest first)

**Test**:
```javascript
const allItems = getItems(db);
const newsItems = getItems(db, { category: 'news' });
const unchecked = getItems(db, { checked: 0 });
```

---

### Task 2.4: Implement toggleItem Function
**Priority**: High  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `toggleItem(db, id)`:
   - Execute: `UPDATE items SET checked = 1 - checked WHERE id = ?`
   - Query new checked value: `SELECT checked FROM items WHERE id = ?`
   - Return new checked value (0 or 1)
2. Export function

**Acceptance Criteria**:
- [ ] Flips checked state (0→1 or 1→0)
- [ ] Returns new checked value
- [ ] Returns null if item not found
- [ ] Uses single SQL statement (efficient)

**Test**:
```javascript
const newState = toggleItem(db, 1);
console.log(newState); // 1 (if was 0)
const newState2 = toggleItem(db, 1);
console.log(newState2); // 0 (if was 1)
```

---

### Task 2.5: Implement voteItem Function
**Priority**: High  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `voteItem(db, id, type)`:
   - If `type === 'up'`: `UPDATE items SET upvotes = upvotes + 1 WHERE id = ?`
   - If `type === 'down'`: `UPDATE items SET downvotes = downvotes + 1 WHERE id = ?`
   - Query updated counts: `SELECT upvotes, downvotes FROM items WHERE id = ?`
   - Return `{ upvotes, downvotes }`
2. Export function

**Acceptance Criteria**:
- [ ] Increments upvotes if type is 'up'
- [ ] Increments downvotes if type is 'down'
- [ ] Returns updated counts
- [ ] Returns null if item not found
- [ ] Validates type parameter

**Test**:
```javascript
const votes = voteItem(db, 1, 'up');
console.log(votes); // { upvotes: 1, downvotes: 0 }
const votes2 = voteItem(db, 1, 'down');
console.log(votes2); // { upvotes: 1, downvotes: 1 }
```

---

### Task 2.6: Implement getStats Function
**Priority**: Medium  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `getStats(db)`:
   - Query total: `SELECT COUNT(*) AS total FROM items`
   - Query checked: `SELECT COUNT(*) AS checked FROM items WHERE checked = 1`
   - Query news: `SELECT COUNT(*) AS news FROM items WHERE category = 'news'`
   - Query courses: `SELECT COUNT(*) AS courses FROM items WHERE category = 'courses'`
   - Query reading: `SELECT COUNT(*) AS reading FROM items WHERE category = 'reading'`
   - Return aggregated object: `{ total, checked, news, courses, reading }`
2. Export function

**Acceptance Criteria**:
- [ ] Returns all 5 statistics
- [ ] Uses COUNT queries (fast with indexes)
- [ ] Returns 0 for empty categories

**Test**:
```javascript
const stats = getStats(db);
console.log(stats); // { total: 100, checked: 5, news: 60, courses: 20, reading: 20 }
```

---

### Task 2.7: Implement getTopSources Function
**Priority**: Medium  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `getTopSources(db, limit = 10)`:
   - Query:
     ```sql
     SELECT source, 
            SUM(upvotes) - SUM(downvotes) AS netVotes
     FROM items
     GROUP BY source
     ORDER BY netVotes DESC
     LIMIT ?
     ```
   - Return array of `{ source, netVotes }`
2. Export function

**Acceptance Criteria**:
- [ ] Groups by source
- [ ] Calculates net votes (upvotes - downvotes)
- [ ] Orders by net votes descending
- [ ] Limits to top 10 (or specified limit)
- [ ] Returns empty array if no items

**Test**:
```javascript
const topSources = getTopSources(db);
console.log(topSources); // [{ source: 'arXiv cs.AI', netVotes: 42 }, ...]
```

---

### Task 2.8: Implement getJourneyStats Function
**Priority**: Medium  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 2.1

**Steps**:
1. In `src/db.js`, implement `getJourneyStats(db)`:
   - Query total checked: `SELECT COUNT(*) AS totalChecked FROM items WHERE checked = 1`
   - Define milestones: `[5, 10, 20, 50, 100]`
   - Map milestones to objects: `{ count, achieved: totalChecked >= count }`
   - Return `{ totalChecked, milestones }`
2. Export function

**Acceptance Criteria**:
- [ ] Returns total checked count
- [ ] Returns milestone array with achievement status
- [ ] Milestones: 5, 10, 20, 50, 100
- [ ] Each milestone has `count` and `achieved` boolean

**Test**:
```javascript
const journey = getJourneyStats(db);
console.log(journey); // { totalChecked: 23, milestones: [...] }
```

---

## Phase 3: Configuration

### Task 3.1: Define RSS Feed Sources
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: None

**Steps**:
1. Open `src/config.js`
2. Create `sources` array with 20+ RSS feeds:
   - arXiv cs.AI, cs.LG, cs.CL, cs.CV (4 feeds)
   - OpenAI Blog, Google AI Blog, DeepMind Blog, Meta AI Blog, Microsoft Research Blog, Anthropic News (6 feeds)
   - Hacker News, Reddit r/MachineLearning, TechCrunch AI, VentureBeat AI, The Batch, Towards Data Science (6 feeds)
   - Hugging Face Blog, Papers with Code, LangChain Blog, Weights & Biases Blog (4 feeds)
3. Each source object: `{ name, url, type: 'rss', category }`
4. Export `sources` array

**Acceptance Criteria**:
- [ ] At least 20 RSS feeds defined
- [ ] Each source has: name, url, type, category
- [ ] Categories assigned correctly (news, courses, reading)
- [ ] URLs are valid RSS feed URLs

---

### Task 3.2: Define Manual Resources
**Priority**: Medium  
**Estimated Time**: 20 minutes  
**Dependencies**: None

**Steps**:
1. In `src/config.js`, create `manualResources` array with 5+ courses:
   - Stanford CS229
   - MIT 6.S191
   - Fast.ai Practical Deep Learning
   - Coursera Deep Learning Specialization
   - Hugging Face NLP Course
2. Each resource object: `{ title, url, summary, source, category: 'courses', date }`
3. Export `manualResources` array

**Acceptance Criteria**:
- [ ] At least 5 manual resources defined
- [ ] All are category 'courses'
- [ ] Each has title, url, summary, source, date

---

## Phase 4: Data Fetching

### Task 4.1: Implement RSS Fetcher
**Priority**: Critical  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 1.2, Task 3.1

**Steps**:
1. Open `src/sources/rssSource.js`
2. Import dependencies:
   ```javascript
   const Parser = require('rss-parser');
   const chalk = require('chalk');
   ```
3. Implement `fetchRSS(source)`:
   - Create parser: `const parser = new Parser()`
   - Parse feed: `const feed = await parser.parseURL(source.url)`
   - Extract items from `feed.items`:
     - Map to: `{ title, url: link, summary: contentSnippet, source: source.name, category: source.category, date: isoDate }`
   - Return items array
4. Implement `fetchAllRSS(sources)`:
   - Filter sources where `type === 'rss'`
   - Fetch in parallel (Promise.all, but limit concurrency to 5)
   - Handle errors: log, continue to next source
   - Flatten results: `items.flat()`
   - Return all items
5. Export functions

**Acceptance Criteria**:
- [ ] `fetchRSS()` parses single RSS feed
- [ ] Extracts title, link, summary, date from feed items
- [ ] `fetchAllRSS()` fetches multiple feeds in parallel
- [ ] Limits concurrency to 5 (avoid overwhelming sources)
- [ ] Handles errors gracefully (log, don't crash)
- [ ] Returns flattened array of all items

**Test**:
```javascript
const config = require('./config');
const { fetchAllRSS } = require('./sources/rssSource');

(async () => {
  const items = await fetchAllRSS(config.sources);
  console.log(`Fetched ${items.length} items`);
})();
```

---

### Task 4.2: Implement Web Scraper (Optional)
**Priority**: Low  
**Estimated Time**: 1 hour  
**Dependencies**: Task 1.2

**Steps**:
1. Open `src/sources/webScraper.js`
2. Import dependencies:
   ```javascript
   const axios = require('axios');
   const cheerio = require('cheerio');
   ```
3. Implement `scrapeURL(url, selectors)`:
   - Fetch HTML: `const { data } = await axios.get(url)`
   - Parse HTML: `const $ = cheerio.load(data)`
   - Extract elements using selectors (e.g., `$('h2.title')`)
   - Return array of scraped items
4. Export function

**Acceptance Criteria**:
- [ ] Fetches HTML from URL
- [ ] Parses HTML with cheerio
- [ ] Extracts elements using CSS selectors
- [ ] Returns array of items
- [ ] Handles errors (timeouts, 404s)

**Note**: Not critical for MVP if all sources have RSS feeds. Can defer to v0.3.0.

---

### Task 4.3: Implement Categorization Logic
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 3.1

**Steps**:
1. Open `src/organizer.js`
2. Implement `categorizeItem(item)`:
   - If item already has category (from source config), return as-is
   - Check title/summary for keywords:
     - **Courses**: "course", "tutorial", "learn", "introduction", "beginner", "workshop"
     - **News**: "release", "launch", "announce", "update"
     - **Reading**: "paper", "research", "study", "arxiv"
   - Default to "reading" if no match
   - Return item with category assigned
3. Implement `categorizeAll(items)`:
   - Map items through `categorizeItem()`
   - Return categorized items array
4. Export functions

**Acceptance Criteria**:
- [ ] Respects pre-assigned categories from source config
- [ ] Applies keyword-based categorization if no category
- [ ] Defaults to "reading" if no keyword match
- [ ] Case-insensitive keyword matching

**Test**:
```javascript
const { categorizeItem } = require('./organizer');

const item1 = { title: 'Learn Deep Learning' };
const item2 = { title: 'New GPT Model Released' };
const item3 = { title: 'Research Paper on Transformers' };

console.log(categorizeItem(item1).category); // 'courses'
console.log(categorizeItem(item2).category); // 'news'
console.log(categorizeItem(item3).category); // 'reading'
```

---

## Phase 5: API Server

### Task 5.1: Create Express App
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 1.2, Task 2.1

**Steps**:
1. Open `src/server.js`
2. Import dependencies:
   ```javascript
   const express = require('express');
   const cors = require('cors');
   const path = require('path');
   const db = require('./db');
   const chalk = require('chalk');
   ```
3. Create Express app:
   ```javascript
   const app = express();
   const PORT = process.env.PORT || 3000;
   ```
4. Add middleware:
   - `app.use(cors())`
   - `app.use(express.json())`
   - `app.use(express.static('public'))`
5. Initialize database:
   ```javascript
   const database = db.initDatabase();
   ```
6. Start server:
   ```javascript
   app.listen(PORT, () => {
     console.log(chalk.green(`Server running on http://localhost:${PORT}`));
   });
   ```

**Acceptance Criteria**:
- [ ] Express app created
- [ ] CORS enabled
- [ ] JSON body parsing enabled
- [ ] Static files served from `public/`
- [ ] Database initialized on startup
- [ ] Server listens on port 3000 (or PORT env var)

---

### Task 5.2: Implement POST /api/fetch Endpoint
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 5.1, Task 4.1, Task 4.3

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.post('/api/fetch', async (req, res) => {
     try {
       // Fetch from all RSS sources
       const items = await fetchAllRSS(config.sources);
       
       // Categorize items
       const categorized = categorizeAll(items);
       
       // Add manual resources
       const allItems = [...categorized, ...config.manualResources];
       
       // Insert into database
       const count = insertItems(database, allItems);
       
       res.json({ success: true, count });
     } catch (error) {
       console.error(chalk.red('Fetch error:'), error.message);
       res.status(500).json({ error: 'Failed to fetch items' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Fetches from all RSS sources
- [ ] Categorizes items
- [ ] Inserts into database
- [ ] Returns count of new items
- [ ] Handles errors (returns 500 with message)

---

### Task 5.3: Implement GET /api/items Endpoint
**Priority**: Critical  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 5.1, Task 2.3

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.get('/api/items', (req, res) => {
     try {
       const { category, checked } = req.query;
       const filters = {};
       
       if (category) filters.category = category;
       if (checked !== undefined) filters.checked = parseInt(checked);
       
       const items = db.getItems(database, filters);
       res.json(items);
     } catch (error) {
       console.error(chalk.red('Get items error:'), error.message);
       res.status(500).json({ error: 'Failed to get items' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Returns all items if no filters
- [ ] Filters by category query param
- [ ] Filters by checked query param
- [ ] Returns JSON array
- [ ] Handles errors (returns 500)

---

### Task 5.4: Implement POST /api/items/:id/toggle Endpoint
**Priority**: High  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 5.1, Task 2.4

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.post('/api/items/:id/toggle', (req, res) => {
     try {
       const { id } = req.params;
       const checked = db.toggleItem(database, parseInt(id));
       
       if (checked === null) {
         return res.status(404).json({ error: 'Item not found' });
       }
       
       res.json({ success: true, checked });
     } catch (error) {
       console.error(chalk.red('Toggle error:'), error.message);
       res.status(500).json({ error: 'Failed to toggle item' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Toggles checked state
- [ ] Returns new checked value
- [ ] Returns 404 if item not found
- [ ] Handles errors (returns 500)

---

### Task 5.5: Implement POST /api/items/:id/vote Endpoint
**Priority**: High  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 5.1, Task 2.5

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.post('/api/items/:id/vote', (req, res) => {
     try {
       const { id } = req.params;
       const { type } = req.body;
       
       if (type !== 'up' && type !== 'down') {
         return res.status(400).json({ error: 'Invalid vote type' });
       }
       
       const votes = db.voteItem(database, parseInt(id), type);
       
       if (votes === null) {
         return res.status(404).json({ error: 'Item not found' });
       }
       
       res.json({ success: true, ...votes });
     } catch (error) {
       console.error(chalk.red('Vote error:'), error.message);
       res.status(500).json({ error: 'Failed to vote on item' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Accepts vote type ('up' or 'down')
- [ ] Increments upvotes or downvotes
- [ ] Returns updated counts
- [ ] Returns 400 if invalid vote type
- [ ] Returns 404 if item not found

---

### Task 5.6: Implement GET /api/stats Endpoint
**Priority**: Medium  
**Estimated Time**: 10 minutes  
**Dependencies**: Task 5.1, Task 2.6

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.get('/api/stats', (req, res) => {
     try {
       const stats = db.getStats(database);
       res.json(stats);
     } catch (error) {
       console.error(chalk.red('Stats error:'), error.message);
       res.status(500).json({ error: 'Failed to get stats' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Returns stats object: `{ total, checked, news, courses, reading }`
- [ ] Handles errors (returns 500)

---

### Task 5.7: Implement GET /api/sources/top Endpoint
**Priority**: Medium  
**Estimated Time**: 10 minutes  
**Dependencies**: Task 5.1, Task 2.7

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.get('/api/sources/top', (req, res) => {
     try {
       const topSources = db.getTopSources(database);
       res.json(topSources);
     } catch (error) {
       console.error(chalk.red('Top sources error:'), error.message);
       res.status(500).json({ error: 'Failed to get top sources' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Returns top 10 sources by net votes
- [ ] Each source has: `{ source, netVotes }`
- [ ] Handles errors (returns 500)

---

### Task 5.8: Implement GET /api/journey Endpoint
**Priority**: Medium  
**Estimated Time**: 10 minutes  
**Dependencies**: Task 5.1, Task 2.8

**Steps**:
1. In `src/server.js`, add route:
   ```javascript
   app.get('/api/journey', (req, res) => {
     try {
       const journey = db.getJourneyStats(database);
       res.json(journey);
     } catch (error) {
       console.error(chalk.red('Journey error:'), error.message);
       res.status(500).json({ error: 'Failed to get journey stats' });
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Returns journey stats: `{ totalChecked, milestones }`
- [ ] Handles errors (returns 500)

---

## Phase 6: Command-Line Interface

### Task 6.1: Create CLI Entry Point
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 1.2, Task 2.1, Task 4.1

**Steps**:
1. Open `src/index.js`
2. Add shebang: `#!/usr/bin/env node`
3. Import dependencies:
   ```javascript
   const { Command } = require('commander');
   const chalk = require('chalk');
   const db = require('./db');
   const config = require('./config');
   const { fetchAllRSS } = require('./sources/rssSource');
   const { categorizeAll } = require('./organizer');
   ```
4. Create commander program:
   ```javascript
   const program = new Command();
   program.version('0.2.0');
   ```

**Acceptance Criteria**:
- [ ] Shebang line added
- [ ] Dependencies imported
- [ ] Commander program created

---

### Task 6.2: Implement 'fetch' Command
**Priority**: High  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 6.1

**Steps**:
1. In `src/index.js`, add command:
   ```javascript
   program
     .command('fetch')
     .description('Fetch new items from all sources')
     .action(async () => {
       console.log(chalk.blue('Fetching items...'));
       
       const database = db.initDatabase();
       const items = await fetchAllRSS(config.sources);
       const categorized = categorizeAll(items);
       const allItems = [...categorized, ...config.manualResources];
       const count = db.insertItems(database, allItems);
       
       console.log(chalk.green(`✓ Fetched ${count} new items`));
       process.exit(0);
     });
   ```

**Acceptance Criteria**:
- [ ] Fetches from all sources
- [ ] Categorizes items
- [ ] Inserts into database
- [ ] Prints success message with count
- [ ] Exits with code 0

---

### Task 6.3: Implement 'stats' Command
**Priority**: Medium  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 6.1

**Steps**:
1. In `src/index.js`, add command:
   ```javascript
   program
     .command('stats')
     .description('Show database statistics')
     .action(() => {
       const database = db.initDatabase();
       const stats = db.getStats(database);
       
       console.log(chalk.bold('\nDatabase Statistics:'));
       console.log(chalk.cyan(`Total items: ${stats.total}`));
       console.log(chalk.green(`Checked: ${stats.checked}`));
       console.log(chalk.yellow(`News: ${stats.news}`));
       console.log(chalk.magenta(`Courses: ${stats.courses}`));
       console.log(chalk.blue(`Reading: ${stats.reading}`));
       
       process.exit(0);
     });
   ```

**Acceptance Criteria**:
- [ ] Displays total, checked, news, courses, reading counts
- [ ] Uses colored output (chalk)
- [ ] Exits with code 0

---

### Task 6.4: Parse CLI Arguments
**Priority**: High  
**Estimated Time**: 5 minutes  
**Dependencies**: Task 6.1, Task 6.2, Task 6.3

**Steps**:
1. At end of `src/index.js`:
   ```javascript
   program.parse(process.argv);
   ```

**Acceptance Criteria**:
- [ ] CLI commands work: `node src/index.js fetch`
- [ ] CLI commands work: `node src/index.js stats`
- [ ] Help displays: `node src/index.js --help`

---

## Phase 7: Frontend

### Task 7.1: Create HTML Structure
**Priority**: Critical  
**Estimated Time**: 45 minutes  
**Dependencies**: None

**Steps**:
1. Open `public/index.html`
2. Create HTML structure:
   ```html
   <!DOCTYPE html>
   <html lang="en">
   <head>
     <meta charset="UTF-8">
     <meta name="viewport" content="width=device-width, initial-scale=1.0">
     <title>AI News & Learning Hub</title>
   </head>
   <body>
     <header>
       <h1>🤖 AI News & Learning Hub</h1>
       <div id="stats-bar"></div>
       <button id="fetch-btn">🔄 Fetch New Content</button>
     </header>
     
     <nav id="tabs">
       <button class="tab active" data-filter="all">All</button>
       <button class="tab" data-filter="news">📰 News</button>
       <button class="tab" data-filter="courses">🎓 Courses</button>
       <button class="tab" data-filter="reading">📚 Reading</button>
       <button class="tab" data-filter="journey">🚀 Journey</button>
     </nav>
     
     <main id="content">
       <div id="items-container"></div>
       <div id="journey-view" style="display: none;"></div>
     </main>
     
     <div id="celebration-modal" style="display: none;">
       <div class="modal-content">
         <h2>🎉 Milestone Achieved!</h2>
         <p id="milestone-text"></p>
         <img id="celebration-gif" src="" alt="Celebration">
       </div>
     </div>
   </body>
   </html>
   ```

**Acceptance Criteria**:
- [ ] Header with title, stats bar, fetch button
- [ ] Tab navigation (All, News, Courses, Reading, Journey)
- [ ] Main content area for items and journey view
- [ ] Hidden celebration modal

---

### Task 7.2: Add CSS Styling
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: Task 7.1

**Steps**:
1. In `public/index.html`, add `<style>` tag in `<head>`
2. Add CSS:
   - Reset styles (`*, *::before, *::after { box-sizing: border-box; }`)
   - Body styles (font, background, padding)
   - Header styles (title, stats bar, fetch button)
   - Tab navigation (active tab highlighting)
   - Item cards (layout, shadows, hover effects)
   - Checkbox and vote button styles
   - Journey view (progress circle, milestones)
   - Modal overlay and content
   - Responsive breakpoints (mobile, tablet, desktop)

**Acceptance Criteria**:
- [ ] Clean, modern design
- [ ] Card-based layout for items
- [ ] Active tab highlighted
- [ ] Responsive on mobile/tablet/desktop
- [ ] Hover effects on interactive elements

---

### Task 7.3: Implement JavaScript - Data Fetching
**Priority**: Critical  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 7.1, Task 5.2, Task 5.3

**Steps**:
1. In `public/index.html`, add `<script>` tag before `</body>`
2. Implement `fetchItems(filters = {})`:
   ```javascript
   async function fetchItems(filters = {}) {
     const params = new URLSearchParams(filters);
     const res = await fetch(`/api/items?${params}`);
     const items = await res.json();
     return items;
   }
   ```
3. Implement `fetchNewContent()`:
   ```javascript
   async function fetchNewContent() {
     const btn = document.getElementById('fetch-btn');
     btn.disabled = true;
     btn.textContent = '⏳ Fetching...';
     
     const res = await fetch('/api/fetch', { method: 'POST' });
     const data = await res.json();
     
     btn.disabled = false;
     btn.textContent = '🔄 Fetch New Content';
     alert(`Fetched ${data.count} new items!`);
     
     loadItems();
   }
   ```

**Acceptance Criteria**:
- [ ] `fetchItems()` calls GET /api/items with filters
- [ ] `fetchNewContent()` calls POST /api/fetch
- [ ] Fetch button disables during fetch
- [ ] Success message displays count

---

### Task 7.4: Implement JavaScript - Render Items
**Priority**: Critical  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 7.3

**Steps**:
1. Implement `renderItems(items)`:
   ```javascript
   function renderItems(items) {
     const container = document.getElementById('items-container');
     
     if (items.length === 0) {
       container.innerHTML = '<p class="empty">No items found.</p>';
       return;
     }
     
     container.innerHTML = items.map(item => `
       <div class="item-card">
         <div class="item-header">
           <input type="checkbox" id="check-${item.id}" 
                  ${item.checked ? 'checked' : ''} 
                  onchange="toggleItem(${item.id})">
           <h3><a href="${item.url}" target="_blank">${item.title}</a></h3>
         </div>
         <p class="summary">${item.summary || ''}</p>
         <div class="item-footer">
           <span class="source">${item.source}</span>
           <span class="date">${formatDate(item.date)}</span>
           <div class="votes">
             <button onclick="voteItem(${item.id}, 'up')">👍 ${item.upvotes}</button>
             <button onclick="voteItem(${item.id}, 'down')">👎 ${item.downvotes}</button>
           </div>
         </div>
       </div>
     `).join('');
   }
   ```
2. Implement `formatDate(dateString)`:
   - Parse ISO date string
   - Return formatted: "Oct 20, 2024"

**Acceptance Criteria**:
- [ ] Renders item cards with all fields
- [ ] Checkbox reflects checked state
- [ ] Title is clickable link
- [ ] Vote buttons display counts
- [ ] Empty state shows "No items found"

---

### Task 7.5: Implement JavaScript - Toggle & Vote
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 7.4, Task 5.4, Task 5.5

**Steps**:
1. Implement `toggleItem(id)`:
   ```javascript
   async function toggleItem(id) {
     const checkbox = document.getElementById(`check-${id}`);
     const originalState = checkbox.checked;
     
     try {
       const res = await fetch(`/api/items/${id}/toggle`, { method: 'POST' });
       const data = await res.json();
       
       checkbox.checked = data.checked === 1;
       updateStats();
       checkMilestone();
     } catch (error) {
       checkbox.checked = originalState;
       alert('Failed to update item. Please try again.');
     }
   }
   ```
2. Implement `voteItem(id, type)`:
   ```javascript
   async function voteItem(id, type) {
     try {
       const res = await fetch(`/api/items/${id}/vote`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ type })
       });
       const data = await res.json();
       
       // Update vote counts in UI
       const card = document.querySelector(`#check-${id}`).closest('.item-card');
       const voteButtons = card.querySelectorAll('.votes button');
       voteButtons[0].textContent = `👍 ${data.upvotes}`;
       voteButtons[1].textContent = `👎 ${data.downvotes}`;
     } catch (error) {
       alert('Failed to vote. Please try again.');
     }
   }
   ```

**Acceptance Criteria**:
- [ ] Toggle checkbox persists state
- [ ] Optimistic UI update (checkbox toggles immediately)
- [ ] Reverts on API failure
- [ ] Vote buttons increment counts
- [ ] Updates stats after toggle

---

### Task 7.6: Implement JavaScript - Stats Bar
**Priority**: Medium  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 7.3, Task 5.6

**Steps**:
1. Implement `updateStats()`:
   ```javascript
   async function updateStats() {
     const res = await fetch('/api/stats');
     const stats = await res.json();
     
     const statsBar = document.getElementById('stats-bar');
     statsBar.innerHTML = `
       <span>Total: ${stats.total}</span>
       <span>✓ Checked: ${stats.checked}</span>
       <span>📰 News: ${stats.news}</span>
       <span>🎓 Courses: ${stats.courses}</span>
       <span>📚 Reading: ${stats.reading}</span>
     `;
   }
   ```
2. Call `updateStats()` on page load and after toggle

**Acceptance Criteria**:
- [ ] Stats bar displays 5 counts
- [ ] Updates after fetch, toggle operations
- [ ] Uses emoji icons

---

### Task 7.7: Implement JavaScript - Tab Switching
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 7.4

**Steps**:
1. Implement `switchTab(filter)`:
   ```javascript
   async function switchTab(filter) {
     // Update active tab
     document.querySelectorAll('.tab').forEach(tab => {
       tab.classList.remove('active');
       if (tab.dataset.filter === filter) tab.classList.add('active');
     });
     
     // Show items or journey view
     const itemsContainer = document.getElementById('items-container');
     const journeyView = document.getElementById('journey-view');
     
     if (filter === 'journey') {
       itemsContainer.style.display = 'none';
       journeyView.style.display = 'block';
       loadJourney();
     } else {
       itemsContainer.style.display = 'block';
       journeyView.style.display = 'none';
       
       const filters = filter === 'all' ? {} : { category: filter };
       const items = await fetchItems(filters);
       renderItems(items);
     }
   }
   ```
2. Add event listeners to tab buttons:
   ```javascript
   document.querySelectorAll('.tab').forEach(tab => {
     tab.addEventListener('click', () => switchTab(tab.dataset.filter));
   });
   ```

**Acceptance Criteria**:
- [ ] Clicking tab filters items
- [ ] Active tab highlighted
- [ ] Journey tab shows journey view
- [ ] Other tabs show items list

---

### Task 7.8: Implement JavaScript - Journey View
**Priority**: Medium  
**Estimated Time**: 45 minutes  
**Dependencies**: Task 7.3, Task 5.7, Task 5.8

**Steps**:
1. Implement `loadJourney()`:
   ```javascript
   async function loadJourney() {
     const [journeyRes, sourcesRes] = await Promise.all([
       fetch('/api/journey'),
       fetch('/api/sources/top')
     ]);
     
     const journey = await journeyRes.json();
     const topSources = await sourcesRes.json();
     
     const journeyView = document.getElementById('journey-view');
     journeyView.innerHTML = `
       <div class="journey-stats">
         <div class="progress-circle">
           <span class="progress-count">${journey.totalChecked}</span>
           <span class="progress-label">Items Completed</span>
         </div>
         
         <div class="milestones">
           <h3>Milestones</h3>
           ${journey.milestones.map(m => `
             <div class="milestone ${m.achieved ? 'achieved' : ''}">
               ${m.achieved ? '✅' : '⭕'} ${m.count} Items
             </div>
           `).join('')}
         </div>
         
         <div class="top-sources">
           <h3>Top Sources</h3>
           <ol>
             ${topSources.map(s => `
               <li>${s.source} <span class="net-votes">(+${s.netVotes})</span></li>
             `).join('')}
           </ol>
         </div>
       </div>
     `;
   }
   ```

**Acceptance Criteria**:
- [ ] Displays total checked count
- [ ] Shows progress circle (styled with CSS)
- [ ] Lists milestones with achievement status
- [ ] Shows top 5 sources with net votes

---

### Task 7.9: Implement JavaScript - Celebration Modal
**Priority**: Medium  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 7.5

**Steps**:
1. Define celebration GIF URLs:
   ```javascript
   const celebrationGIFs = [
     'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
     'https://media.giphy.com/media/l0MYt5jPR6QX5pnqM/giphy.gif',
     // ... add 5+ GIF URLs
   ];
   ```
2. Implement `checkMilestone()`:
   ```javascript
   async function checkMilestone() {
     const res = await fetch('/api/journey');
     const journey = await res.json();
     const totalChecked = journey.totalChecked;
     
     const milestones = [5, 10, 20, 50, 100];
     const lastMilestone = parseInt(localStorage.getItem('lastMilestone') || '0');
     
     for (const milestone of milestones) {
       if (totalChecked >= milestone && lastMilestone < milestone) {
         showCelebration(milestone);
         localStorage.setItem('lastMilestone', milestone.toString());
         break;
       }
     }
   }
   ```
3. Implement `showCelebration(milestone)`:
   ```javascript
   function showCelebration(milestone) {
     const modal = document.getElementById('celebration-modal');
     const text = document.getElementById('milestone-text');
     const gif = document.getElementById('celebration-gif');
     
     text.textContent = `${milestone} Items Completed! 🎉`;
     gif.src = celebrationGIFs[Math.floor(Math.random() * celebrationGIFs.length)];
     
     modal.style.display = 'flex';
     
     setTimeout(() => {
       modal.style.display = 'none';
     }, 3000);
   }
   ```
4. Add click-to-dismiss:
   ```javascript
   document.getElementById('celebration-modal').addEventListener('click', (e) => {
     if (e.target.id === 'celebration-modal') {
       e.target.style.display = 'none';
     }
   });
   ```

**Acceptance Criteria**:
- [ ] Checks for milestones after toggle
- [ ] Shows modal on milestone achievement
- [ ] Displays random celebration GIF
- [ ] Auto-dismisses after 3 seconds
- [ ] Click overlay to dismiss manually
- [ ] Tracks last milestone in localStorage (don't repeat)

---

### Task 7.10: Implement JavaScript - Page Load
**Priority**: Critical  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 7.3, Task 7.4, Task 7.6

**Steps**:
1. Implement `init()`:
   ```javascript
   async function init() {
     updateStats();
     switchTab('all');
   }
   ```
2. Add event listener:
   ```javascript
   document.addEventListener('DOMContentLoaded', init);
   ```
3. Add fetch button event listener:
   ```javascript
   document.getElementById('fetch-btn').addEventListener('click', fetchNewContent);
   ```

**Acceptance Criteria**:
- [ ] Page loads and displays all items
- [ ] Stats bar populated
- [ ] Fetch button functional

---

## Phase 8: Docker Deployment

### Task 8.1: Create Dockerfile
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: All previous tasks

**Steps**:
1. Create `Dockerfile` in project root:
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
   COPY src/ ./src/
   COPY public/ ./public/
   
   # Create data directory
   RUN mkdir -p /app/data
   
   # Expose port
   EXPOSE 3000
   
   # Start server
   CMD ["node", "src/server.js"]
   ```

**Acceptance Criteria**:
- [ ] Uses `node:20-alpine` base image
- [ ] Installs build dependencies (python3, make, g++)
- [ ] Copies package files separately (layer caching)
- [ ] Installs production dependencies only
- [ ] Copies source code
- [ ] Creates `/app/data` directory
- [ ] Exposes port 3000
- [ ] Starts server with `node src/server.js`

---

### Task 8.2: Create docker-compose.yml
**Priority**: High  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 8.1

**Steps**:
1. Create `docker-compose.yml` in project root:
   ```yaml
   version: '3.8'
   
   services:
     ai-agent:
       build: .
       container_name: ai-agent
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

**Acceptance Criteria**:
- [ ] Defines single service `ai-agent`
- [ ] Maps port 3000 to host
- [ ] Mounts named volume `ai-agent-data` to `/app/data`
- [ ] Sets PORT environment variable
- [ ] Restart policy: `unless-stopped`

---

### Task 8.3: Create .dockerignore
**Priority**: Medium  
**Estimated Time**: 5 minutes  
**Dependencies**: None

**Steps**:
1. Create `.dockerignore` in project root:
   ```
   node_modules
   data/*.db
   data/*.db-shm
   data/*.db-wal
   .git
   .gitignore
   README.md
   *.log
   ```

**Acceptance Criteria**:
- [ ] `.dockerignore` exists
- [ ] Excludes `node_modules` (installed in container)
- [ ] Excludes `data/` (volume-mounted)
- [ ] Excludes `.git` and other non-runtime files

---

### Task 8.4: Test Docker Build
**Priority**: High  
**Estimated Time**: 15 minutes  
**Dependencies**: Task 8.1, Task 8.2, Task 8.3

**Steps**:
1. Build image:
   ```bash
   docker-compose build
   ```
2. Verify build completes without errors
3. Check image size:
   ```bash
   docker images ai-agent
   ```
   (Expected: ~150-200 MB)

**Acceptance Criteria**:
- [ ] Build completes successfully
- [ ] Image size < 250 MB
- [ ] No build errors or warnings

---

### Task 8.5: Test Docker Run
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 8.4

**Steps**:
1. Start container:
   ```bash
   docker-compose up
   ```
2. Verify server starts (check logs)
3. Open browser to http://localhost:3000
4. Verify UI loads
5. Test fetch functionality
6. Test checkbox toggle (verify persistence)
7. Stop container: `docker-compose down`
8. Restart: `docker-compose up`
9. Verify data persisted (database still has items)

**Acceptance Criteria**:
- [ ] Container starts successfully
- [ ] UI accessible at http://localhost:3000
- [ ] Fetch functionality works
- [ ] Checkbox state persists after restart
- [ ] Volume-mounted data survives container recreation

---

## Phase 9: Documentation

### Task 9.1: Write README.md
**Priority**: High  
**Estimated Time**: 45 minutes  
**Dependencies**: All previous tasks

**Steps**:
1. Create `README.md` with sections:
   - Title and one-sentence description
   - Features list with emojis
   - Quick Start (Docker Compose)
   - Manual Installation (Node.js)
   - Usage (CLI commands, UI walkthrough)
   - API Documentation (8 endpoints)
   - Project Structure
   - Configuration (adding sources)
   - Troubleshooting
   - License

**Acceptance Criteria**:
- [ ] Clear, concise README
- [ ] Quick Start section with 3 steps max
- [ ] Feature list with emojis
- [ ] API documentation with examples
- [ ] Troubleshooting common issues

---

### Task 9.2: Write QUICKSTART.md
**Priority**: Medium  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 9.1

**Steps**:
1. Create `QUICKSTART.md` with:
   - Prerequisites (Docker installed)
   - Step 1: Clone repo
   - Step 2: Run `docker-compose up`
   - Step 3: Open http://localhost:3000
   - Step 4: Click "Fetch New Content"
   - Estimated time: 5 minutes

**Acceptance Criteria**:
- [ ] Get user running in < 5 minutes
- [ ] No assumptions about prior knowledge
- [ ] Clear, numbered steps

---

### Task 9.3: Write SETUP.md
**Priority**: Medium  
**Estimated Time**: 30 minutes  
**Dependencies**: Task 9.1

**Steps**:
1. Create `SETUP.md` with:
   - System requirements
   - Manual installation (without Docker)
   - Database initialization
   - Adding custom RSS feeds
   - Port configuration
   - Troubleshooting build issues (better-sqlite3)

**Acceptance Criteria**:
- [ ] Covers non-Docker setup
- [ ] Explains configuration options
- [ ] Troubleshoots common issues (native dependencies)

---

### Task 9.4: Write RESOURCES.md
**Priority**: Low  
**Estimated Time**: 20 minutes  
**Dependencies**: Task 3.1, Task 3.2

**Steps**:
1. Create `RESOURCES.md` listing:
   - All 20+ RSS feeds (with URLs)
   - All manual resources (courses)
   - How to add new sources
   - How to request source additions (GitHub issues)

**Acceptance Criteria**:
- [ ] Complete list of all data sources
- [ ] Organized by category
- [ ] Instructions for adding sources

---

### Task 9.5: Write CHANGELOG.md
**Priority**: Low  
**Estimated Time**: 15 minutes  
**Dependencies**: All previous tasks

**Steps**:
1. Create `CHANGELOG.md` with:
   - v0.1.0 (MVP): Basic aggregation, checkbox tracking, Docker
   - v0.2.0 (Gamification): Voting, journey, celebrations, top sources
   - Future releases (TBD)

**Acceptance Criteria**:
- [ ] Follows standard changelog format
- [ ] Lists features per version
- [ ] Dated releases

---

## Phase 10: Testing & Polish

### Task 10.1: Manual Testing - Database Operations
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Phase 2

**Test Cases**:
1. Insert 10 items, verify all inserted
2. Insert duplicate URL, verify skipped
3. Query by category, verify correct items returned
4. Toggle checkbox, verify state changes
5. Vote on item, verify counts increment
6. Query stats, verify accurate counts
7. Query top sources, verify correct ranking

**Acceptance Criteria**:
- [ ] All database functions work as expected
- [ ] No errors logged
- [ ] Data persists after restart

---

### Task 10.2: Manual Testing - API Endpoints
**Priority**: High  
**Estimated Time**: 45 minutes  
**Dependencies**: Phase 5

**Test Cases** (use curl or Postman):
1. POST /api/fetch - Verify fetches and returns count
2. GET /api/items - Verify returns all items
3. GET /api/items?category=news - Verify filters by category
4. POST /api/items/1/toggle - Verify toggles state
5. POST /api/items/1/vote (type: up) - Verify increments upvotes
6. GET /api/stats - Verify returns accurate stats
7. GET /api/sources/top - Verify returns top 10
8. GET /api/journey - Verify returns journey data

**Acceptance Criteria**:
- [ ] All endpoints return correct data
- [ ] Error handling works (404, 400, 500)
- [ ] Response times < 200ms (except /api/fetch)

---

### Task 10.3: Manual Testing - Frontend
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: Phase 7

**Test Cases**:
1. Page loads, all items displayed
2. Click "News" tab, only news items shown
3. Click checkbox, state persists after refresh
4. Click upvote, count increments immediately
5. Check 5 items, celebration modal appears
6. Click "Journey" tab, progress view displayed
7. Fetch new content, items update
8. Test on mobile device, verify responsive

**Acceptance Criteria**:
- [ ] All UI interactions work
- [ ] No console errors
- [ ] Responsive on mobile/tablet/desktop
- [ ] Celebration modal displays correctly

---

### Task 10.4: Manual Testing - Docker
**Priority**: High  
**Estimated Time**: 30 minutes  
**Dependencies**: Phase 8

**Test Cases**:
1. Build image, verify completes without errors
2. Start container, verify server starts
3. Access UI, verify loads
4. Fetch items, verify data persisted
5. Stop container, restart, verify data still present
6. Remove container, recreate, verify volume data survives

**Acceptance Criteria**:
- [ ] Docker build < 20 seconds
- [ ] Container starts < 5 seconds
- [ ] Data persists across container recreations
- [ ] No errors in logs

---

### Task 10.5: Code Review & Cleanup
**Priority**: Medium  
**Estimated Time**: 1 hour  
**Dependencies**: All previous tasks

**Steps**:
1. Remove console.log statements (keep chalk logging)
2. Add error handling to all async functions
3. Validate function parameters
4. Add JSDoc comments to all functions
5. Check for hardcoded values (move to config)
6. Format code consistently (indentation, spacing)

**Acceptance Criteria**:
- [ ] No console.log statements in production code
- [ ] All functions have error handling
- [ ] Code is well-commented
- [ ] Consistent code style

---

### Task 10.6: Performance Testing
**Priority**: Low  
**Estimated Time**: 30 minutes  
**Dependencies**: All previous tasks

**Test Cases**:
1. Measure server startup time (should be < 3s)
2. Measure API response times (should be < 200ms)
3. Measure /api/fetch time (should be < 60s)
4. Measure UI load time (should be < 1s)
5. Test with 1000+ items (verify UI responsive)

**Acceptance Criteria**:
- [ ] All performance targets met
- [ ] No bottlenecks identified
- [ ] UI remains responsive with large datasets

---

## Task Summary

### Critical Path Tasks (Must Complete for MVP)
- Phase 1: Project Setup (Tasks 1.1-1.4)
- Phase 2: Database Layer (Tasks 2.1-2.3)
- Phase 3: Configuration (Task 3.1)
- Phase 4: Data Fetching (Task 4.1)
- Phase 5: API Server (Tasks 5.1-5.3)
- Phase 7: Frontend (Tasks 7.1, 7.3-7.5, 7.10)
- Phase 8: Docker Deployment (Tasks 8.1-8.5)

### Total Estimated Time
- Phase 1: 35 minutes
- Phase 2: 3.5 hours
- Phase 3: 50 minutes
- Phase 4: 45 minutes
- Phase 5: 2.5 hours
- Phase 6: 1.5 hours
- Phase 7: 6 hours
- Phase 8: 1.5 hours
- Phase 9: 2.5 hours
- Phase 10: 4 hours

**Total: ~23 hours (3 work days)**

---

**Tasks Document Version**: 1.0  
**Last Updated**: October 2025  
**Status**: Complete and ready for implementation
