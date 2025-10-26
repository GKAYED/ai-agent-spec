const db = require('./db');
const rssSource = require('./sources/rssSource');
const webScraper = require('./sources/webScraper');
const config = require('./config');

async function run() {
    console.log('Fetching data from RSS feeds...');
    const rssItems = await rssSource.fetch(config.rssFeeds);
    insertItems(rssItems, 'rss');

    console.log('Scraping data from websites...');
    const scrapedItems = await webScraper.scrape(config.scrapeUrls);
    insertItems(scrapedItems, 'scrape');
}

function insertItems(items, source) {
    const insert = db.prepare('INSERT OR IGNORE INTO items (title, content, url, source) VALUES (?, ?, ?, ?)');
    for (const item of items) {
        insert.run(item.title, item.content, item.link, source);
    }
}

module.exports = { run };
