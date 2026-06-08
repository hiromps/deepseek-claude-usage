/**
 * status コマンド
 *
 * 現在statusLineに出る予定の文字列をターミナルに表示する
 */
import * as path from 'path';
import { getBalance } from '../deepseek';
import {
  readCache,
  initSessionBalance,
  isCacheValid,
  getCachedBalance,
  getSessionStartBalance,
  updateLastBalance,
} from '../cache';
import { getGitBranch } from '../git';
import { formatStatusLine, formatStatusLineError, formatStatusText, formatStatusJson } from '../format';

export interface StatusOptions {
  json: boolean;
}

/**
 * status コマンドのメイン処理
 */
export async function status(options: StatusOptions): Promise<void> {
  const cwd = path.basename(process.cwd());

  // Gitブランチを取得
  const branch = getGitBranch(process.cwd());

  // 残高情報を取得（キャッシュ付き）
  let balance: number | null = null;
  let spent: number | null = null;
  let currency = 'USD';
  let errorType: 'no_key' | 'error' | undefined;
  let apiKeySource: string | undefined;

  if (isCacheValid()) {
    const cachedBalance = getCachedBalance();
    const startBalance = getSessionStartBalance();
    if (cachedBalance !== null) {
      balance = cachedBalance;
      spent = startBalance !== null ? Math.max(0, startBalance - cachedBalance) : null;
    }
  }

  // キャッシュが無いか期限切れの場合、APIを叩く
  if (balance === null) {
    const result = await getBalance();

    if (result.success) {
      balance = result.balance.balance;
      currency = result.balance.currency;
      apiKeySource = result.apiKeySource;

      const existingCache = readCache();
      if (!existingCache || existingCache.sessionStartBalance === undefined) {
        initSessionBalance(balance);
      } else {
        updateLastBalance(balance);
      }

      const startBalance = getSessionStartBalance();
      spent = startBalance !== null ? Math.max(0, startBalance - balance) : null;
    } else {
      errorType = result.error === 'no_key' ? 'no_key' : 'error';
    }
  }

  // モデル名（status 単体では不明なためデフォルト）
  const modelName = 'Claude';

  // 表示文字列を生成
  let statusLineText: string;
  if (errorType && balance === null) {
    statusLineText = formatStatusLineError(modelName, cwd, errorType);
  } else {
    statusLineText = formatStatusLine(modelName, cwd, branch, balance, spent, currency);
  }

  // 出力
  if (options.json) {
    const jsonData = {
      model: modelName,
      cwd,
      branch,
      balance,
      spent,
      currency,
      errorType: errorType || null,
      apiKeySource: apiKeySource || null,
      statusLine: statusLineText,
    };
    console.log(formatStatusJson(jsonData));
  } else {
    console.log(formatStatusText(statusLineText, {
      modelName,
      cwd,
      branch,
      balance,
      spent,
      currency,
      apiKeySource,
    }));
  }
}

/**
 * コマンドライン引数からStatusOptionsを抽出
 */
export function parseStatusArgs(args: string[]): StatusOptions {
  return {
    json: args.includes('--json'),
  };
}
