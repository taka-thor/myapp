# 声友 画面遷移図

```mermaid
flowchart TD
    TOP["🏠 トップ\n/"]
    SESSION{"既存ユーザー？\nセッション確認"}
    NICKNAME["📝 ニックネーム入力\n/user_nicknames/new"]
    ICON["🖼️ アイコン選択\n/user_icons/new"]
    HOME["🏡 ホーム\n/static_pages/home"]
    ROOMS["📋 部屋一覧\n/rooms"]
    ROOM_SHOW["🚪 部屋詳細\n/rooms/:id"]
    RTC["🎙️ 通話画面\n/rtcs/:id"]
    USER_EDIT["👤 ユーザー情報編集\n/user/edit"]
    HOW_TO["📖 使い方\n/how_to_talk"]
    CONTACT["✉️ お問い合わせ\n/contact"]
    TERMS["📄 利用規約\n/terms"]
    PRIVACY["🔒 プライバシーポリシー\n/privacy_policy"]

    TOP -->|"「始める」ボタン"| SESSION
    SESSION -->|"あり（既存ユーザー）"| HOME
    SESSION -->|"なし（新規ユーザー）"| NICKNAME
    NICKNAME -->|"バリデーションOK"| ICON
    NICKNAME -->|"バリデーションNG"| NICKNAME
    ICON -->|"保存成功"| HOME
    ICON -->|"保存失敗"| TOP

    HOME -->|"通話部屋を探す"| ROOMS
    HOME --> USER_EDIT
    HOME --> HOW_TO
    HOME --> CONTACT
    HOME --> TERMS
    HOME --> PRIVACY

    ROOMS -->|"部屋を選択"| ROOM_SHOW
    ROOM_SHOW -->|"通話に参加"| RTC
    RTC -->|"退出"| ROOMS
    ROOMS -->|"戻る"| HOME

    click TOP "https://github.com/taka-thor/myapp/blob/master/docs/images/top.png" _blank
    click HOME "https://github.com/taka-thor/myapp/blob/master/docs/images/home.png" _blank
    click NICKNAME "https://github.com/taka-thor/myapp/blob/master/docs/images/nickname.png" _blank
    click ICON "https://github.com/taka-thor/myapp/blob/master/docs/images/icon.png" _blank
```
