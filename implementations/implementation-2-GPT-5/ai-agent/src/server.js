const express = require('express');
const cors = require('cors');
const path = require('path');
const chalk = require('chalk');
const db = require('./db');
const config = require('./config');
const { categorizeAll } = require('./organizer');
const { fetchAllRSS } = require('./sources/rssSource');

const app = express();
const PORT = process.env.PORT || 3010;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

const database = db.initDatabase();

app.post('/api/fetch', async (req, res) => {
  try {
    const rssItems = await fetchAllRSS(config.sources);
    const categorized = categorizeAll(rssItems);
    const allItems = [...categorized, ...config.manualResources];
    const count = db.insertItems(database, allItems);
    res.json({ success: true, count });
  } catch (error) {
    console.error(chalk.red('Fetch error:'), error.message);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

app.get('/api/items', (req, res) => {
  try {
    const { category, checked } = req.query;
    const filters = {};
    if (category) filters.category = category;
    if (checked !== undefined) filters.checked = parseInt(checked, 10);
    const items = db.getItems(database, filters);
    res.json(items);
  } catch (error) {
    console.error(chalk.red('Get items error:'), error.message);
    res.status(500).json({ error: 'Failed to get items' });
  }
});

app.post('/api/items/:id/toggle', (req, res) => {
  try {
    const { id } = req.params;
    const checked = db.toggleItem(database, parseInt(id, 10));
    if (checked === null) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, checked });
  } catch (error) {
    console.error(chalk.red('Toggle error:'), error.message);
    res.status(500).json({ error: 'Failed to toggle item' });
  }
});

app.post('/api/items/:id/vote', (req, res) => {
  try {
    const { id } = req.params;
    const { type } = req.body || {};
    if (type !== 'up' && type !== 'down') return res.status(400).json({ error: 'Invalid vote type' });
    const votes = db.voteItem(database, parseInt(id, 10), type);
    if (votes === null) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true, ...votes });
  } catch (error) {
    console.error(chalk.red('Vote error:'), error.message);
    res.status(500).json({ error: 'Failed to vote on item' });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const stats = db.getStats(database);
    res.json(stats);
  } catch (error) {
    console.error(chalk.red('Stats error:'), error.message);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

app.get('/api/sources/top', (req, res) => {
  try {
    const top = db.getTopSources(database);
    res.json(top);
  } catch (error) {
    console.error(chalk.red('Top sources error:'), error.message);
    res.status(500).json({ error: 'Failed to get top sources' });
  }
});

app.get('/api/journey', (req, res) => {
  try {
    const journey = db.getJourneyStats(database);
    res.json(journey);
  } catch (error) {
    console.error(chalk.red('Journey error:'), error.message);
    res.status(500).json({ error: 'Failed to get journey stats' });
  }
});

// Health check
app.get('/healthz', (req, res) => res.send('ok'));

// SPA fallback to serve index.html for any non-API route
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) return next();
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(chalk.green(`Server running on http://localhost:${PORT}`));
});
