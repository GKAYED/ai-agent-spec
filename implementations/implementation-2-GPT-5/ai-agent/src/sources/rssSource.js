const Parser = require('rss-parser');
const chalk = require('chalk');

const parser = new Parser();

async function fetchRSS(source) {
  try {
    const feed = await parser.parseURL(source.url);
    const items = (feed.items || []).map((it) => ({
      title: it.title || '(no title)',
      url: it.link || null,
      summary: it.contentSnippet || it.content || '',
      source: source.name,
      category: source.category || 'reading',
      date: it.isoDate || it.pubDate || null,
    }));
    return items;
  } catch (e) {
    console.error(chalk.yellow(`Failed to fetch from ${source.name}: ${e.message}`));
    return [];
  }
}

// Simple concurrency limiter
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let i = 0;
  const workers = new Array(Math.min(limit, items.length)).fill(0).map(async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) return;
      results[idx] = await fn(items[idx], idx);
    }
  });
  await Promise.all(workers);
  return results;
}

async function fetchAllRSS(sources) {
  const rssSources = (sources || []).filter((s) => s.type === 'rss');
  const batches = await mapWithConcurrency(rssSources, 5, (src) => fetchRSS(src));
  return batches.flat();
}

module.exports = {
  fetchRSS,
  fetchAllRSS,
};
