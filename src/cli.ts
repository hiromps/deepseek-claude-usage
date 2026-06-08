#!/usr/bin/env node
/**
 * deepseek-claude-usage CLI エントリポイント
 *
 * コマンド:
 *   install    - Claude Code statusLine に DeepSeek 使用量メーターを設定
 *   uninstall  - 設定を元に戻す
 *   doctor     - 環境診断
 *   status     - 現在の statusLine 表示をプレビュー
 */
import { install, parseInstallArgs, InstallOptions } from './commands/install';
import { uninstall, parseUninstallArgs, UninstallOptions } from './commands/uninstall';
import { doctor, parseDoctorArgs, DoctorOptions } from './commands/doctor';
import { status, parseStatusArgs, StatusOptions } from './commands/status';

/** ヘルプテキスト */
const HELP_TEXT = `deepseek-claude-usage - DeepSeek balance meter for Claude Code statusLine

Usage:
  npx deepseek-claude-usage <command> [options]

Commands:
  install     Configure Claude Code statusLine with DeepSeek usage meter
  uninstall   Remove deepseek-claude-usage and restore settings
  doctor      Check your setup and diagnose issues
  status      Preview what the statusLine will display

Options:
  --force     Skip confirmation prompts (install/uninstall)
  --json      Output in JSON format (doctor/status)
  --help      Show this help message

Examples:
  npx deepseek-claude-usage install
  npx deepseek-claude-usage install --force
  npx deepseek-claude-usage doctor
  npx deepseek-claude-usage doctor --json
  npx deepseek-claude-usage status
  npx deepseek-claude-usage status --json
  npx deepseek-claude-usage uninstall

Environment:
  DEEPSEEK_API_KEY       DeepSeek API key (preferred)
  ANTHROPIC_AUTH_TOKEN   Fallback if DEEPSEEK_API_KEY is not set

Docs: https://github.com/deepseek-claude-usage
`;

/**
 * コマンドライン引数をパースして適切なコマンドを実行
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);

  // ヘルプ
  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(HELP_TEXT);
    process.exit(0);
  }

  const command = args[0].toLowerCase();
  const commandArgs = args.slice(1);

  switch (command) {
    case 'install': {
      const options: InstallOptions = parseInstallArgs(commandArgs);
      await install(options);
      break;
    }

    case 'uninstall': {
      const options: UninstallOptions = parseUninstallArgs(commandArgs);
      await uninstall(options);
      break;
    }

    case 'doctor': {
      const options: DoctorOptions = parseDoctorArgs(commandArgs);
      await doctor(options);
      break;
    }

    case 'status': {
      const options: StatusOptions = parseStatusArgs(commandArgs);
      await status(options);
      break;
    }

    default:
      console.error(`Unknown command: ${command}`);
      console.error(`Run 'npx deepseek-claude-usage --help' for usage information.`);
      process.exit(1);
  }
}

main().catch((err) => {
  console.error('Unexpected error:', err instanceof Error ? err.message : String(err));
  process.exit(1);
});
