#!/usr/bin/env node
const open = require('open');
const { readFileSync } = require('fs');
const { resolve } = require('path');

const pkgPath = resolve(__dirname, '../package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

const showHelp = () => {
  console.log(`
  Usage: abdulsamad [options]

  Options:
    --version   Output the version number
    --help      Display help information

  Examples:
    $ abdulsamad
    $ abdulsamad --version
    $ abdulsamad --help
  `);
};

const showVersion = () => {
  console.log(pkg.version);
};

const launchPortfolio = async () => {
  const url = 'https://abdulsamad-pro.vercel.app';
  
  // Display professional terminal message
  console.log('��────────────────────────────────────��');
  console.log('│       ABDUL SAMAD PORTFOLIO        │');
  console.log('��────────────────────────────────────��');
  console.log('');
  console.log('��� Opening portfolio...');
  console.log('');
  console.log(url);
  console.log('');
  console.log('Press Ctrl+C to exit.');

  try {
    await open(url);
  } catch (err) {
    console.error('Failed to open browser:', err.message);
    process.exit(1);
  }
};

const main = async () => {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showHelp();
    process.exit(0);
  }

  if (args.includes('--version') || args.includes('-v')) {
    showVersion();
    process.exit(0);
  }

  // If no arguments or unknown arguments, launch portfolio
  launchPortfolio();
};

main();