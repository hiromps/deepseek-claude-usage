/**
 * Claude Code statusLine スクリプト
 *
 * Claude Codeからstdinで渡されるJSONを読み取り、
 * DeepSeek残高・セッション消費額・モデル名・作業ディレクトリ・Gitブランチ
 * を整形して標準出力に書き出す。
 *
 * エラー発生時も必ず何らかの表示を返し、statusLine全体を壊さない。
 */
import { getBalance } from './deepseek';
import {
  readCache,
  initSessionBalance,
  isCacheValid,
  getCachedBalance,
  getSessionStartBalance,
  updateLastBalance,
} from './cache';
import { getGitBranch } from './git';
import { formatStatusLine, formatStatusLineError } from './format';
import * as path from 'path';

/** Claude Codeからstdinで渡されるJSONの型 */
interface StatusLineInput {
  model?: {
    display_name?: string;
  };
  workspace?: {
    current_dir?: string;
  };
  output_style?: {
    name?: string;
  };
}

/**
 * stdinからJSONを読み取る
 * タイムアウト付き（Claude CodeがJSONを送らない場合もあるため）
 */
function readStdin(): Promise<string> {
  return new Promise((resolve) => {
    // stdinがTTYの場合は空文字を返す（手動実行時など）
    if (process.stdin.isTTY) {
      resolve('');
      return;
    }

    const timeout = setTimeout(() => {
      resolve(''); // タイムアウト時は空文字を返す
    }, 2000);

    let data = '';
    process.stdin.setEncoding('utf-8');
    process.stdin.on('data', (chunk: string) => {
      data += chunk;
    });
    process.stdin.on('end', () => {
      clearTimeout(timeout);
      resolve(data);
    });
    process.stdin.on('error', () => {
      clearTimeout(timeout);
      resolve('');
    });

    // stdinをresumeして読み取り開始
    process.stdin.resume();
  });
}

/**
 * 入力JSONからモデル名を抽出
 */
function extractModelName(input: StatusLineInput | null): string {
  return input?.model?.display_name || 'Claude';
}

/**
 * 入力JSONから作業ディレクトリ名を抽出
 */
function extractCwd(input: StatusLineInput | null): string {
  const dir = input?.workspace?.current_dir || process.cwd();
  try {
    return path.basename(dir);
  } catch {
    return dir;
  }
}

/**
 * 残高情報を取得（キャッシュ付き）
 * TTL内ならキャッシュを使用し、APIコールを節約する
 */
async function getBalanceWithCache(): Promise<{
  balance: number | null;
  spent: number | null;
  currency: string;
  errorType?: 'no_key' | 'error';
}> {
  // キャッシュが有効期限内ならキャッシュの残高を使用
  if (isCacheValid()) {
    const cachedBalance = getCachedBalance();
    const startBalance = getSessionStartBalance();

    if (cachedBalance !== null) {
      const spent = startBalance !== null ? startBalance - cachedBalance : null;
      return {
        balance: cachedBalance,
        spent: spent !== null ? Math.max(0, spent) : null,
        currency: 'USD', // 通貨はキャッシュに保存していないのでデフォルト
      };
    }
  }

  // APIから残高を取得
  const result = await getBalance();

  if (!result.success) {
    return {
      balance: null,
      spent: null,
      currency: 'USD',
      errorType: result.error === 'no_key' ? 'no_key' : 'error',
    };
  }

  // キャッシュを初期化・更新
  const existingCache = readCache();
  if (!existingCache || existingCache.sessionStartBalance === undefined) {
    initSessionBalance(result.balance.balance);
  } else {
    updateLastBalance(result.balance.balance);
  }

  const startBalance = getSessionStartBalance();
  const spent = startBalance !== null ? startBalance - result.balance.balance : null;

  return {
    balance: result.balance.balance,
    spent: spent !== null ? Math.max(0, spent) : null,
    currency: result.balance.currency,
  };
}

/**
 * メイン処理
 */
async function main(): Promise<void> {
  try {
    // stdinからJSONを読み取り
    const stdinData = await readStdin();

    let input: StatusLineInput | null = null;
    if (stdinData && stdinData.trim().length > 0) {
      try {
        input = JSON.parse(stdinData);
      } catch {
        // JSONパース失敗時は無視（空として扱う）
      }
    }

    const modelName = extractModelName(input);
    const cwd = extractCwd(input);

    // Gitブランチを取得
    const workspaceDir = input?.workspace?.current_dir || process.cwd();
    const branch = getGitBranch(workspaceDir);

    // 残高情報を取得
    const { balance, spent, currency, errorType } = await getBalanceWithCache();

    // エラーがある場合はエラー表示
    if (errorType && balance === null) {
      const errorOutput = formatStatusLineError(modelName, cwd, errorType);
      process.stdout.write(errorOutput);
      return;
    }

    // 通常表示
    const output = formatStatusLine(modelName, cwd, branch, balance, spent, currency);
    process.stdout.write(output);
  } catch {
    // 完全に予期しないエラーの場合も、最低限の表示を返す
    process.stdout.write('DS error');
  }
}

// モジュールとして読み込まれた場合（require）はmainをエクスポート
// 直接実行された場合はmainを実行
if (require.main === module) {
  main().catch(() => {
    process.stdout.write('DS error');
  });
}

export { main };
