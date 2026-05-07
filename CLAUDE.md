# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 変更を行う際の原則

コードを変更する前に必ず以下の手順を踏むこと。

1. **全体設計を把握する** — 変更対象のファイルだけでなく、関連するモデル・サービス・コントローラ・JS を横断して影響範囲を調べる
2. **変更方針を説明する** — なぜその変更が最善なのかを設計上の理由とともに日本語で説明する
3. **承認を得てから実装する** — ユーザーが OK を出すまでコードを書かない

## アプリ概要

**声友（Koetomo）** — シニア世代向け匿名グループ音声通話サービス。個人情報登録不要でトップページから即利用開始でき、部屋のトピックを見ながらそのまま WebRTC で音声通話に参加できる。

## コマンド

### 開発サーバー起動

```bash
# Dockerを使う場合（推奨）
docker compose up

# ローカルで起動する場合（3つを別ターミナルで起動）
bin/rails server
npm run watch        # JS watch (esbuild)
bin/rails tailwindcss:watch
```

### テスト

```bash
bundle exec rspec                          # 全テスト
bundle exec rspec spec/models/ng_word_spec.rb   # ファイル指定
bundle exec rspec spec/models/ng_word_spec.rb:42 # 行番号指定
```

### Lint

```bash
bundle exec rubocop          # チェック
bundle exec rubocop -a       # 自動修正
```

### JS ビルド

```bash
npm run build    # 単発ビルド
npm run watch    # ウォッチモード
```

### その他

```bash
bin/rails db:migrate
bin/rails db:seed
```

## アーキテクチャ

### 認証・セッション

認証ライブラリは使わず、`session[:user_info]` にユーザーIDを格納するだけのシンプルなセッション管理。`ApplicationController` の `require_login` でほぼ全アクションを保護。初回は `UserNicknamesController` → `UserIconsController` の 2 ステップで User レコードを作成してセッションに保存する。

### ユーザー登録フロー（2ステップ）

1. `GET /user_nicknames/new` → ニックネーム入力（セッションに一時保存）
2. `GET /user_icons/new` → アイコン選択（S3から取得）→ `POST /users` で User レコード作成

### バリデーション（コンテキスト分離）

`User#name` のニックネームバリデーションは `:nickname_step` コンテキスト限定で発火する。通常の `save` では発火しない点に注意。

```ruby
@user.valid?(:nickname_step)
@user.save(context: :nickname_step)
```

### WebRTC + Action Cable シグナリング

`RtcChannel` がシグナリングサーバーを兼ねる。JS 側から `perform("signal", { type: "..." })` を送り、`type` によって処理を分岐する。

| type | 処理 |
|---|---|
| `join` | 既存参加者一覧を `transmit`（ブロードキャストではなく送信元のみに返す） |
| `mute_changed` | DB 更新 + プレゼンスブロードキャスト |
| `ng_word_detected` | `Room` モデルでバリデーション → `BroadcastFlash` でアラート配信 |
| その他 | そのままブロードキャスト（offer/answer/ICE 候補） |

### NGワード検知の二段構え

1. **テキスト入力時**（ニックネーム・トピック）: `NgWordValidator` → `NgWord.ng?` で単純一致判定
2. **音声通話中**: JS の `word_detector.js` が Web Speech API で音声をテキスト化 → `RtcChannel#signal(type: "ng_word_detected")` → サーバー側で `NgWord.conversation_ng?` を呼び、**開示要求のコンテキスト**（「〜を教えてください」など）まで含めて判定してからフラッシュアラートを部屋全員にブロードキャスト

`NgWord.word_filter` がフィルタの正規化処理（Unicode正規化・カタカナ→ひらがな・記号削除など）を担い、`validate_each` と `conversation_ng?` の両方から使い回されている。

### プレゼンス管理

WebSocket 切断のみに依存しない ping 方式を採用。

- JS からは `POST /rooms/:room_id/presence/ping` を定期送信（`presence.js`）
- `RoomParticipants::DeactivateStale` が `last_seen_at` を見て古いレコードを非アクティブ化
- `RoomParticipant#is_active` 変更時に `after_commit` で `BroadcastPresenceChanges` が発火 → `ForRoomIndexChannel` 経由で部屋一覧の参加人数をリアルタイム更新

### サービスオブジェクト

`app/services/` 配下にネームスペースで分類して配置。すべて `self.call(...)` で呼ぶクラスメソッドパターン。

```
services/
  auto_topics/broadcast_topic.rb
  icons/get_url_from_s3.rb
  room_participants/{broadcast_presence_changes, deactivate_stale, leave, ping}.rb
  rooms/{auto_rotate_topic, broadcast_flash, broadcast_topic, broadcast_topic_editor_and_flash}.rb
```

### フロントエンド構成

- **Stimulus コントローラ** (`app/javascript/controllers/`) — トピック編集・ミュート・フラッシュ表示・PWA インストール案内など UI インタラクション
- **`app/javascript/rtcs/`** — WebRTC の責務ごとに分割された純粋な JS モジュール群。`context.js` が共有状態を持ち、各モジュールが `ctx` を受け取って操作する設計

### Turbo Stream の使い方

トピック変更・プレゼンス変化・フラッシュ通知はすべて Action Cable 経由の Turbo Stream でリアルタイム配信。`BroadcastXxx` サービスが `turbo_stream_from` のチャンネルに broadcast する。

## DB 主要テーブル

| テーブル | 補足 |
|---|---|
| `users` | `name`（ニックネーム）, `icon_url`（S3 URL）, `user_uuid` |
| `rooms` | `topic`, `previous_topic` |
| `room_participants` | `is_active`, `session_id`（同一ユーザーの複数タブを区別）, `muted`, `last_seen_at` |
| `ng_words` | `word_filter` で正規化した状態で保存 |
| `auto_topics` | 話題の自動ローテーション候補 |

`room_participants` には `(is_active = true)` の部分インデックスがあり、アクティブユーザーはユーザーごとに 1 部屋のみという制約を DB レベルで保証している。
