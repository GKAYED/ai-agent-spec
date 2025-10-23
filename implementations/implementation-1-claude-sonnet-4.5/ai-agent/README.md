# AI News & Learning Resource Aggregator

> 🤖 Automatically aggregate AI-related content from 20+ trusted sources into a single interface with progress tracking, voting, and gamification features.

[![Node.js](https://img.shields.io/badge/Node.js-20.x-green)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue)](Dockerfile)

## Features

- 📰 **Automatic Aggregation**: Fetch content from 20+ RSS feeds (arXiv, OpenAI, Google AI, etc.)
- 🗂️ **Smart Categorization**: Auto-categorize into News, Courses, and Reading
- ✅ **Progress Tracking**: Mark items as read with persistent checkboxes
- 👍 **Voting System**: Upvote/downvote content to identify quality sources
- 🎯 **Journey Visualization**: Track milestones (5, 10, 20, 50, 100 items)
- 🎉 **Gamification**: Celebration modals with GIFs at milestone achievements
- 🐳 **Docker Ready**: One-command deployment with docker-compose
- 💾 **Local-First**: SQLite database, no cloud dependencies
- 🎨 **Beautiful UI**: Modern, responsive single-page application

## Quick Start (Docker)

```bash
# Clone the repository
git clone <repository-url>
cd ai-agent

# Start with Docker Compose
docker-compose up

# Open browser
http://localhost:3000
```

## Manual Installation

### Prerequisites

- Node.js 20.x LTS ([Download](https://nodejs.org/))
- npm (comes with Node.js)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Fetch initial content
npm run fetch

# 3. Start the server
npm start

# 4. Open browser
http://localhost:3000
```

## Usage

### Web Interface

1. **Fetch Content**: Click "🔄 Fetch New Content" to aggregate from all sources
2. **Browse Items**: Use tabs (All, News, Courses, Reading, Journey) to filter
3. **Track Progress**: Check boxes to mark items as read
4. **Vote**: Use 👍/👎 buttons to rate content quality
5. **View Journey**: Check the Journey tab for progress and milestones

### Command Line

```bash
# Fetch new content
npm run fetch

# View statistics
npm run stats
```

## API Documentation

The application exposes a REST API on port 3000:

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/fetch` | Fetch new content from all sources |
| `GET` | `/api/items` | Get items (query: `?category=news&checked=0`) |
| `POST` | `/api/items/:id/toggle` | Toggle checked state |
| `POST` | `/api/items/:id/vote` | Vote (body: `{type: "up"}` or `{type: "down"}`) |
| `GET` | `/api/stats` | Get aggregate statistics |
| `GET` | `/api/sources/top` | Get top-voted sources |
| `GET` | `/api/journey` | Get progress and milestones |

### Example API Calls

```bash
# Fetch new content
curl -X POST http://localhost:3000/api/fetch

# Get all items
curl http://localhost:3000/api/items

# Get news items only
curl http://localhost:3000/api/items?category=news

# Toggle item #1
curl -X POST http://localhost:3000/api/items/1/toggle

# Upvote item #1
curl -X POST http://localhost:3000/api/items/1/vote \
  -H "Content-Type: application/json" \
  -d '{"type":"up"}'

# Get statistics
curl http://localhost:3000/api/stats
```

## Project Structure

```
ai-agent/
├── package.json              # Dependencies and scripts
├── Dockerfile                # Docker image definition
├── docker-compose.yml        # Docker Compose configuration
├── README.md                 # This file
├── data/                     # SQLite database (auto-created)
│   └── resources.db
├── public/                   # Frontend (static files)
│   └── index.html            # Single-page application
└── src/                      # Backend (Node.js)
    ├── index.js              # CLI entry point
    ├── server.js             # Express API server
    ├── db.js                 # Database operations
    ├── config.js             # Data sources configuration
    ├── organizer.js          # Categorization logic
    └── sources/
        ├── rssSource.js      # RSS feed fetcher
        └── webScraper.js     # Web scraping utilities
```

## Data Sources

The application aggregates content from 20+ sources:

**Research Papers**:
- arXiv (cs.AI, cs.LG, cs.CL, cs.CV)

**Industry Labs**:
- OpenAI Blog
- Google AI Blog
- DeepMind Blog
- Meta AI Blog
- Microsoft Research
- Anthropic News

**News & Aggregators**:
- Hacker News (AI/ML)
- Reddit r/MachineLearning
- TechCrunch AI
- VentureBeat AI
- The Batch (deeplearning.ai)
- Towards Data Science

**Tools & Platforms**:
- Hugging Face Blog
- Papers with Code
- LangChain Blog
- Weights & Biases
- Fast.ai Blog

See `src/config.js` for the complete list with URLs.

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3000` | Server port |
| `NODE_ENV` | `development` | Environment (production/development) |

### Custom Sources

Edit `src/config.js` to add/remove RSS feeds:

```javascript
{
  name: 'Source Name',
  url: 'https://example.com/feed.xml',
  type: 'rss',
  category: 'news' // or 'courses' or 'reading'
}
```

## Docker Deployment

### Build and Run

```bash
# Build image
docker build -t ai-agent .

# Run container
docker run -d -p 3000:3000 -v ai-agent-data:/app/data ai-agent

# Or use docker-compose
docker-compose up -d
```

### Data Persistence

The SQLite database is stored in a Docker volume (`ai-agent-data`), ensuring data persists across container restarts.

## Development

### Prerequisites

- Node.js 20.x
- npm 10.x

### Setup for Development

```bash
# Install dependencies
npm install

# Run server (auto-restart on changes - requires nodemon)
npx nodemon src/server.js

# Run tests (if available)
npm test
```

## Performance

- **Server Startup**: < 3 seconds
- **API Response Time**: < 200ms (except `/api/fetch`)
- **Fetch All Sources**: < 60 seconds for 20+ feeds
- **Database Operations**: < 50ms per query
- **UI Load Time**: < 1 second

## Troubleshooting

### Port Already in Use

```bash
# Change port via environment variable
PORT=3001 npm start
```

### Database Locked

```bash
# Stop all instances
pkill -f "node src/server.js"

# Remove lock files
rm data/*.db-shm data/*.db-wal

# Restart
npm start
```

### Fetch Timeout

Some RSS feeds may be slow or unavailable. The fetcher continues even if some sources fail.

### Docker Build Fails

Ensure you have enough disk space and Docker is running:

```bash
docker system prune -a
docker-compose build --no-cache
```

## Technology Stack

- **Runtime**: Node.js 20.x
- **Web Framework**: Express 4.18.2
- **Database**: SQLite 3 (better-sqlite3)
- **Data Fetching**: axios, rss-parser, cheerio
- **CLI**: commander, chalk
- **Container**: Docker (Alpine Linux)

## Contributing

This project was created as part of an AI reproducibility experiment. Contributions are welcome!

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- Built with Claude Sonnet 3.5 as part of an AI software development experiment
- Inspired by the need for centralized AI content aggregation
- Thanks to all open-source RSS feed providers

## Support

For issues, questions, or suggestions:
- Open an issue on GitHub
- Check the [SETUP.md](SETUP.md) guide for detailed installation help
- See [QUICKSTART.md](QUICKSTART.md) for a 5-minute setup guide

---

**Made with 🤖 by Claude Sonnet 3.5 | Part of AI Reproducibility Experiment | October 2024**
