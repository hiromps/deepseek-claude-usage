/**
 * OS間のパス解決ユーティリティ
 * Windows / macOS / Linux のすべてで正しくパスを解決する
 */
import * as os from 'os';
import * as path from 'path';

/** ユーザーのホームディレクトリを取得 */
export function getHomeDir(): string {
  return os.homedir();
}

/** Claude Codeの設定ディレクトリ (~/.claude) を取得 */
export function getClaudeDir(): string {
  return path.join(getHomeDir(), '.claude');
}

/** settings.json の絶対パスを取得 */
export function getSettingsPath(): string {
  return path.join(getClaudeDir(), 'settings.json');
}

/** 本ツールのデータディレクトリ (~/.claude/deepseek-claude-usage) を取得 */
export function getToolDir(): string {
  return path.join(getClaudeDir(), 'deepseek-claude-usage');
}

/** キャッシュファイルの絶対パスを取得 */
export function getCachePath(): string {
  return path.join(getToolDir(), 'cache.json');
}

/** インストールされるstatusLineスクリプトの絶対パスを取得 */
export function getStatusLineScriptPath(): string {
  return path.join(getToolDir(), 'statusline.js');
}

/** インストールされるdistディレクトリの絶対パスを取得 */
export function getToolDistDir(): string {
  return path.join(getToolDir(), 'dist');
}

/**
 * バックアップファイルの絶対パスを生成
 * タイムスタンプを含む一意なファイル名を生成する
 */
export function getBackupPath(timestamp?: string): string {
  const ts = timestamp || new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(getClaudeDir(), `settings.backup.deepseek-claude-usage.${ts}.json`);
}

/**
 * パスが存在するか簡易チェック
 * (fs.existsSync は同期的だがCLIツールでは許容)
 */
import * as fs from 'fs';

export function pathExists(p: string): boolean {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

/** ディレクトリであるかチェック */
export function isDirectory(p: string): boolean {
  try {
    return fs.statSync(p).isDirectory();
  } catch {
    return false;
  }
}

/** ファイルであるかチェック */
export function isFile(p: string): boolean {
  try {
    return fs.statSync(p).isFile();
  } catch {
    return false;
  }
}
