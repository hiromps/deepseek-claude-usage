# deepseek-claude-usage

**See your DeepSeek balance and session cost directly inside Claude Code.**

```text
🧠 deepseek-v4-pro[1m] | 📁 my-app | 🌿 main | 💰 DS $12.3456 | 🔥 spent $0.0182
```

DeepSeek課金、見えないの怖すぎたので作りました。

Claude Code で DeepSeek API を使っているユーザー向けの**使用量メーター**です。作業中にステータスライン上で残高・消費額・モデル名・ディレクトリ・Gitブランチを一目で確認できます。

## Features

- 💰 **DeepSeek残高** をリアルタイム表示
- 🔥 **セッション消費額** を自動計算（開始時残高 - 現在残高）
- 🧠 **モデル名** を表示
- 📁 **作業ディレクトリ** を表示
- 🌿 **Gitブランチ** を表示
- ⚡ **30秒間隔** で自動更新
- 🔐 **APIキーを保存しない** 安全設計
- 📦 **既存設定の自動バックアップ** で安心

## Install

```bash
npx deepseek-claude-usage install
```

たった1行です。既存の `~/.claude/settings.json` は自動的にバックアップされます。

### --force オプション

既存の statusLine 設定が既にある場合、`--force` で上書きできます。

```bash
npx deepseek-claude-usage install --force
```

## Setup: API Key

DeepSeek APIキーを環境変数に設定してください。

**macOS / Linux (bash/zsh):**
```bash
export DEEPSEEK_API_KEY="sk-xxxx"
```

永続化するには `~/.bashrc` や `~/.zshrc` に追加してください。

**Windows PowerShell:**
```powershell
$env:DEEPSEEK_API_KEY="sk-xxxx"
```

永続化するには:
```powershell
setx DEEPSEEK_API_KEY "sk-xxxx"
```

**APIキーが無い場合:**

`ANTHROPIC_AUTH_TOKEN` 環境変数がフォールバックとして使われます。

```bash
export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxx"
```

キーが見つからない場合はステータスラインに `DS no key` と表示され、エラーにはなりません。

> ⚠️ `DEEPSEEK_API_KEY` が優先されます。両方設定されている場合は `DEEPSEEK_API_KEY` が使われます。

## Usage

インストール後、Claude Code を再起動すると、画面下部のステータスラインに表示が現れます。

```text
🧠 deepseek-v4-pro[1m] | 📁 my-project | 🌿 feature/cool-stuff | 💰 DS $12.3456 | 🔥 spent $0.0182
```

### 表示の見方

| 表示 | 意味 |
|------|------|
| `🧠 deepseek-v4-pro[1m]` | 現在使用中のモデル名 |
| `📁 my-project` | 作業ディレクトリ名 |
| `🌿 main` | 現在のGitブランチ |
| `💰 DS $12.3456` | DeepSeek APIの現在残高 |
| `🔥 spent $0.0182` | このセッションでの推定消費額 |
| `DS no key` | APIキーが未設定 |
| `DS error` | API接続エラー（残高取得失敗） |

Gitリポジトリ外で作業している場合は、ブランチ表示が自動的に省略されます。

## Check Status

ターミナルで現在の表示内容を確認できます。

```bash
npx deepseek-claude-usage status
```

出力例:
```
deepseek-claude-usage status

StatusLine preview: 🧠 Claude | 📁 my-app | 🌿 main | 💰 DS $12.3456 | 🔥 spent $0.0182

  Model:      Claude
  Directory:  my-app
  Branch:     main
  Balance:    USD 12.3456
  Spent:      USD 0.0182
  API Key:    DEEPSEEK_API_KEY
```

JSON形式でも出力できます。

```bash
npx deepseek-claude-usage status --json
```

## Doctor (診断)

環境の状態をチェックできます。問題がある場合はここで分かります。

```bash
npx deepseek-claude-usage doctor
```

出力例:
```
deepseek-claude-usage doctor

✓ Node.js: v20.11.0
✓ OS: win32 x64
✓ Claude settings: C:\Users\name\.claude\settings.json
✓ settings.json: exists
✓ statusLine: configured (type: command)
✓ DEEPSEEK_API_KEY: set (sk-xx...xxxx)
✓ API key (resolved): using DEEPSEEK_API_KEY
✓ DeepSeek balance API: OK
✓ Balance: USD 12.3456
✓ Git: git version 2.43.0
```

```bash
npx deepseek-claude-usage doctor --json
```

## Uninstall

