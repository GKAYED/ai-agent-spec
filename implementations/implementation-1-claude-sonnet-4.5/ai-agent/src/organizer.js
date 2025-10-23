/**
 * Categorize content based on title, summary, and source
 */
function categorizeItem(item) {
  const title = (item.title || '').toLowerCase();
  const summary = (item.summary || '').toLowerCase();
  const source = (item.source || '').toLowerCase();
  const text = `${title} ${summary} ${source}`;

  // Course keywords
  const courseKeywords = [
    'course', 'tutorial', 'learn', 'introduction', 'beginner',
    'workshop', 'training', 'certification', 'lesson', 'class',
    'coursera', 'edx', 'udacity', 'fast.ai', 'deeplearning.ai'
  ];

  // News keywords
  const newsKeywords = [
    'release', 'launch', 'announce', 'unveil', 'introduce',
    'breakthrough', 'update', 'version', 'new feature', 'partnership'
  ];

  // Reading keywords (research/papers)
  const readingKeywords = [
    'paper', 'research', 'study', 'analysis', 'survey',
    'arxiv', 'proceedings', 'journal', 'conference', 'abstract'
  ];

  // Check for course indicators
  const isCourse = courseKeywords.some(keyword => text.includes(keyword));
  if (isCourse) {
    return 'courses';
  }

  // Check for reading indicators (prioritize research content)
  const isReading = readingKeywords.some(keyword => text.includes(keyword));
  if (isReading) {
    return 'reading';
  }

  // Check for news indicators
  const isNews = newsKeywords.some(keyword => text.includes(keyword));
  if (isNews) {
    return 'news';
  }

  // Default based on source if no keywords match
  if (source.includes('arxiv') || source.includes('research')) {
    return 'reading';
  }

  // Default to news
  return 'news';
}

/**
 * Organize and categorize items
 */
function organizeItems(items) {
  return items.map(item => {
    // If category already set, use it; otherwise, categorize
    if (!item.category) {
      item.category = categorizeItem(item);
    }
    return item;
  });
}

module.exports = {
  categorizeItem,
  organizeItems
};
