const path = require('path');
const Database = require('better-sqlite3');
const chalk = require('chalk');

let dbInstance = null;

function initDatabase() {
  if (dbInstance) return dbInstance;
  const dbPath = path.join(__dirname, '..', 'data', 'resources.db');
  // Ensure data directory exists (for non-Docker local run)
  try {
    const fs = require('fs');
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  } catch (e) {
    console.error(chalk.red('Failed ensuring data directory'), e);
  }

  const db = new Database(dbPath);

  // Schema
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
    );

    CREATE INDEX IF NOT EXISTS idx_category ON items(category);
    CREATE INDEX IF NOT EXISTS idx_checked ON items(checked);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_url ON items(url) WHERE url IS NOT NULL;
  `);

  dbInstance = db;
  return db;
}

function insertItems(db, items) {
  const insert = db.prepare(
    'INSERT OR IGNORE INTO items (title, url, summary, source, category, date) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const insertMany = db.transaction((rows) => {
    let count = 0;
    for (const it of rows) {
      try {
        const info = insert.run(
          it.title || '',
          it.url || null,
          it.summary || null,
          it.source || null,
          it.category || 'reading',
          it.date || null
        );
        if (info.changes > 0) count += 1;
      } catch (e) {
        console.error(chalk.yellow('Insert skipped due to error:'), e.message);
      }
    }
    return count;
  });
  return insertMany(items || []);
}

function getItems(db, filters = {}) {
  const where = [];
  const params = {};
  if (filters.category) {
    where.push('category = @category');
    params.category = filters.category;
  }
  if (filters.checked !== undefined) {
    where.push('checked = @checked');
    params.checked = filters.checked;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const sql = `SELECT id, title, url, summary, source, category, date, checked, upvotes, downvotes, created_at
               FROM items ${whereSql}
               ORDER BY date DESC NULLS LAST, id DESC`;
  return db.prepare(sql).all(params);
}

function toggleItem(db, id) {
  const update = db.prepare('UPDATE items SET checked = 1 - checked WHERE id = ?');
  const select = db.prepare('SELECT checked FROM items WHERE id = ?');
  const info = update.run(id);
  if (info.changes === 0) return null;
  const row = select.get(id);
  return row ? row.checked : null;
}

function voteItem(db, id, type) {
  if (type !== 'up' && type !== 'down') return null;
  const col = type === 'up' ? 'upvotes' : 'downvotes';
  const update = db.prepare(`UPDATE items SET ${col} = ${col} + 1 WHERE id = ?`);
  const info = update.run(id);
  if (info.changes === 0) return null;
  const row = db.prepare('SELECT upvotes, downvotes FROM items WHERE id = ?').get(id);
  return row || null;
}

function getStats(db) {
  const total = db.prepare('SELECT COUNT(*) AS c FROM items').get().c;
  const checked = db.prepare('SELECT COUNT(*) AS c FROM items WHERE checked = 1').get().c;
  const news = db.prepare("SELECT COUNT(*) AS c FROM items WHERE category = 'news'").get().c;
  const courses = db.prepare("SELECT COUNT(*) AS c FROM items WHERE category = 'courses'").get().c;
  const reading = db.prepare("SELECT COUNT(*) AS c FROM items WHERE category = 'reading'").get().c;
  return { total, checked, news, courses, reading };
}

function getTopSources(db, limit = 10) {
  const sql = `
    SELECT COALESCE(source, 'Unknown') AS source,
           COALESCE(SUM(upvotes),0) - COALESCE(SUM(downvotes),0) AS netVotes
    FROM items
    GROUP BY source
    ORDER BY netVotes DESC
    LIMIT ?`;
  return db.prepare(sql).all(limit);
}

function getJourneyStats(db) {
  const totalChecked = db.prepare('SELECT COUNT(*) AS c FROM items WHERE checked = 1').get().c;
  const milestonesList = [5, 10, 20, 50, 100];
  const milestones = milestonesList.map((m) => ({ count: m, achieved: totalChecked >= m }));
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
  getJourneyStats,
};
