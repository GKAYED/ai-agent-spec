const Database = require('better-sqlite3');
const path = require('path');

/**
 * Initialize database and create schema
 */
function initDatabase() {
  const dbPath = path.join(__dirname, '..', 'data', 'resources.db');
  const db = new Database(dbPath);

  // Create items table
  db.exec(`
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
    )
  `);

  // Create indexes
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_checked ON items(checked);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_url ON items(url) WHERE url IS NOT NULL;
  `);

  return db;
}

/**
 * Insert items into database (skip duplicates)
 */
function insertItems(db, items) {
  const insert = db.prepare(`
    INSERT OR IGNORE INTO items (title, url, summary, source, category, date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((items) => {
    let count = 0;
    for (const item of items) {
      const result = insert.run(
        item.title,
        item.url || null,
        item.summary || null,
        item.source || null,
        item.category,
        item.date || null
      );
      if (result.changes > 0) count++;
    }
    return count;
  });

  return insertMany(items);
}

/**
 * Get items with optional filters
 */
function getItems(db, filters = {}) {
  let query = 'SELECT * FROM items';
  const conditions = [];
  const params = [];

  if (filters.category) {
    conditions.push('category = ?');
    params.push(filters.category);
  }

  if (filters.checked !== undefined) {
    conditions.push('checked = ?');
    params.push(filters.checked);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY date DESC';

  return db.prepare(query).all(...params);
}

/**
 * Toggle checked state of an item
 */
function toggleItem(db, id) {
  const update = db.prepare('UPDATE items SET checked = 1 - checked WHERE id = ?');
  const result = update.run(id);

  if (result.changes === 0) {
    return null;
  }

  const item = db.prepare('SELECT checked FROM items WHERE id = ?').get(id);
  return item ? item.checked : null;
}

/**
 * Vote on an item (up or down)
 */
function voteItem(db, id, type) {
  if (type !== 'up' && type !== 'down') {
    throw new Error('Invalid vote type. Must be "up" or "down".');
  }

  const column = type === 'up' ? 'upvotes' : 'downvotes';
  const update = db.prepare(`UPDATE items SET ${column} = ${column} + 1 WHERE id = ?`);
  const result = update.run(id);

  if (result.changes === 0) {
    return null;
  }

  const item = db.prepare('SELECT upvotes, downvotes FROM items WHERE id = ?').get(id);
  return item;
}

/**
 * Get aggregate statistics
 */
function getStats(db) {
  const total = db.prepare('SELECT COUNT(*) AS count FROM items').get().count;
  const checked = db.prepare('SELECT COUNT(*) AS count FROM items WHERE checked = 1').get().count;
  const news = db.prepare('SELECT COUNT(*) AS count FROM items WHERE category = ?').get('news').count;
  const courses = db.prepare('SELECT COUNT(*) AS count FROM items WHERE category = ?').get('courses').count;
  const reading = db.prepare('SELECT COUNT(*) AS count FROM items WHERE category = ?').get('reading').count;

  return { total, checked, news, courses, reading };
}

/**
 * Get top sources by net votes
 */
function getTopSources(db, limit = 10) {
  return db.prepare(`
    SELECT source, 
           SUM(upvotes) - SUM(downvotes) AS netVotes
    FROM items
    WHERE source IS NOT NULL
    GROUP BY source
    ORDER BY netVotes DESC
    LIMIT ?
  `).all(limit);
}

/**
 * Get journey progress statistics
 */
function getJourneyStats(db) {
  const totalChecked = db.prepare('SELECT COUNT(*) AS count FROM items WHERE checked = 1').get().count;
  
  const milestones = [5, 10, 20, 50, 100].map(count => ({
    count,
    achieved: totalChecked >= count
  }));

  return { totalChecked, milestones };
}

module.exports = {
  initDatabase,
  insertItems,
  getItems,
  toggleItem,
  voteItem,
  getStats,
  getTopSources,
  getJourneyStats
};
