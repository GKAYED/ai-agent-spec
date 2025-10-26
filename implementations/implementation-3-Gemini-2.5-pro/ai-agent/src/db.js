const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = require('./config').dbPath;
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const db = new Database(dbPath);

db.exec(`
    CREATE TABLE IF NOT EXISTS items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT,
        url TEXT UNIQUE,
        source TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

module.exports = db;
