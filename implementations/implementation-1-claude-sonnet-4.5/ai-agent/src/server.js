const express = require('express');
const cors = require('cors');
const path = require('path');
const chalk = require('chalk');

const { initDatabase, insertItems, getItems, toggleItem, voteItem, getStats, getTopSources, getJourneyStats } = require('./db');
const { sources, manualResources } = require('./config');
const { organizeItems } = require('./organizer');
const { fetchAllRSS } = require('./sources/rssSource');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
const db = initDatabase();
console.log(chalk.green('✓ Database initialized'));

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// API Routes

/**
 * POST /api/fetch - Fetch new content from all sources
 */
app.post('/api/fetch', async (req, res) => {
  try {
    console.log(chalk.yellow('\n=== Starting content fetch ==='));
    const startTime = Date.now();

    // Fetch from RSS sources
    const { items: rssItems, errors } = await fetchAllRSS(sources);

    // Combine with manual resources
    const allItems = [...rssItems, ...manualResources];

    // Organize and categorize
    const organizedItems = organizeItems(allItems);

    // Insert into database
    const count = insertItems(db, organizedItems);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(chalk.green(`✓ Fetch completed in ${duration}s`));
    console.log(chalk.cyan(`  New items added: ${count}`));

    res.json({
      success: true,
      count,
      duration: parseFloat(duration),
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error(chalk.red('✗ Fetch failed:'), error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/items - Get items with optional filters
 */
app.get('/api/items', (req, res) => {
  try {
    const filters = {};

    if (req.query.category) {
      filters.category = req.query.category;
    }

    if (req.query.checked !== undefined) {
      filters.checked = parseInt(req.query.checked);
    }

    const items = getItems(db, filters);
    res.json(items);
  } catch (error) {
    console.error(chalk.red('✗ Get items failed:'), error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/items/:id/toggle - Toggle checked state
 */
app.post('/api/items/:id/toggle', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const checked = toggleItem(db, id);

    if (checked === null) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, checked });
  } catch (error) {
    console.error(chalk.red('✗ Toggle failed:'), error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/items/:id/vote - Vote on an item
 */
app.post('/api/items/:id/vote', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { type } = req.body;

    if (!type || (type !== 'up' && type !== 'down')) {
      return res.status(400).json({ error: 'Invalid vote type. Must be "up" or "down".' });
    }

    const votes = voteItem(db, id, type);

    if (votes === null) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.json({ success: true, ...votes });
  } catch (error) {
    console.error(chalk.red('✗ Vote failed:'), error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/stats - Get aggregate statistics
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = getStats(db);
    res.json(stats);
  } catch (error) {
    console.error(chalk.red('✗ Get stats failed:'), error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/sources/top - Get top-voted sources
 */
app.get('/api/sources/top', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const topSources = getTopSources(db, limit);
    res.json(topSources);
  } catch (error) {
    console.error(chalk.red('✗ Get top sources failed:'), error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/journey - Get progress and milestones
 */
app.get('/api/journey', (req, res) => {
  try {
    const journey = getJourneyStats(db);
    res.json(journey);
  } catch (error) {
    console.error(chalk.red('✗ Get journey failed:'), error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(chalk.green(`\n✓ Server running on http://localhost:${PORT}`));
  console.log(chalk.cyan(`  API available at http://localhost:${PORT}/api`));
  console.log(chalk.yellow(`\n  Try: POST http://localhost:${PORT}/api/fetch to start fetching content\n`));
});

module.exports = app;
