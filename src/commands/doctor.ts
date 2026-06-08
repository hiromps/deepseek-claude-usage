/**
 * doctor コマンド
 *
 * 確認項目:
 * - Node.js version
 * - OS
 * - Claude settings path
 * - settings.json exists
 * - statusLine configured
 * - DEEPSEEK_API_KEY exists
 * - ANTHROPIC_AUTH_TOKEN exists
 * - DeepSeek balance API reachable
 * - Current balance
 * - Cache file exists
 * - Git command available
 */
import * as os from 'os';
import { getSettingsPath, getCachePath, pathExists } from '../paths';
import { readSettings, hasExistingStatusLine } from '../settings';
import { findApiKey, getBalance } from '../deepseek';
import { formatDoctorResults, DoctorCheckItem } from '../format';
import { execSync } from 'child_process';

export interface DoctorOptions {
  json: boolean;
}

/**
 * doctor コマンドのメイン処理
 */
export async function doctor(options: DoctorOptions): Promise<void> {
  const items: DoctorCheckItem[] = [];

  // Node.js version
  items.push({
    label: 'Node.js',
    status: 'ok',
    detail: process.version,
  });

  // OS
  items.push({
    label: 'OS',
    status: 'ok',
    detail: `${os.platform()} ${os.arch()}`,
  });

  // Claude settings path
  const settingsPath = getSettingsPath();
  items.push({
    label: 'Claude settings',
    status: 'info',
    detail: settingsPath,
  });

  // settings.json exists
  const settingsExists = pathExists(settingsPath);
  items.push({
    label: 'settings.json',
    status: settingsExists ? 'ok' : 'warn',
    detail: settingsExists ? 'exists' : 'not found (will be created on install)',
  });

  // statusLine configured
  if (settingsExists) {
    try {
      const { settings } = readSettings();
      const hasStatusLine = hasExistingStatusLine(settings);
      items.push({
        label: 'statusLine',
        status: hasStatusLine ? 'ok' : 'info',
        detail: hasStatusLine
          ? `configured (type: ${settings.statusLine?.type})`
          : 'not configured',
      });
    } catch {
      items.push({
        label: 'statusLine',
        status: 'fail',
        detail: 'cannot read settings.json (corrupted?)',
      });
    }
  } else {
    items.push({
      label: 'statusLine',
      status: 'info',
      detail: 'not configured (settings.json not found)',
    });
  }

  // DEEPSEEK_API_KEY
  const deepseekKey = process.env.DEEPSEEK_API_KEY;
  items.push({
    label: 'DEEPSEEK_API_KEY',
    status: deepseekKey ? 'ok' : 'info',
    detail: deepseekKey
      ? `set (${maskKey(deepseekKey)})`
      : 'not set',
  });

  // ANTHROPIC_AUTH_TOKEN
  const anthropicToken = process.env.ANTHROPIC_AUTH_TOKEN;
  items.push({
    label: 'ANTHROPIC_AUTH_TOKEN',
    status: anthropicToken ? 'ok' : 'info',
    detail: anthropicToken
      ? `set (${maskKey(anthropicToken)})`
      : 'not set',
  });

  // API key available
  const apiKeyResult = findApiKey();
  items.push({
    label: 'API key (resolved)',
    status: apiKeyResult ? 'ok' : 'warn',
    detail: apiKeyResult
      ? `using ${apiKeyResult.source}`
      : 'no API key available (set DEEPSEEK_API_KEY or ANTHROPIC_AUTH_TOKEN)',
  });

  // DeepSeek balance API reachable
  if (apiKeyResult) {
    const balanceResult = await getBalance();
    if (balanceResult.success) {
      items.push({
        label: 'DeepSeek balance API',
        status: 'ok',
        detail: 'OK',
      });
      items.push({
        label: 'Balance',
        status: 'ok',
        detail: `${balanceResult.balance.currency} ${balanceResult.balance.balance.toFixed(4)}`,
      });
    } else {
      items.push({
        label: 'DeepSeek balance API',
        status: 'fail',
        detail: balanceResult.error === 'no_key' ? 'no API key' : balanceResult.message,
      });
    }
  } else {
    items.push({
      label: 'DeepSeek balance API',
      status: 'warn',
      detail: 'skipped (no API key)',
    });
  }

  // Cache file exists
  const cacheExists = pathExists(getCachePath());
  items.push({
    label: 'Cache file',
    status: cacheExists ? 'ok' : 'info',
    detail: cacheExists ? getCachePath() : 'not yet created',
  });

  // Git command available
  try {
    const gitVersion = execSync('git --version', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
    }).trim();
    items.push({
      label: 'Git',
      status: 'ok',
      detail: gitVersion,
    });
  } catch {
    items.push({
      label: 'Git',
      status: 'warn',
      detail: 'not available (branch display will be disabled)',
    });
  }

  // 出力
  if (options.json) {
    const jsonOutput = items.map((item) => ({
      check: item.label,
      status: item.status,
      detail: item.detail,
    }));
    console.log(JSON.stringify(jsonOutput, null, 2));
  } else {
    console.log(formatDoctorResults(items));
  }

  // 終了コード
  const hasFailures = items.some((item) => item.status === 'fail');
  if (hasFailures) {
    process.exit(1);
  }
}

/**
 * APIキーをマスクして表示（セキュリティ対策）
 */
function maskKey(key: string): string {
  if (key.length <= 8) {
    return '***';
  }
  return key.slice(0, 4) + '...' + key.slice(-4);
}

/**
 * コマンドライン引数からDoctorOptionsを抽出
 */
export function parseDoctorArgs(args: string[]): DoctorOptions {
  return {
    json: args.includes('--json'),
  };
}
