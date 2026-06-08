/**
 * キャッシュ管理モジュール
 * ~/.claude/deepseek-claude-usage/cache.json の読み書きを担当
 *
 * キャッシュには以下を保存:
 * - sessionStartBalance: セッション開始時の残高
 * - lastBalance: 最後に取得した残高
 * - lastCheckedAt: 最終確認時刻 (ISO 8601)
 */
import * as fs from 'fs';
import { getCachePath, getToolDir, pathExists } from './paths';

export interface CacheData {
  sessionStartBalance: number;
  lastBalance: number;
  lastCheckedAt: string;
}

/** デフォルトのキャッシュTTL (ミリ秒) */
export const DEFAULT_CACHE_TTL_MS = 30_000; // 30秒

/**
 * キャッシュファイルを読み込む
 * ファイルが存在しない場合は null を返す
 */
export function readCache(): CacheData | null {
  try {
    if (!pathExists(getCachePath())) {
      return null;
    }
    const raw = fs.readFileSync(getCachePath(), 'utf-8');
    const data: unknown = JSON.parse(raw);
    if (isValidCacheData(data)) {
      return data;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * キャッシュデータの型チェック
 */
function isValidCacheData(data: unknown): data is CacheData {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    typeof d.sessionStartBalance === 'number' &&
    typeof d.lastBalance === 'number' &&
    typeof d.lastCheckedAt === 'string'
  );
}

/**
 * キャッシュファイルに書き込む
 * ディレクトリが存在しない場合は作成する
 */
export function writeCache(data: CacheData): void {
  try {
    const toolDir = getToolDir();
    if (!pathExists(toolDir)) {
      fs.mkdirSync(toolDir, { recursive: true });
    }
    fs.writeFileSync(getCachePath(), JSON.stringify(data, null, 2), 'utf-8');
  } catch {
    // キャッシュ書き込み失敗は無視（表示には影響しない）
  }
}

/**
 * セッション開始時の残高を取得
 * キャッシュがない場合は現在の残高でセッションを開始する
 */
export function getSessionStartBalance(): number | null {
  const cache = readCache();
  if (!cache) return null;
  return cache.sessionStartBalance;
}

/**
 * セッション開始時の残高を設定（キャッシュがない場合の初回呼び出し時）
 * 既存のキャッシュがある場合は上書きしない
 */
export function initSessionBalance(balance: number): void {
  const existing = readCache();
  if (existing) {
    // 既存のセッション開始残高を維持しつつ、lastBalance のみ更新
    writeCache({
      sessionStartBalance: existing.sessionStartBalance,
      lastBalance: balance,
      lastCheckedAt: new Date().toISOString(),
    });
  } else {
    // 新規セッション
    writeCache({
      sessionStartBalance: balance,
      lastBalance: balance,
      lastCheckedAt: new Date().toISOString(),
    });
  }
}

/**
 * 最終確認残高を更新
 */
export function updateLastBalance(balance: number): void {
  const existing = readCache();
  writeCache({
    sessionStartBalance: existing?.sessionStartBalance ?? balance,
    lastBalance: balance,
    lastCheckedAt: new Date().toISOString(),
  });
}

/**
 * キャッシュが有効期限内かチェック
 * @param ttlMs キャッシュTTL（ミリ秒）
 * @returns 有効期限内なら true
 */
export function isCacheValid(ttlMs: number = DEFAULT_CACHE_TTL_MS): boolean {
  const cache = readCache();
  if (!cache) return false;
  const elapsed = Date.now() - new Date(cache.lastCheckedAt).getTime();
  return elapsed < ttlMs;
}

/**
 * キャッシュから最後の残高を取得（APIコール不要な場合に使用）
 */
export function getCachedBalance(): number | null {
  const cache = readCache();
  if (!cache) return null;
  return cache.lastBalance;
}

/**
 * キャッシュファイルを削除
 */
export function clearCache(): void {
  try {
    if (pathExists(getCachePath())) {
      fs.unlinkSync(getCachePath());
    }
  } catch {
    // 削除失敗は無視
  }
}
