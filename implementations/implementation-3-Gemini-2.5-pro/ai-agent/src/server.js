const express = require('express');
const path = require('path');
const db = require('./db');

const app = express();

app.use(express.static(path.join(__dirname, '../public')));

app.get('/data', (req, res) => {
    const items = db.prepare('SELECT * FROM items ORDER BY timestamp DESC').all();
    res.json(items);
});

module.exports = app;
