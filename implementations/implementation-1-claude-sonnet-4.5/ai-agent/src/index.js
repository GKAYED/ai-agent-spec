#!/usr/bin/env node

const { Command } = require('commander');
const chalk = require('chalk');

const { initDatabase, insertItems, getStats, getTopSources } = require('./db');
const { sources, manualResources } = require('./config');
const { organizeItems } = require('./organizer');
const { fetchAllRSS } = require('./sources/rssSource');

const program = new Command();

program
  .name('ai-agent')
  .description('AI News & Learning Resource Aggregator CLI')
  .version('0.2.0');

/**
 * Fetch command - fetch content from all sources
 */
program
  .command('fetch')
  .description('Fetch new content from all configured sources')
  .action(async () => {
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║   AI Content Aggregator - Fetch     ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    try {
      const db = initDatabase();
      const startTime = Date.now();

      // Fetch from RSS sources
      const { items: rssItems, errors } = await fetchAllRSS(sources);

      // Combine with manual resources
      const allItems = [...rssItems, ...manualResources];

      // Organize and categorize
      const organizedItems = organizeItems(allItems);

      // Insert into database
      const count = insertItems(db, organizedItems);

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      console.log(chalk.green('\n✓ Fetch completed successfully!'));
      console.log(chalk.white(`  Duration: ${duration}s`));
      console.log(chalk.white(`  New items: ${count}`));
      console.log(chalk.white(`  Total sources: ${sources.length}`));
      
      if (errors.length > 0) {
        console.log(chalk.yellow(`  Failed: ${errors.length} sources`));
      }

      db.close();
    } catch (error) {
      console.error(chalk.red('\n✗ Fetch failed:'), error.message);
      process.exit(1);
    }
  });

/**
 * Stats command - display database statistics
 */
program
  .command('stats')
  .description('Display database statistics')
  .action(() => {
    console.log(chalk.cyan('\n╔══════════════════════════════════════╗'));
    console.log(chalk.cyan('║   AI Content Aggregator - Stats     ║'));
    console.log(chalk.cyan('╚══════════════════════════════════════╝\n'));

    try {
      const db = initDatabase();
      const stats = getStats(db);
      const topSources = getTopSources(db, 5);

      console.log(chalk.white('Database Statistics:'));
      console.log(chalk.green(`  Total items:     ${stats.total}`));
      console.log(chalk.yellow(`  Checked:         ${stats.checked}`));
      console.log(chalk.blue(`  News:            ${stats.news}`));
      console.log(chalk.magenta(`  Courses:         ${stats.courses}`));
      console.log(chalk.cyan(`  Reading:         ${stats.reading}`));

      if (stats.total > 0) {
        const completion = ((stats.checked / stats.total) * 100).toFixed(1);
        console.log(chalk.white(`  Completion:      ${completion}%`));
      }

      if (topSources.length > 0) {
        console.log(chalk.white('\nTop 5 Sources (by net votes):'));
        topSources.forEach((source, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '  ';
          console.log(chalk.white(`  ${medal} ${source.source}: ${source.netVotes} votes`));
        });
      }

      db.close();
    } catch (error) {
      console.error(chalk.red('\n✗ Stats failed:'), error.message);
      process.exit(1);
    }
  });

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
