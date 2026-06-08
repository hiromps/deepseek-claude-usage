あなたは、npm公開前提のOSS CLIツールを設計・実装する上級TypeScript/Node.jsエンジニアです。

これから `deepseek-claude-usage` というOSSツールをゼロから作成してください。

# 目的

Claude CodeでDeepSeek APIを使っているユーザーが、作業中にClaude Codeのステータスライン上でDeepSeekの残高・セッション消費額・モデル名・作業ディレクトリ・Gitブランチを一目で確認できるようにする。

このツールは「Claude Code × DeepSeek勢向けの使用量メーター」です。

一般ユーザーでも簡単に使えるように、インストールは1行で完了する設計にしてください。

# パッケージ名

`deepseek-claude-usage`

# 想定コマンド

以下のCLIコマンドを実装してください。

```bash
npx deepseek-claude-usage install
npx deepseek-claude-usage uninstall
npx deepseek-claude-usage doctor
npx deepseek-claude-usage status
```

# 最重要要件

1. Claude Codeの `statusLine` に対応すること
2. DeepSeek公式APIの `/user/balance` を使って残高を取得すること
3. `DEEPSEEK_API_KEY` を優先して使うこと
4. `DEEPSEEK_API_KEY` が無い場合は `ANTHROPIC_AUTH_TOKEN` をフォールバックとして使うこと
5. 既存の `~/.claude/settings.json` を壊さないこと
6. インストール前に必ずバックアップを作ること
7. `uninstall` で元の設定に戻せること
8. Windows / macOS / Linux で動くこと
9. ユーザーのAPIキーをファイルに保存しないこと
10. 初心者にもわかりやすいREADMEを作ること
11. npm公開できる完成度にすること

# 表示イメージ

Claude Code下部のstatusLineに以下のような表示を出してください。

```text
🧠 deepseek-v4-pro[1m] | 📁 my-app | 🌿 main | 💰 DS $12.3456 | 🔥 spent $0.0182
```

表示項目:

* モデル名
* 作業ディレクトリ名
* Gitブランチ
* DeepSeek残高
* セッション開始からの推定消費額

# セッション消費額の仕様

DeepSeek APIは残高を返すため、セッション消費額は以下で推定してください。

```text
セッション開始時の残高 - 現在残高 = spent
```

セッション開始時の残高はローカルキャッシュに保存してください。

キャッシュ保存先:

```text
~/.claude/deepseek-claude-usage/cache.json
```

キャッシュには以下を保存してください。

```json
{
  "sessionStartBalance": 12.5,
  "lastBalance": 12.4818,
  "lastCheckedAt": "2026-06-08T00:00:00.000Z"
}
```

ただし、APIを叩きすぎないように、短時間内はキャッシュを使ってください。デフォルトのキャッシュTTLは30秒にしてください。

# Claude Code settings.json の仕様

対象ファイル:

```text
~/.claude/settings.json
```

インストール時には、以下のように `statusLine` を設定してください。

```json
{
  "statusLine": {
    "type": "command",
    "command": "node \"<installed-statusline-path>\"",
    "refreshInterval": 30
  }
}
```

既存の `statusLine` がある場合は、勝手に破壊しないでください。

挙動:

* 既存statusLineが無い場合: そのまま追加
* 既存statusLineがある場合: バックアップを作成したうえで、ユーザーに明確に表示してから上書き
* 非対話環境や `--force` が付いた場合のみ上書き可
* 既存設定はバックアップから復元可能にする

バックアップファイル名:

```text
~/.claude/settings.backup.deepseek-claude-usage.<timestamp>.json
```

# statusLineスクリプトの仕様

Claude CodeはstatusLineコマンドにstdinでJSONを渡します。

そのJSONから以下を取得してください。

* `model.display_name`
* `workspace.current_dir`
* `output_style.name`

Gitブランチは現在の作業ディレクトリで以下相当を実行して取得してください。

```bash
git rev-parse --abbrev-ref HEAD
```

Gitリポジトリでない場合はブランチ表示を省略してください。

エラーが出てもstatusLine全体を壊さないでください。必ず何らかの表示を返してください。

# DeepSeek残高API

以下を使用してください。

```http
GET https://api.deepseek.com/user/balance
Authorization: Bearer <API_KEY>
```

レスポンスの `balance_infos[0].total_balance` と `balance_infos[0].currency` を使って表示してください。

API失敗時は、以下のように短く表示してください。

```text
DS error
```

APIキーが無い場合:

```text
DS no key
```

# CLI仕様

## install

`npx deepseek-claude-usage install`

やること:

1. OSごとのClaude設定ディレクトリを検出
2. `~/.claude/deepseek-claude-usage/` を作成
3. statusLine実行用スクリプトを配置
4. 既存 `settings.json` を読み込む
5. バックアップを作成
6. `statusLine` を追加または更新
7. 成功メッセージを表示
8. APIキー設定方法を表示
9. Claude Code再起動を促す

成功表示例:

