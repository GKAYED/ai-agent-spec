# Setup

## Requirements
- Node.js 20.x, npm 10.x
- Or Docker 24+

## Local Install
```
npm install
```

## Database
- Auto-initialized at first run in `data/resources.db`
- Docker mounts a named volume `ai-agent-data` to `/app/data`

## Troubleshooting
- better-sqlite3 build on Windows may require build tools; Docker avoids this by building in Alpine.
- If RSS feeds timeout, try again; partial failures are logged and skipped.
