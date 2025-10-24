const axios = require('axios');
const cheerio = require('cheerio');
const chalk = require('chalk');

async function scrapeURL(url, selectors = {}) {
  try {
    const { data } = await axios.get(url, { timeout: 10000 });
    const $ = cheerio.load(data);
    const items = [];
    // Example selectors structure: { item: 'article', title: 'h2 a', link: 'h2 a', summary: '.excerpt' }
    $(selectors.item || 'article').each((_, el) => {
      const title = $(el).find(selectors.title || 'h2, h3, a').first().text().trim();
      const urlAttr = $(el).find(selectors.link || 'a').first().attr('href');
      const summary = $(el).find(selectors.summary || 'p').first().text().trim();
      if (title) {
        items.push({ title, url: urlAttr || null, summary });
      }
    });
    return items;
  } catch (e) {
    console.error(chalk.yellow(`Scrape failed for ${url}: ${e.message}`));
    return [];
  }
}

module.exports = { scrapeURL };