```text
✅ deepseek-claude-usage installed!

Claude Code statusLine is now configured.

Set your DeepSeek API key:

macOS/Linux:
  export DEEPSEEK_API_KEY="sk-xxxx"

Windows PowerShell:
  setx DEEPSEEK_API_KEY "sk-xxxx"

Then restart Claude Code.
```

## uninstall

`npx deepseek-claude-usage uninstall`

やること:

1. バックアップを探す
2. 最新のバックアップから `settings.json` を復元
3. キャッシュや配置済みスクリプトを削除するか確認
4. 完了メッセージを表示

## doctor

`npx deepseek-claude-usage doctor`

確認項目:

* Node.js version
* OS
* Claude settings path
* settings.json exists
* statusLine configured
* `DEEPSEEK_API_KEY` exists
* `ANTHROPIC_AUTH_TOKEN` exists
* DeepSeek balance API reachable
* Current balance
* Cache file exists
* Git command available

出力は見やすいチェックリスト形式にしてください。

例:

```text
deepseek-claude-usage doctor

✓ Node.js: v20.11.0
✓ OS: win32 x64
✓ Claude settings: C:\Users\name\.claude\settings.json
✓ statusLine: configured
✓ API key: DEEPSEEK_API_KEY
✓ DeepSeek balance API: OK
✓ Balance: USD 12.3456
```

## status

`npx deepseek-claude-usage status`

現在statusLineに出る予定の文字列をターミナルに表示してください。

# オプション

以下のオプションも可能なら対応してください。

```bash
npx deepseek-claude-usage install --force
npx deepseek-claude-usage status --json
npx deepseek-claude-usage doctor --json
```

# 実装方針

* TypeScriptで実装してください
* Node.js 18以上対応
* ESMまたはCJSはどちらでもよいが、npmで確実に動く構成にしてください
* Windowsパスに強くしてください
* `os.homedir()` を使ってホームディレクトリを取得してください
* JSONの読み書きは安全に行ってください
* 既存JSONのフォーマットは可能な範囲で維持してください
* 失敗時のエラー文は初心者にも分かりやすくしてください
* 外部依存は最小限にしてください
* APIキーや機密情報はログに出さないでください
* テストしやすいように関数を分割してください

# 作成してほしいファイル構成

以下のような構成で作成してください。

```text
deepseek-claude-usage/
├─ package.json
├─ tsconfig.json
├─ README.md
├─ LICENSE
├─ .gitignore
├─ src/
│  ├─ cli.ts
│  ├─ commands/
│  │  ├─ install.ts
│  │  ├─ uninstall.ts
│  │  ├─ doctor.ts
│  │  └─ status.ts
│  ├─ statusline.ts
│  ├─ deepseek.ts
│  ├─ settings.ts
│  ├─ cache.ts
│  ├─ git.ts
│  ├─ paths.ts
│  └─ format.ts
└─ bin/
   └─ deepseek-claude-usage.js
```

必要に応じて構成は改善して構いません。

# package.json 要件

以下を満たしてください。

* package name: `deepseek-claude-usage`
* bin: `deepseek-claude-usage`
* scripts:

  * `build`
  * `dev`
  * `typecheck`
  * `prepare`
* keywords:

  * `claude-code`
  * `deepseek`
  * `usage`
  * `statusline`
  * `cli`
  * `ai`
* license: MIT

# README 要件

READMEはバズりやすく、初心者にも分かるように書いてください。

必ず含める内容:

1. キャッチコピー
2. スクリーンショット風の表示例
3. 1行インストール
4. APIキー設定方法
5. 使い方
6. uninstall方法
7. doctor方法
8. 安全性の説明
9. 既存settings.jsonはバックアップされること
10. APIキーは保存しないこと
11. トラブルシューティング
12. npm publish前のチェックリスト

README冒頭の例:

````md
# deepseek-claude-usage

See your DeepSeek balance and session cost directly inside Claude Code.

```text
🧠 deepseek-v4-pro[1m] | 📁 my-app | 🌿 main | 💰 DS $12.3456 | 🔥 spent $0.0182
````

## Install

```bash
npx deepseek-claude-usage install
```

````

# 品質要件

- `npm run build` が通ること
- `npm run typecheck` が通ること
- Windows PowerShellで動くこと
- macOS/Linuxのbashでも動くこと
- APIキーが無くても落ちないこと
- DeepSeek APIが失敗してもstatusLineは落ちないこと
- Gitリポジトリでなくても落ちないこと
- settings.jsonが存在しない場合は新規作成すること
- settings.jsonが壊れている場合は上書きせず、明確なエラーを出すこと
- uninstallで復元できること

# バズらせるための追加要件

READMEに以下のX投稿例も入れてください。

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
````

# 完了条件

実装後、以下を順番に実行して確認してください。

```bash
npm install
npm run build
npm run typecheck
node bin/deepseek-claude-usage.js doctor
node bin/deepseek-claude-usage.js status
```

最後に、以下を報告してください。

1. 作成したファイル一覧
2. 実装した機能一覧
3. インストール方法
4. APIキー設定方法
5. Claude Codeでの確認方法
6. npm公開前にやるべきこと
7. 既知の注意点

コードは省略せず、実際に動く完成版を作ってください。
