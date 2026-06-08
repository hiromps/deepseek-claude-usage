/**
 * 出力フォーマットユーティリティ
 * statusLine表示、doctor結果、status出力のフォーマットを担当
 */

/**
 * Claude Code statusLine 用の表示文字列を生成
 *
 * 表示例:
 * 🧠 deepseek-v4-pro[1m] | 📁 my-app | 🌿 main | 💰 DS $12.3456 | 🔥 spent $0.0182
 *
 * @param modelName モデル名
 * @param cwd 作業ディレクトリ名
 * @param branch Gitブランチ名 (nullの場合は非表示)
 * @param balance DeepSeek残高
 * @param spent セッション消費額 (nullの場合は非表示)
 * @param currency 通貨
 */
export function formatStatusLine(
  modelName: string,
  cwd: string,
  branch: string | null,
  balance: number | null,
  spent: number | null,
  currency: string
): string {
  const parts: string[] = [];

  // モデル名
  if (modelName) {
    parts.push(`🧠 ${modelName}`);
  }

  // 作業ディレクトリ
  if (cwd) {
    parts.push(`📁 ${cwd}`);
  }

  // Gitブランチ
  if (branch) {
    parts.push(`🌿 ${branch}`);
  }

  // DeepSeek残高
  if (balance !== null) {
    parts.push(`💰 DS ${currency} ${balance.toFixed(4)}`);
  }

  // セッション消費額
  if (spent !== null && spent >= 0) {
    parts.push(`🔥 spent ${currency} ${spent.toFixed(4)}`);
  }

  return parts.join(' | ');
}

/**
 * エラー時のstatusLine表示
 */
export function formatStatusLineError(modelName: string, cwd: string, errorType: 'no_key' | 'error'): string {
  const parts: string[] = [];

  if (modelName) {
    parts.push(`🧠 ${modelName}`);
  }
  if (cwd) {
    parts.push(`📁 ${cwd}`);
  }

  if (errorType === 'no_key') {
    parts.push('DS no key');
  } else {
    parts.push('DS error');
  }

  return parts.join(' | ');
}

/**
 * Doctor チェック結果の1行
 */
export interface DoctorCheckItem {
  label: string;
  status: 'ok' | 'fail' | 'warn' | 'info';
  detail: string;
}

/**
 * Doctor 結果をテキスト形式でフォーマット
 */
export function formatDoctorResults(items: DoctorCheckItem[]): string {
  const lines: string[] = ['deepseek-claude-usage doctor', ''];

  for (const item of items) {
    const icon = statusIcon(item.status);
    lines.push(`${icon} ${item.label}: ${item.detail}`);
  }

  return lines.join('\n');
}

function statusIcon(status: DoctorCheckItem['status']): string {
  switch (status) {
    case 'ok': return '✓';
    case 'fail': return '✗';
    case 'warn': return '⚠';
    case 'info': return 'ℹ';
  }
}

/**
 * Status 出力をテキスト形式でフォーマット
 */
export function formatStatusText(statusLineText: string, details?: {
  modelName?: string;
  cwd?: string;
  branch?: string | null;
  balance?: number | null;
  spent?: number | null;
  currency?: string;
  apiKeySource?: string;
}): string {
  const lines: string[] = [
    'deepseek-claude-usage status',
    '',
    `StatusLine preview: ${statusLineText}`,
  ];

  if (details) {
    lines.push('');
    if (details.modelName) lines.push(`  Model:      ${details.modelName}`);
    if (details.cwd) lines.push(`  Directory:  ${details.cwd}`);
    if (details.branch) lines.push(`  Branch:     ${details.branch}`);
    if (details.balance !== null && details.balance !== undefined) {
      lines.push(`  Balance:    ${details.currency} ${details.balance.toFixed(4)}`);
    }
    if (details.spent !== null && details.spent !== undefined) {
      lines.push(`  Spent:      ${details.currency} ${details.spent.toFixed(4)}`);
    }
    if (details.apiKeySource) lines.push(`  API Key:    ${details.apiKeySource}`);
  }

  return lines.join('\n');
}

/**
 * Status 出力をJSON形式でフォーマット
 */
export function formatStatusJson(data: Record<string, unknown>): string {
  return JSON.stringify(data, null, 2);
}
