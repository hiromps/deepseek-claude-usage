/**
 * Gitブランチ検出モジュール
 * 現在の作業ディレクトリで git rev-parse --abbrev-ref HEAD 相当を実行
 */
import { execSync } from 'child_process';

/**
 * 現在のディレクトリのGitブランチ名を取得
 * @param cwd 作業ディレクトリのパス
 * @returns ブランチ名、Gitリポジトリでない場合は null
 */
export function getGitBranch(cwd: string): string | null {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd,
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 3000, // 3秒タイムアウト
    }).trim();

    // HEAD が detached 状態の場合は短いコミットハッシュを取得
    if (branch === 'HEAD') {
      const hash = execSync('git rev-parse --short HEAD', {
        cwd,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
        timeout: 3000,
      }).trim();
      return `(detached:${hash})`;
    }

    // 空文字列や無効な値の場合はnullを返す
    if (!branch || branch.length === 0) {
      return null;
    }

    return branch;
  } catch {
    // gitコマンドが利用不可、またはGitリポジトリでない場合
    return null;
  }
}
