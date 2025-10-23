const axios = require('axios');
const cheerio = require('cheerio');

/**
 * Scrape a web page using CSS selectors
 */
async function scrapeURL(url, selectors, timeout = 10000) {
  try {
    const response = await axios.get(url, {
      timeout,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    const $ = cheerio.load(response.data);
    const items = [];

    $(selectors.container).each((i, elem) => {
      const title = $(elem).find(selectors.title).text().trim();
      const link = $(elem).find(selectors.link).attr('href');
      const summary = $(elem).find(selectors.summary).text().trim();

      if (title && link) {
        items.push({
          title,
          url: link.startsWith('http') ? link : new URL(link, url).href,
          summary: summary || '',
          source: new URL(url).hostname,
          category: 'news',
          date: new Date().toISOString()
        });
      }
    });

    return items;
  } catch (error) {
    console.error(`Failed to scrape ${url}: ${error.message}`);
    return [];
  }
}

module.exports = {
  scrapeURL
};
