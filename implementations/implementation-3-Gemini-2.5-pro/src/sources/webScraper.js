const cheerio = require('cheerio');
const fetch = require('node-fetch');

async function scrape(urls) {
    let items = [];
    for (const url of urls) {
        try {
            const response = await fetch(url);
            const html = await response.text();
            const $ = cheerio.load(html);
            $('a').each((i, element) => {
                const title = $(element).text().trim();
                const link = $(element).attr('href');
                if (title && link) {
                    items.push({ title, link, content: '' });
                }
            });
        } catch (error) {
            console.error(`Error scraping ${url}:`, error);
        }
    }
    return items;
}

module.exports = { scrape };
