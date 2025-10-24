#!/usr/bin/env node
const { Command } = require('commander');
const chalk = require('chalk');
const db = require('./db');
const config = require('./config');
const { fetchAllRSS } = require('./sources/rssSource');
const { categorizeAll } = require('./organizer');

const program = new Command();
program.version('0.2.0');

program
  .command('fetch')
  .description('Fetch new items from all sources')
  .action(async () => {
    try {
      console.log(chalk.blue('Fetching items...'));
      const database = db.initDatabase();
      const items = await fetchAllRSS(config.sources);
      const categorized = categorizeAll(items);
      const allItems = [...categorized, ...config.manualResources];
      const count = db.insertItems(database, allItems);
      console.log(chalk.green(`\n✓ Fetched ${count} new items`));
      process.exit(0);
    } catch (e) {
      console.error(chalk.red('Fetch error:'), e.message);
      process.exit(1);
    }
  });

program
  .command('stats')
  .description('Show database statistics')
  .action(() => {
    try {
      const database = db.initDatabase();
      const stats = db.getStats(database);
      console.log(chalk.bold('\nDatabase Statistics:'));
      console.log(chalk.cyan(`Total items: ${stats.total}`));
      console.log(chalk.green(`Checked: ${stats.checked}`));
      console.log(chalk.yellow(`News: ${stats.news}`));
      console.log(chalk.magenta(`Courses: ${stats.courses}`));
      console.log(chalk.blue(`Reading: ${stats.reading}`));
      process.exit(0);
    } catch (e) {
      console.error(chalk.red('Stats error:'), e.message);
      process.exit(1);
    }
  });

program.parse(process.argv);
