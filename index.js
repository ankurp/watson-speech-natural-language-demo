#!/usr/bin/env node

const program = require('commander');

program
  .version('1.0.1')
  .description('Speech to Text Analyzer CLI tool powered by IBM Watson')
  .command('analyze [url]', 'convert audio file to text and then gives you analysis of it').alias('a')
  .command('config [key] [value]', 'set config').alias('c')
  .parse(process.argv);
