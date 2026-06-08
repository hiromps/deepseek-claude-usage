#!/usr/bin/env node
/**
 * deepseek-claude-usage binary entry point (CJS)
 *
 * npm bin エントリポイント。
 * コンパイル済みの dist/cli.js を読み込んで CLI を起動する。
 */
'use strict';

const path = require('path');

// パッケージルートからの dist/cli.js を解決
const distCli = path.join(__dirname, '..', 'dist', 'cli.js');

try {
  require(distCli);
} catch (err) {
  console.error('deepseek-claude-usage: Failed to load CLI module.');
  console.error('Make sure the package is built: npm run build');
  console.error(err.message);
  process.exit(1);
}
