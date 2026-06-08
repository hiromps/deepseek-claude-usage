/**
 * DeepSeek API クライアント
 * DeepSeek公式APIの /user/balance エンドポイントを使って残高を取得する
 *
 * APIキーの優先順位:
 * 1. DEEPSEEK_API_KEY 環境変数
 * 2. ANTHROPIC_AUTH_TOKEN 環境変数（フォールバック）
 */
import * as https from 'https';

/** DeepSeek残高APIのレスポンス型 */
export interface DeepSeekBalanceResponse {
  is_available: boolean;
  balance_infos: Array<{
    currency: string;
    total_balance: string;
    granted_balance: string;
    topped_up_balance: string;
  }>;
}

/** 残高情報の結果 */
export interface BalanceResult {
  balance: number;
  currency: string;
  rawBalance: string;
}

/** APIキー検出結果 */
export interface ApiKeyResult {
  key: string;
  source: 'DEEPSEEK_API_KEY' | 'ANTHROPIC_AUTH_TOKEN';
}

/**
 * 利用可能なAPIキーを探す
 * 優先順位: DEEPSEEK_API_KEY > ANTHROPIC_AUTH_TOKEN
 * @returns APIキー情報、どちらも無い場合は null
 */
export function findApiKey(): ApiKeyResult | null {
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  if (deepseekKey && deepseekKey.trim().length > 0) {
    return { key: deepseekKey.trim(), source: 'DEEPSEEK_API_KEY' };
  }

  const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN;
  if (anthropicToken && anthropicToken.trim().length > 0) {
    return { key: anthropicToken.trim(), source: 'ANTHROPIC_AUTH_TOKEN' };
  }

  return null;
}

/**
 * DeepSeek API から残高を取得
 * GET https://api.deepseek.com/user/balance
 * Authorization: Bearer <API_KEY>
 *
 * @param apiKey DeepSeek APIキー
 * @returns 残高情報
 */
export function fetchBalance(apiKey: string): Promise<BalanceResult> {
  return new Promise((resolve, reject) => {
    const url = new URL('https://api.deepseek.com/user/balance');

    const options: https.RequestOptions = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      timeout: 10_000, // 10秒タイムアウト
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk: Buffer) => {
        body += chunk.toString();
      });
      res.on('end', () => {
        try {
          if (res.statusCode !== 200) {
            reject(new Error(`DeepSeek API returned status ${res.statusCode}: ${body.slice(0, 200)}`));
            return;
          }

          const data: DeepSeekBalanceResponse = JSON.parse(body);

          if (!data.balance_infos || data.balance_infos.length === 0) {
            reject(new Error('DeepSeek API returned empty balance_infos'));
            return;
          }

          const info = data.balance_infos[0];
          const balance = parseFloat(info.total_balance);

          if (isNaN(balance)) {
            reject(new Error(`DeepSeek API returned invalid balance: ${info.total_balance}`));
            return;
          }

          resolve({
            balance,
            currency: info.currency,
            rawBalance: info.total_balance,
          });
        } catch (err) {
          reject(err instanceof Error ? err : new Error(String(err)));
        }
      });
    });

    req.on('error', (err) => {
      reject(new Error(`DeepSeek API request failed: ${err.message}`));
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('DeepSeek API request timed out'));
    });

    req.end();
  });
}

/**
 * APIキーを探して残高を取得する統合関数
 * @returns 残高情報、APIキーがない場合は 'no_key'、失敗時はエラー
 */
export async function getBalance(): Promise<
  { success: true; balance: BalanceResult; apiKeySource: string }
  | { success: false; error: 'no_key' | 'api_error'; message: string }
> {
  const apiKeyResult = findApiKey();
  if (!apiKeyResult) {
    return {
      success: false,
      error: 'no_key',
      message: 'No API key found. Set DEEPSEEK_API_KEY or ANTHROPIC_AUTH_TOKEN.',
    };
  }

  try {
    const balance = await fetchBalance(apiKeyResult.key);
    return {
      success: true,
      balance,
      apiKeySource: apiKeyResult.source,
    };
  } catch (err) {
    return {
      success: false,
      error: 'api_error',
      message: err instanceof Error ? err.message : String(err),
    };
  }
}
