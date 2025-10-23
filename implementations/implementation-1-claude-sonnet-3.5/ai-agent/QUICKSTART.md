# Quick Start Guide

Get the AI News & Learning Resource Aggregator running in 5 minutes!

## Option 1: Docker (Recommended)

**Prerequisites**: Docker and Docker Compose installed

```bash
# 1. Navigate to project directory
cd ai-agent

# 2. Start with Docker Compose
docker-compose up

# 3. Open browser
http://localhost:3000

# 4. Click "Fetch New Content" in the UI
```

That's it! The application is running and data persists in a Docker volume.

## Option 2: Manual Setup

**Prerequisites**: Node.js 20.x installed

```bash
# 1. Navigate to project directory
cd ai-agent

# 2. Install dependencies
npm install

# 3. Fetch initial content
npm run fetch

# 4. Start server
npm start

# 5. Open browser
http://localhost:3000
```

## First Steps

1. **Fetch Content**: Click the "🔄 Fetch New Content" button to aggregate from all sources (takes 30-60 seconds)

2. **Browse**: Use the tabs to filter content:
   - **All**: See everything
   - **News**: Latest AI announcements and updates
   - **Courses**: Educational content and tutorials
   - **Reading**: Research papers and in-depth articles
   - **Journey**: Track your progress

3. **Track Reading**: Check the box next to items you've read

4. **Vote**: Use 👍 and 👎 to rate content quality

5. **Celebrate**: Watch for celebration modals when you hit milestones (5, 10, 20, 50, 100 items)!

## Common Commands

```bash
# Fetch new content (CLI)
npm run fetch

# View statistics (CLI)
npm run stats

# Start server
npm start

# Stop server
Ctrl+C (or Cmd+C on Mac)
```

## Troubleshooting

**Port 3000 already in use?**
```bash
PORT=3001 npm start
```

**Database issues?**
```bash
rm data/resources.db
npm run fetch
npm start
```

**Docker issues?**
```bash
docker-compose down
docker-compose up --build
```

## Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check [SETUP.md](SETUP.md) for advanced configuration
- Explore the API at `http://localhost:3000/api/stats`

---

**Total Setup Time**: ~5 minutes | **First Fetch**: ~60 seconds | **Updates**: Run fetch daily
