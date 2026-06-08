/**
 * uninstall コマンド
 *
 * やること:
 * 1. バックアップを探す
 * 2. 最新のバックアップから settings.json を復元
 * 3. キャッシュや配置済みスクリプトを削除するか確認
 * 4. 完了メッセージを表示
 */
import * as fs from 'fs';
import {
  getToolDir,
  getSettingsPath,
  pathExists,
} from '../paths';
import {
  readSettings,
  writeSettings,
  restoreFromBackup,
  findLatestBackup,
  findAllBackups,
  removeStatusLine,
  hasExistingStatusLine,
} from '../settings';

export interface UninstallOptions {
  force: boolean;
  keepCache: boolean;
}

/**
 * ディレクトリを再帰的に削除
 */
function removeDirectory(dir: string): void {
  if (pathExists(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * uninstall コマンドのメイン処理
 */
export async function uninstall(options: UninstallOptions): Promise<void> {
  const { force, keepCache } = options;

  console.log('deepseek-claude-usage uninstall\n');

  // 1. バックアップを探す
  const latestBackup = findLatestBackup();

  // 2. settings.json から statusLine を削除
  const settingsPath = getSettingsPath();
  if (pathExists(settingsPath)) {
    try {
      const { settings } = readSettings();

      if (hasExistingStatusLine(settings)) {
        if (latestBackup && pathExists(latestBackup)) {
          // バックアップから復元
          console.log(`📦 Restoring settings from backup: ${latestBackup}`);
          restoreFromBackup(latestBackup);
          console.log('✅ Settings restored from backup.');
        } else {
          // バックアップが無い場合は statusLine を削除
          console.log('📝 Removing statusLine from settings.json...');
          const newSettings = removeStatusLine(settings);
          writeSettings(newSettings);
          console.log('✅ statusLine removed from settings.json.');
        }
      } else {
        console.log('ℹ️  No statusLine configuration found in settings.json.');
      }
    } catch (err) {
      console.error(`❌ Error reading settings.json: ${err instanceof Error ? err.message : String(err)}`);
      if (!force) {
        process.exit(1);
      }
    }
  }

  // 3. ツールディレクトリの削除
  const toolDir = getToolDir();
  if (pathExists(toolDir)) {
    if (keepCache) {
      console.log(`\n💡 Tool files kept at: ${toolDir}`);
      console.log('   (--keep-cache was specified)');
    } else {
      removeDirectory(toolDir);
      console.log(`\n🗑️  Removed: ${toolDir}`);
    }
  }

  // 4. 残ったバックアップファイルの情報
  const allBackups = findAllBackups();
  if (allBackups.length > 0) {
    console.log(`\n📦 ${allBackups.length} backup file(s) remain in ~/.claude/:`);
    for (const backup of allBackups) {
      console.log(`   ${backup}`);
    }
    console.log('   Remove them manually if no longer needed.');
  }

  console.log('\n✅ deepseek-claude-usage uninstalled!');
}

/**
 * コマンドライン引数からUninstallOptionsを抽出
 */
export function parseUninstallArgs(args: string[]): UninstallOptions {
  const force = args.includes('--force') || args.includes('-f');
  const keepCache = args.includes('--keep-cache');
  return { force, keepCache };
}
