/**
 * settings.json 管理モジュール
 * ~/.claude/settings.json の読み書き、バックアップ、復元を担当
 *
 * 最重要: 既存のsettings.jsonを壊さないこと
 * - インストール前に必ずバックアップを作成
 * - JSONのフォーマットを可能な限り維持
 * - 破損JSONの場合は上書きせずエラーを返す
 */
import * as fs from 'fs';
import * as path from 'path';
import { getSettingsPath, getBackupPath, pathExists, getClaudeDir } from './paths';

/** settings.json の型定義 */
export interface StatusLineConfig {
  type: string;
  command: string;
  refreshInterval?: number;
}

export interface ClaudeSettings {
  statusLine?: StatusLineConfig;
  [key: string]: unknown;
}

/**
 * settings.json を読み込む
 * ファイルが存在しない場合は空オブジェクトを返す
 * 破損している場合はエラーをスロー
 */
export function readSettings(): { settings: ClaudeSettings; raw: string } {
  const settingsPath = getSettingsPath();

  if (!pathExists(settingsPath)) {
    return { settings: {}, raw: '{}' };
  }

  const raw = fs.readFileSync(settingsPath, 'utf-8');

  // 空ファイルの場合は空オブジェクトとして扱う
  if (raw.trim().length === 0) {
    return { settings: {}, raw: '{}' };
  }

  try {
    const settings: unknown = JSON.parse(raw);
    if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
      throw new Error('settings.json is not a valid JSON object');
    }
    return { settings: settings as ClaudeSettings, raw };
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(
        `settings.json is corrupted (invalid JSON). Cannot proceed.\n` +
        `File: ${settingsPath}\n` +
        `Error: ${err.message}\n\n` +
        `Please fix or remove the file manually before installing.`
      );
    }
    throw err;
  }
}

/**
 * settings.json に書き込む
 * 可能な限り元のフォーマットを維持する
 */
export function writeSettings(settings: ClaudeSettings): void {
  const settingsPath = getSettingsPath();
  const dir = path.dirname(settingsPath);

  // ディレクトリが存在しない場合は作成
  if (!pathExists(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf-8');
}

/**
 * settings.json のバックアップを作成
 * @returns バックアップファイルのパス
 */
export function backupSettings(): string {
  const settingsPath = getSettingsPath();

  if (!pathExists(settingsPath)) {
    // settings.json が無い場合、空のバックアップは不要。
    // 代わりに「バックアップ不要」を示す空文字を返す
    return '';
  }

  const backupPath = getBackupPath();
  fs.copyFileSync(settingsPath, backupPath);
  return backupPath;
}

/**
 * 最新のバックアップファイルを探す
 * @returns 最新のバックアップパス、存在しない場合は null
 */
export function findLatestBackup(): string | null {
  const claudeDir = getClaudeDir();

  if (!pathExists(claudeDir)) {
    return null;
  }

  try {
    const files = fs.readdirSync(claudeDir);
    const backups = files
      .filter((f) => f.startsWith('settings.backup.deepseek-claude-usage.') && f.endsWith('.json'))
      .map((f) => ({
        name: f,
        path: path.join(claudeDir, f),
        time: fs.statSync(path.join(claudeDir, f)).mtime.getTime(),
      }))
      .sort((a, b) => b.time - a.time); // 新しい順

    return backups.length > 0 ? backups[0].path : null;
  } catch {
    return null;
  }
}

/**
 * バックアップから settings.json を復元
 * @param backupPath バックアップファイルのパス
 */
export function restoreFromBackup(backupPath: string): void {
  if (!pathExists(backupPath)) {
    throw new Error(`Backup file not found: ${backupPath}`);
  }

  const settingsPath = getSettingsPath();
  fs.copyFileSync(backupPath, settingsPath);
}

/**
 * settings.json の statusLine 設定を更新または追加
 * @param settings 現在の設定
 * @param command statusLine コマンド
 * @param refreshInterval 更新間隔（秒）
 * @returns 更新後の設定
 */
export function updateStatusLine(
  settings: ClaudeSettings,
  command: string,
  refreshInterval: number = 30
): ClaudeSettings {
  return {
    ...settings,
    statusLine: {
      type: 'command',
      command,
      refreshInterval,
    },
  };
}

/**
 * settings.json から statusLine を削除
 * @param settings 現在の設定
 * @returns 更新後の設定
 */
export function removeStatusLine(settings: ClaudeSettings): ClaudeSettings {
  const { statusLine: _, ...rest } = settings;
  return rest;
}

/**
 * 既存の statusLine 設定があるかチェック
 */
export function hasExistingStatusLine(settings: ClaudeSettings): boolean {
  return settings.statusLine !== undefined;
}

/**
 * 全バックアップファイルを検索
 */
export function findAllBackups(): string[] {
  const claudeDir = getClaudeDir();

  if (!pathExists(claudeDir)) {
    return [];
  }

  try {
    return fs
      .readdirSync(claudeDir)
      .filter((f) => f.startsWith('settings.backup.deepseek-claude-usage.') && f.endsWith('.json'))
      .map((f) => path.join(claudeDir, f));
  } catch {
    return [];
  }
}
