# AI News & Learning Resource Aggregator (Implementation 2 - GPT-5)

Single-user, local-first web app that aggregates AI news, courses, and reading materials, with progress tracking, voting, journey visualization, and Dockerized deployment.

## Features
- 🔄 Fetch from 20+ curated RSS feeds
- 🗂️ Categorization: News, Courses, Reading
- ✅ Persistent checkbox progress
- 👍👎 Voting with top sources ranking
- 🚀 Journey view with milestones (5,10,20,50,100)
- 🥳 Celebration modal with GIFs
- 🐳 Dockerized runtime (alpine-based)

## Quick Start (Docker)
1. Build and run
   ```
   docker-compose up --build
   ```
2. Open http://localhost:3000
3. Click "Fetch New Content"

## Local Dev (Node.js)
```
npm install
npm run fetch   # or: node src/index.js fetch
npm start       # starts server on :3000
```

## API Endpoints
- POST /api/fetch
- GET /api/items?category=&checked=
- POST /api/items/:id/toggle
- POST /api/items/:id/vote  { type: 'up'|'down' }
- GET /api/stats
- GET /api/sources/top
- GET /api/journey

## Structure
```
ai-agent/
  public/index.html
  src/
    server.js
    index.js
    db.js
    config.js
    organizer.js
    sources/
      rssSource.js
      webScraper.js
  Dockerfile
  docker-compose.yml
  package.json
```

## License
MIT
