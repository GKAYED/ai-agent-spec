# Setup Guide

Detailed installation and configuration guide for the AI News & Learning Resource Aggregator.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Installation Methods](#installation-methods)
3. [Configuration](#configuration)
4. [First Run](#first-run)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Topics](#advanced-topics)

## System Requirements

### Minimum Requirements

- **OS**: Windows 10/11, macOS 10.15+, or Linux (Ubuntu 20.04+)
- **CPU**: 2 cores
- **RAM**: 2 GB
- **Disk**: 500 MB free space
- **Node.js**: 20.x LTS (if not using Docker)
- **Docker**: Latest version (if using Docker deployment)

### Recommended Requirements

- **RAM**: 4 GB
- **Disk**: 1 GB free space (for data storage)
- **Network**: Stable internet connection for RSS feed fetching

## Installation Methods

### Method 1: Docker (Recommended)

**Advantages**: No Node.js installation needed, consistent environment, easy deployment

#### Prerequisites

Install Docker Desktop:
- **Windows**: [Docker Desktop for Windows](https://docs.docker.com/desktop/install/windows-install/)
- **Mac**: [Docker Desktop for Mac](https://docs.docker.com/desktop/install/mac-install/)
- **Linux**: [Docker Engine](https://docs.docker.com/engine/install/)

#### Installation Steps

```bash
# 1. Navigate to project directory
cd ai-agent

# 2. Build and start with Docker Compose
docker-compose up -d

# 3. Verify container is running
docker ps

# 4. View logs
docker-compose logs -f

# 5. Open browser
http://localhost:3000
```

#### Stopping and Restarting

```bash
# Stop container
docker-compose down

# Start again
docker-compose up -d

# Rebuild after code changes
docker-compose up --build
```

---

### Method 2: Manual Installation

**Advantages**: Direct control, easier debugging, no Docker overhead

#### Prerequisites

1. **Install Node.js 20.x LTS**
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation:
     ```bash
     node --version  # Should show v20.x.x
     npm --version   # Should show 10.x.x
     ```

2. **Install Build Tools** (for better-sqlite3)

   **Windows**:
   ```powershell
   npm install --global windows-build-tools
   ```

   **Mac**:
   ```bash
   xcode-select --install
   ```

   **Linux (Ubuntu/Debian)**:
   ```bash
   sudo apt-get install -y build-essential python3
   ```

#### Installation Steps

```bash
# 1. Navigate to project directory
cd ai-agent

# 2. Install dependencies
npm install

# 3. Verify installation
npm list

# 4. Create data directory (if not exists)
mkdir -p data

# 5. Fetch initial content (optional, can do from UI)
npm run fetch

# 6. Start server
npm start

# 7. Open browser
http://localhost:3000
```

---

## Configuration

### Environment Variables

Create a `.env` file in the project root (optional):

```bash
# Server port (default: 3000)
PORT=3000

# Node environment
NODE_ENV=production

# Database path (default: ./data/resources.db)
# DATABASE_PATH=./data/resources.db
```

### Custom RSS Sources

Edit `src/config.js` to add/remove RSS feeds:

```javascript
const sources = [
  {
    name: 'Your Custom Source',
    url: 'https://example.com/rss',
    type: 'rss',
    category: 'news' // or 'courses' or 'reading'
  },
  // ... other sources
];
```

### Manual Resources

Add custom courses or resources:

```javascript
const manualResources = [
  {
    title: 'Your Course Title',
    url: 'https://example.com/course',
    summary: 'Course description...',
    source: 'Provider Name',
    category: 'courses',
    date: '2024-10-23T00:00:00Z'
  }
];
```

### Port Configuration

Change the default port if 3000 is in use:

**Via Environment Variable**:
```bash
PORT=3001 npm start
```

**Via Docker Compose**:
Edit `docker-compose.yml`:
```yaml
ports:
  - "3001:3000"  # Map host port 3001 to container port 3000
```

---

## First Run

### 1. Start the Application

**Docker**:
```bash
docker-compose up -d
```

**Manual**:
```bash
npm start
```

### 2. Access the Web Interface

Open browser and navigate to:
```
http://localhost:3000
```

### 3. Fetch Initial Content

Click the "🔄 Fetch New Content" button in the header.

**Expected behavior**:
- Button shows "⏳ Fetching..."
- Process takes 30-60 seconds
- Alert shows "✓ Fetched X new items in Ys"
- Items appear in the interface

**Alternative (CLI)**:
```bash
npm run fetch
```

### 4. Explore Features

- **Browse tabs**: Click All, News, Courses, Reading
- **Mark items**: Check boxes to track reading progress
- **Vote**: Use 👍/👎 buttons to rate content
- **View journey**: Click Journey tab to see progress
- **Milestones**: Complete 5+ items to see celebration modal

---

## Troubleshooting

### Issue: Port 3000 Already in Use

**Symptoms**: Error "EADDRINUSE: address already in use"

**Solutions**:
```bash
# Option 1: Use different port
PORT=3001 npm start

# Option 2: Kill process using port 3000
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux
lsof -ti:3000 | xargs kill -9
```

### Issue: npm install Fails

**Symptoms**: Errors during dependency installation

**Solutions**:
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If better-sqlite3 fails, install build tools (see Prerequisites)
```

### Issue: Database Locked

**Symptoms**: Error "database is locked"

**Solutions**:
```bash
# Stop all running instances
pkill -f "node src/server.js"  # Mac/Linux
taskkill /F /IM node.exe        # Windows

# Remove lock files
rm data/*.db-shm data/*.db-wal

# Restart
npm start
```

### Issue: Fetch Fails for All Sources

**Symptoms**: "Fetched 0 items" or all sources timeout

**Solutions**:
1. **Check internet connection**
2. **Check firewall settings** (allow Node.js)
3. **Try manual fetch**:
   ```bash
   npm run fetch
   ```
4. **Check individual source URLs** (some may be down)
5. **Increase timeout** in `src/sources/rssSource.js`:
   ```javascript
   async function fetchRSS(source, timeout = 20000) { // increase to 20s
   ```

### Issue: UI Not Loading

**Symptoms**: Blank page or "Cannot GET /"

**Solutions**:
1. **Verify server is running**:
   ```bash
   curl http://localhost:3000/api/stats
   ```
2. **Check console for errors** (browser developer tools)
3. **Clear browser cache** (Ctrl+Shift+R or Cmd+Shift+R)
4. **Verify public/index.html exists**

### Issue: Docker Build Fails

**Symptoms**: Build errors, missing dependencies

**Solutions**:
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache

# Check Docker daemon is running
docker ps

# Check disk space
docker system df
```

### Issue: Data Not Persisting (Docker)

**Symptoms**: Checked items reset after container restart

**Solutions**:
```bash
# Verify volume exists
docker volume ls | grep ai-agent-data

# Inspect volume
docker volume inspect ai-agent-data

# If missing, recreate with docker-compose
docker-compose down
docker-compose up -d
```

### Issue: Celebration Modal Not Appearing

**Symptoms**: No modal after reaching milestone

**Solutions**:
1. **Check browser console for errors**
2. **Verify milestone count** (must cross threshold, not just equal)
3. **Clear localStorage**:
   ```javascript
   // In browser console
   localStorage.clear();
   location.reload();
   ```
4. **Check if modal is hidden**:
   ```javascript
   // In browser console
   document.getElementById('celebrationModal').classList.add('show');
   ```

---

## Advanced Topics

### Running Behind a Reverse Proxy

**Nginx Example**:
```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Running as a System Service

**systemd (Linux)**:

Create `/etc/systemd/system/ai-agent.service`:
```ini
[Unit]
Description=AI News Aggregator
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/ai-agent
ExecStart=/usr/bin/node src/server.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl enable ai-agent
sudo systemctl start ai-agent
sudo systemctl status ai-agent
```

### Automated Fetching with Cron

**Add to crontab**:
```bash
# Fetch new content every 6 hours
0 */6 * * * cd /path/to/ai-agent && /usr/bin/node src/index.js fetch >> /var/log/ai-agent-fetch.log 2>&1
```

### Database Backup

**Manual Backup**:
```bash
# Copy database file
cp data/resources.db data/resources.db.backup

# Or use SQLite backup command
sqlite3 data/resources.db ".backup data/resources.db.backup"
```

**Automated Backup Script**:
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp data/resources.db backups/resources_$DATE.db
# Keep only last 7 days
find backups/ -name "resources_*.db" -mtime +7 -delete
```

### Performance Tuning

**Increase concurrency** in `src/sources/rssSource.js`:
```javascript
// Fetch from 10 sources in parallel instead of 5
const { items, errors } = await fetchAllRSS(sources, 10);
```

**Optimize database** (periodically):
```bash
sqlite3 data/resources.db "VACUUM; ANALYZE;"
```

### Development Mode

**Watch for changes** (requires nodemon):
```bash
npm install -g nodemon
nodemon src/server.js
```

**Enable debug logging**:
```javascript
// Add to src/server.js
const DEBUG = process.env.DEBUG === 'true';
if (DEBUG) console.log('Debug info:', data);
```

Run with:
```bash
DEBUG=true npm start
```

---

## Getting Help

### Logs

**Manual Installation**:
- Check terminal output where `npm start` is running

**Docker**:
```bash
docker-compose logs -f
docker-compose logs -f --tail=100
```

### Diagnostic Commands

```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# List installed packages
npm list

# Check database
sqlite3 data/resources.db ".schema"
sqlite3 data/resources.db "SELECT COUNT(*) FROM items;"

# Test API
curl http://localhost:3000/api/stats
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Missing dependencies | `npm install` |
| `EADDRINUSE` | Port in use | Change port or kill process |
| `SQLITE_BUSY` | Database locked | Stop all instances, remove lock files |
| `ECONNREFUSED` | Server not running | Start with `npm start` |
| `404 Not Found` | Wrong URL or route | Check URL and server logs |

---

## Support Resources

- **Documentation**: README.md, QUICKSTART.md (this file)
- **Repository Issues**: Open an issue on GitHub
- **Logs**: Check console output and browser developer tools
- **Community**: (Add forum/Discord link if available)

---

**Last Updated**: October 23, 2025
**Version**: 0.2.0
**Maintained by**: Claude Sonnet 3.5 (AI Reproducibility Experiment)
