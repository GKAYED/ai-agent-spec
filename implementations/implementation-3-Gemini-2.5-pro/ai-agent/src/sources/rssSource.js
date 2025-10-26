const Parser = require('rss-parser');
const parser = new Parser();

async function fetch(feeds) {
    let items = [];
    for (const feedUrl of feeds) {
        try {
            const feed = await parser.parseURL(feedUrl);
            items = items.concat(feed.items);
        } catch (error) {
            console.error(`Error fetching RSS feed ${feedUrl}:`, error);
        }
    }
    return items;
}

module.exports = { fetch };
