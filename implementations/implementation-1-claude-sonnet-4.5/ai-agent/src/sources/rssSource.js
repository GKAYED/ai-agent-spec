const Parser = require('rss-parser');
const chalk = require('chalk');

/**
 * Fetch items from a single RSS feed
 */
async function fetchRSS(source, timeout = 10000) {
  const parser = new Parser({
    timeout,
    headers: {
      'User-Agent': 'AI-Agent-Aggregator/1.0'
    }
  });

  try {
    console.log(chalk.blue(`Fetching ${source.name}...`));
    const feed = await parser.parseURL(source.url);

    const items = feed.items.map(item => ({
      title: item.title || 'Untitled',
      url: item.link || item.guid,
      summary: item.contentSnippet || item.summary || item.description || '',
      source: source.name,
      category: source.category,
      date: item.isoDate || item.pubDate || new Date().toISOString()
    }));

    console.log(chalk.green(`✓ Fetched ${items.length} items from ${source.name}`));
    return items;
  } catch (error) {
    console.log(chalk.red(`✗ Failed to fetch ${source.name}: ${error.message}`));
    return [];
  }
}

/**
 * Fetch from all RSS sources with concurrency limit
 */
async function fetchAllRSS(sources, concurrency = 5) {
  const rssSources = sources.filter(s => s.type === 'rss');
  const results = [];
  const errors = [];

  console.log(chalk.yellow(`\nFetching from ${rssSources.length} RSS sources...\n`));

  // Process in batches to limit concurrency
  for (let i = 0; i < rssSources.length; i += concurrency) {
    const batch = rssSources.slice(i, i + concurrency);
    const batchPromises = batch.map(source =>
      fetchRSS(source).catch(error => {
        errors.push(`${source.name}: ${error.message}`);
        return [];
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const allItems = results.flat();
  
  console.log(chalk.cyan(`\n=== Fetch Summary ===`));
  console.log(chalk.white(`Total items fetched: ${allItems.length}`));
  if (errors.length > 0) {
    console.log(chalk.yellow(`Failed sources: ${errors.length}`));
  }

  return { items: allItems, errors };
}

module.exports = {
  fetchRSS,
  fetchAllRSS
};
