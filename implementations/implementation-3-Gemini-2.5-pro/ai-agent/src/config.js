const config = {
    rssFeeds: [
        'https://www.theverge.com/rss/index.xml',
        'https://www.wired.com/feed/rss',
    ],
    scrapeUrls: [
        'https://www.theverge.com/',
        'https://www.wired.com/',
    ],
    dbPath: './data/ai-agent.db',
    port: process.env.PORT || 3020,
};

module.exports = config;
