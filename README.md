# deepseek-claude-usage

**Claude Code の画面下に DeepSeek の残高と使用量をリアルタイム表示する CLI ツール**

```text
🧠 deepseek-v4-pro[1m] | 📁 my-app | 🌿 main | 💰 DS $12.3456 | 🔥 spent $0.0182
```

DeepSeek の課金、こわいですよね。気づいたら残高が減っていて「えっ」てなったこと、ありませんか？

このツールを入れれば、Claude Code で作業しながら **DeepSeek の残高・セッション消費額・モデル名・ディレクトリ・Git ブランチ** が画面下に常に表示されます。もう `platform.deepseek.com` を開いて残高を確認する必要はありません。

---

## どんな人向け？

- Claude Code で DeepSeek API を使っている人
- 従量課金の残高が気になる人
- 「今どのモデル使ってるんだっけ？」とよく忘れる人
- 複数プロジェクトを行き来する人（Git ブランチ表示が便利）

## できること

| 機能 | 説明 |
|------|------|
| 💰 **DeepSeek 残高** | リアルタイムで残高を表示 |
| 🔥 **セッション消費額** | 作業開始からいくら使ったか自動計算 |
| 🧠 **モデル名** | 今使っているモデルを表示 |
| 📁 **作業ディレクトリ** | どのプロジェクトで作業しているか一目でわかる |
| 🌿 **Git ブランチ** | 現在のブランチを表示（Git リポジトリ外では非表示） |
| ⚡ **30秒自動更新** | API を叩きすぎないキャッシュ付き |
| 🔐 **API キー非保存** | キーは環境変数のみ、ファイルには絶対に保存しない |
| 📦 **設定の自動バックアップ** | インストール前に既存設定を必ずバックアップ |

---

## インストール

```bash
npx deepseek-claude-usage install
```

**これだけです。** 1行コピペするだけ。

既存の `~/.claude/settings.json` は自動的にバックアップされるので、安心して実行してください。

### 上書きインストール（すでに statusLine を設定している場合）

```bash
npx deepseek-claude-usage install --force
```

---

## API キーの設定

DeepSeek の API キーを環境変数に設定してください。

### macOS / Linux（bash / zsh）

一時的に設定する場合：
```bash
export DEEPSEEK_API_KEY="sk-xxxx"
```

毎回設定するのが面倒な場合は、`~/.bashrc` または `~/.zshrc` の末尾に追記してください：
```bash
echo 'export DEEPSEEK_API_KEY="sk-xxxx"' >> ~/.bashrc
source ~/.bashrc
```

### Windows（PowerShell）

一時的に設定する場合：
```powershell
$env:DEEPSEEK_API_KEY="sk-xxxx"
```

永続化する場合（管理者として実行）：
```powershell
setx DEEPSEEK_API_KEY "sk-xxxx"
```

> 💡 **ヒント**: PowerShell で `setx` した環境変数は、新しく開いたターミナルから有効になります。設定後はターミナルを開き直してください。

### API キーを持っていない場合

Anthropic の API キー（`ANTHROPIC_AUTH_TOKEN`）が設定されていれば、自動的にフォールバックとして使われます。

```bash
export ANTHROPIC_AUTH_TOKEN="sk-ant-xxxx"
```

> ⚠️ **優先順位**: `DEEPSEEK_API_KEY` > `ANTHROPIC_AUTH_TOKEN`  
> 両方設定されている場合は `DEEPSEEK_API_KEY` が使われます。

API キーがひとつも見つからない場合は、ステータスラインに `DS no key` と表示されます。エラーで落ちることはありません。

---

## 使い方

インストール後、**Claude Code を再起動**してください。画面最下部のステータスラインに表示が現れます。

```text
🧠 deepseek-v4-pro[1m] | 📁 my-project | 🌿 feature/cool-stuff | 💰 DS $12.3456 | 🔥 spent $0.0182
```

### 表示の見方

| 表示 | 意味 |
|------|------|
| `🧠 deepseek-v4-pro[1m]` | 現在使用中のモデル名 |
| `📁 my-project` | 作業中のディレクトリ名 |
| `🌿 main` | 現在の Git ブランチ |
| `💰 DS $12.3456` | DeepSeek API の現在残高 |
| `🔥 spent $0.0182` | このセッションでの推定消費額 |
| `DS no key` | API キー未設定 |
| `DS error` | API 接続エラー |

> 📝 Git リポジトリ外で作業している場合は、ブランチ表示だけ自動的に省略されます。

---

## コマンド一覧

### `status` — いまの表示をターミナルで確認

```bash
npx deepseek-claude-usage status
```

出力例：
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

JSON 形式でも出力できます：
```bash
npx deepseek-claude-usage status --json
```

### `doctor` — 環境の健康診断

設定がうまくいかないときは、まずこれを実行してください。

```bash
npx deepseek-claude-usage doctor
```

出力例：
```
deepseek-claude-usage doctor

✓ Node.js: v20.11.0
✓ OS: win32 x64
✓ Claude settings: C:\Users\name\.claude\settings.json
✓ settings.json: 存在します
✓ statusLine: 設定済み (type: command)
✓ DEEPSEEK_API_KEY: 設定あり (sk-xx...xxxx)
✓ API key (解決): DEEPSEEK_API_KEY を使用
✓ DeepSeek balance API: 接続OK
✓ Balance: USD 12.3456
✓ Git: git version 2.43.0
```