```bash
npx deepseek-claude-usage uninstall
```

アンインストール時の動作:
1. バックアップから `settings.json` を復元
2. `~/.claude/deepseek-claude-usage/` ディレクトリを削除
3. キャッシュファイルを削除

`--keep-cache` オプションでキャッシュとスクリプトを残すこともできます。

```bash
npx deepseek-claude-usage uninstall --keep-cache
```

## Safety & Security

### APIキーは保存しません

このツールはAPIキーを**一切ファイルに保存しません**。APIキーは環境変数からのみ読み取り、メモリ上でのみ使用します。

### 既存設定のバックアップ

インストール時に、既存の `~/.claude/settings.json` は自動的にバックアップされます。

```text
~/.claude/settings.backup.deepseek-claude-usage.2026-06-08T12-00-00-000Z.json
```

`uninstall` コマンドで、このバックアップから元の設定に復元できます。

### APIキーがログに出ることはありません

エラーメッセージやデバッグ出力にAPIキーが含まれることはありません。doctor コマンドではマスク表示（`sk-xx...xxxx`）になります。

## Troubleshooting

### statusLine に何も表示されない

1. `npx deepseek-claude-usage doctor` で環境をチェック
2. Claude Code を再起動する
3. `DEEPSEEK_API_KEY` が正しく設定されているか確認
4. `~/.claude/settings.json` に statusLine 設定があるか確認

### `DS no key` と表示される

APIキーが設定されていません。以下を確認:
- `DEEPSEEK_API_KEY` 環境変数が設定されているか
- `ANTHROPIC_AUTH_TOKEN` 環境変数が設定されているか
- Claude Codeの再起動後に環境変数が読み込まれているか

### `DS error` と表示される

DeepSeek APIへの接続に失敗しています。
- インターネット接続を確認
- APIキーが有効か確認（[DeepSeek Platform](https://platform.deepseek.com/) で確認）
- ファイアウォールが `api.deepseek.com` へのアクセスをブロックしていないか確認

### `npx` でパッケージが見つからない

npmレジストリに公開されるまでは、ローカルでビルドして使用してください。

```bash
git clone <repo-url>
cd deepseek-claude-usage
npm install
npm run build
npm link
deepseek-claude-usage install
```

## How It Works

```text
Claude Code
  └─ statusLine (30秒間隔で実行)
      └─ node ~/.claude/deepseek-claude-usage/statusline.js
          ├─ stdin からJSONを読み取り（モデル名、作業ディレクトリ）
          ├─ DeepSeek API (/user/balance) から残高を取得
          ├─ cache.json でセッション開始残高を管理
          ├─ git rev-parse でブランチ名を取得
          └─ フォーマットして stdout に出力
```

**キャッシュ戦略:**
- デフォルトTTL: 30秒
- TTL内はAPIコールをスキップ（キャッシュ使用）
- セッション開始時の残高はキャッシュに保存
- `spent = セッション開始時残高 - 現在残高`

## Requirements

- **Node.js** >= 18.0.0
- **Claude Code** (CLI版) がインストールされていること
- **DeepSeek APIキー** (または Anthropic APIキー)
- **Git** (オプション - ブランチ表示に使用)

## Xでシェア

```text
Claude Code × DeepSeek勢向けに作りました。

作業画面の下に
・DeepSeek残高
・今回の消費額
・モデル名
・git branch
をリアルタイム表示できます。

インストールは1行👇

npx deepseek-claude-usage install

DeepSeek課金、見えないの怖すぎたので作った。
```

---

## Development

### ローカルビルド

```bash
npm install
npm run build
npm run typecheck
```

### ローカルテスト

```bash
# doctor（環境診断）
node bin/deepseek-claude-usage.js doctor

# status（表示プレビュー）
node bin/deepseek-claude-usage.js status
```

### npm publish 前チェックリスト

- [ ] `npm run build` が成功する
- [ ] `npm run typecheck` が成功する
- [ ] `npm pack` で必要なファイルのみ含まれている
- [ ] `node bin/deepseek-claude-usage.js doctor` が動作する
- [ ] `node bin/deepseek-claude-usage.js status` が動作する
- [ ] Windows / macOS / Linux で動作確認
- [ ] APIキー無しでも落ちないことを確認
- [ ] DeepSeek APIエラー時も落ちないことを確認
- [ ] Gitリポジトリ外でも落ちないことを確認
- [ ] バックアップと復元が正しく動作する
- [ ] READMEのリンクと手順が正しい

## License

MIT
