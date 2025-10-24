function containsAny(str = '', keywords = []) {
  const s = (str || '').toLowerCase();
  return keywords.some((k) => s.includes(k));
}

function categorizeItem(item) {
  // If category already assigned (from source config), respect it
  if (item.category) return item;

  const title = item.title || '';
  const summary = item.summary || '';

  // Courses
  if (containsAny(title + ' ' + summary, [
    'course', 'tutorial', 'learn', 'introduction', 'beginner', 'workshop', 'bootcamp', 'curriculum'
  ])) {
    return { ...item, category: 'courses' };
  }

  // News
  if (containsAny(title + ' ' + summary, [
    'release', 'launch', 'announce', 'update', 'breaking'
  ])) {
    return { ...item, category: 'news' };
  }

  // Reading (default)
  if (containsAny(title + ' ' + summary, [
    'paper', 'research', 'study', 'arxiv', 'benchmark', 'survey'
  ])) {
    return { ...item, category: 'reading' };
  }

  return { ...item, category: 'reading' };
}

function categorizeAll(items = []) {
  return items.map(categorizeItem);
}

module.exports = { categorizeItem, categorizeAll };