全項目に ✓ がつけば正常です。✗ や ⚠ がある場合は、その行を確認してください。

### `uninstall` — アンインストール

```bash
npx deepseek-claude-usage uninstall
```

アンインストール時の動作：
1. バックアップから元の `settings.json` を復元
2. `~/.claude/deepseek-claude-usage/` を削除
3. キャッシュファイルを削除

キャッシュを残したい場合：
```bash
npx deepseek-claude-usage uninstall --keep-cache
```

---

## 安全性について

### 🔐 API キーは一切保存しません

このツールが API キーをファイルに書き出すことは**絶対にありません**。キーは環境変数から読み取るだけで、メモリ上でのみ使われます。「うっかり API キーが Git にコミットされた」という事故も起きません。

### 📦 既存設定は必ずバックアップ

インストール時に、既存の `~/.claude/settings.json` は自動的にバックアップされます。

```
~/.claude/settings.backup.deepseek-claude-usage.2026-06-08T12-00-00-000Z.json
```

`uninstall` すると、このバックアップから元の設定に戻せます。

### 🙈 ログに API キーは出ません

エラーメッセージやデバッグ出力に API キーが含まれることはありません。`doctor` コマンドでは `sk-xx...xxxx` のようにマスク表示されます。

---

## トラブルシューティング

### ステータスラインに何も表示されない

1. `npx deepseek-claude-usage doctor` で環境をチェック
2. **Claude Code を再起動**（これが一番多い原因です）
3. `DEEPSEEK_API_KEY` が正しく設定されているか確認（`echo $DEEPSEEK_API_KEY`）
4. `~/.claude/settings.json` に `statusLine` 設定があるか確認

### `DS no key` と表示される

API キーが見つかっていません。以下を順に確認してください：
- `DEEPSEEK_API_KEY` 環境変数は設定されていますか？
- `ANTHROPIC_AUTH_TOKEN` 環境変数は設定されていますか？
- Claude Code を再起動しましたか？（環境変数はプロセス起動時に読み込まれます）

### `DS error` と表示される

DeepSeek API への接続に失敗しています。
- インターネットに接続されていますか？
- API キーは有効ですか？（[DeepSeek Platform](https://platform.deepseek.com/) で確認）
- ファイアウォールやプロキシが `api.deepseek.com` へのアクセスをブロックしていませんか？
- DeepSeek API サーバーが落ちている可能性もあります（まれにメンテナンスがあります）

---

## 動作の仕組み

```text
Claude Code
  └─ statusLine（30秒ごとに実行）
      └─ node ~/.claude/deepseek-claude-usage/statusline.js
          ├─ 標準入力から JSON を受信（モデル名、作業ディレクトリ）
          ├─ DeepSeek API（/user/balance）に残高を問い合わせ
          ├─ cache.json でセッション開始時の残高を管理
          ├─ git rev-parse で現在のブランチ名を取得
          └─ フォーマットして標準出力に表示
```

### キャッシュのしくみ

- **TTL（有効期限）**: 30秒
- TTL 内の再表示ではキャッシュを使い、API を叩きません
- セッション開始時の残高をキャッシュに保存
- `消費額 = セッション開始時残高 - 現在残高`

---

## 動作環境

| 項目 | 要件 |
|------|------|
| Node.js | v18.0.0 以上 |
| Claude Code | CLI 版（Desktop 版でも可） |
| API キー | DeepSeek API キー（または Anthropic API キー） |
| Git | 任意（ブランチ表示に使います） |
| OS | Windows / macOS / Linux すべて対応 |

---

## X でシェア

```text
Claude Code × DeepSeek 勢向けに作りました。

作業画面の下に
・DeepSeek 残高
・今回の消費額
・モデル名
・Git ブランチ
をリアルタイム表示できます。

インストールは1行👇

npx deepseek-claude-usage install

DeepSeek 課金、見えないの怖すぎたので作った。
```

---

## 開発者向け

### ローカルでのビルド

```bash
git clone https://github.com/hiromps/deepseek-claude-usage.git
cd deepseek-claude-usage
npm install
npm run build
npm run typecheck
```

### ローカルでの動作確認

```bash
# 環境診断
node bin/cli.js doctor

# 表示プレビュー
node bin/cli.js status

# JSON 出力
node bin/cli.js status --json
```

### リリース前チェックリスト

- [ ] `npm run build` が成功する
- [ ] `npm run typecheck` が成功する
- [ ] `npm pack --dry-run` で含まれるファイルが適切か確認
- [ ] Windows / macOS / Linux で動作確認
- [ ] API キー無しでも落ちないことを確認
- [ ] DeepSeek API エラー時も落ちないことを確認
- [ ] Git リポジトリ外でも落ちないことを確認
- [ ] `install` → `doctor` → `status` → `uninstall` の一連の流れを確認
- [ ] バックアップと復元が正しく動作することを確認

---

## ライセンス

MIT

---

## 作者

[hiromps](https://github.com/hiromps)

バグ報告・機能提案は [GitHub Issues](https://github.com/hiromps/deepseek-claude-usage/issues) までお願いします。
