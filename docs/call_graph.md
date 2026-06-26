# コールグラフ

## 略語一覧

### Rails

| 略語 | 正式名称 |
|---|---|
| <a id="appctrl"></a>AppCtrl | ApplicationController |
| <a id="roomsctrl"></a>RoomsCtrl | RoomsController |
| <a id="presctrl"></a>PresCtrl | PresencesController |
| <a id="topicctrl"></a>TopicCtrl | TopicsController |
| <a id="usernickctrl"></a>UserNickCtrl | UserNicknamesController |
| <a id="usericonctrl"></a>UserIconCtrl | UserIconsController |
| <a id="userctrl"></a>UserCtrl | UsersController |
| <a id="ping"></a>Ping | RoomParticipants::Ping |
| <a id="leave"></a>Leave | RoomParticipants::Leave |
| <a id="bpc"></a>BPC | RoomParticipants::BroadcastPresenceChanges |
| <a id="ds"></a>DS | RoomParticipants::DeactivateStale |
| <a id="bflash"></a>BFlash | Rooms::BroadcastFlash |
| <a id="btopic"></a>BTopic | Rooms::BroadcastTopic |
| <a id="btef"></a>BTEF | Rooms::BroadcastTopicEditorAndFlash |
| <a id="autorot"></a>AutoRot | Rooms::AutoRotateTopic |
| <a id="autobt"></a>AutoBT | AutoTopics::BroadcastTopic |
| <a id="s3"></a>S3 | Icons::GetUrlFromS3 |
| <a id="user"></a>User | User モデル |
| <a id="room"></a>Room | Room モデル |
| <a id="rp"></a>RP | RoomParticipant モデル |
| <a id="ngword"></a>NgWord | NgWord モデル |
| <a id="ngval"></a>NgVal | NgWordValidator |
| <a id="autotopic"></a>AutoTopic | AutoTopic モデル |
| <a id="turbo"></a>Turbo | Turbo::StreamsChannel |
| <a id="cache"></a>Cache | Rails.cache |
| <a id="exts3"></a>ExtS3 | S3 / JSON URL |

### JavaScript

| 略語 | 正式名称 |
|---|---|
| <a id="app"></a>App | application.js |
| <a id="entry"></a>Entry | entry.js |
| <a id="ctx"></a>Ctx | context.js（共有状態: roomId / myUserId / peers / pendingIce） |
| <a id="lc"></a>LC | lifecycle.js |
| <a id="mc"></a>MC | mute_control.js |
| <a id="cable"></a>Cable | cable.js |
| <a id="wd"></a>WD | word_detector.js |
| <a id="sub"></a>Sub | ActionCable Subscription |
| <a id="al"></a>AL | audio_local.js |
| <a id="send"></a>Send | send.js |
| <a id="peer"></a>Peer | peer.js |
| <a id="proto"></a>Proto | protocol.js |

---

## 1. Rails バックエンド

### Controllers の呼び出し

| 呼び出し元 | 処理 | 呼び出し先 |
|---|---|---|
| [AppCtrl](#appctrl) | find_by id | [User](#user) |
| [RoomsCtrl](#roomsctrl) | index | [Leave](#leave) |
| [RoomsCtrl](#roomsctrl) | show: find_or_create_by / update! | [RP](#rp) |
| [PresCtrl](#presctrl) | ping | [Ping](#ping) |
| [PresCtrl](#presctrl) | leave | [Leave](#leave) |
| [TopicCtrl](#topicctrl) | update | [Room](#room) |
| [TopicCtrl](#topicctrl) | if topic changed | [BTopic](#btopic) |
| [TopicCtrl](#topicctrl) | always | [BTEF](#btef) |
| [UserNickCtrl](#usernickctrl) | new / valid?(:nickname_step) | [User](#user) |
| [UserIconCtrl](#usericonctrl) | new / create | [S3](#s3) |
| [UserIconCtrl](#usericonctrl) | create: save! | [User](#user) |
| [UserCtrl](#userctrl) | edit / update | [S3](#s3) |
| [UserCtrl](#userctrl) | update: save(context: :nickname_step) | [User](#user) |

### Services の呼び出し

| 呼び出し元 | 処理 | 呼び出し先 |
|---|---|---|
| [Ping](#ping) | find_or_initialize_by / save! | [RP](#rp) |
| [Ping](#ping) | if muted changed | [BPC](#bpc) |
| [Leave](#leave) | find_by / update! is_active=false | [RP](#rp) |
| [BPC](#bpc) | broadcast_replace_to x2 | [Turbo](#turbo) |
| [DS](#ds) | update! is_active=false | [RP](#rp) |
| [BFlash](#bflash) | broadcast_replace_to | [Turbo](#turbo) |
| [BTopic](#btopic) | find | [Room](#room) |
| [BTopic](#btopic) | broadcast_replace_to x2 | [Turbo](#turbo) |
| [BTEF](#btef) | broadcast_replace_to x2 | [Turbo](#turbo) |
| [AutoRot](#autorot) | pluck | [RP](#rp) |
| [AutoRot](#autorot) | where.not | [AutoTopic](#autotopic) |
| [AutoRot](#autorot) | update! topic | [Room](#room) |
| [AutoBT](#autobt) | find | [Room](#room) |
| [AutoBT](#autobt) | broadcast_replace_to | [Turbo](#turbo) |
| [S3](#s3) | Net::HTTP.get | [ExtS3](#exts3) |

### モデルのコールバック・バリデーション

| モデル | トリガー | 呼び出し先 |
|---|---|---|
| [Room](#room) | after_commit: topic changed | [AutoBT](#autobt) |
| [RP](#rp) | after_commit: is_active changed | [BPC](#bpc) |
| [Room](#room) | validates :topic | [NgVal](#ngval) |
| [Room](#room) | validates :speaking（contextual） | [NgVal](#ngval) |
| [NgVal](#ngval) | ng? | [NgWord](#ngword) |
| [NgVal](#ngval) | conversation_ng? | [NgWord](#ngword) |
| [NgWord](#ngword) | cached_words | [Cache](#cache) |

コントローラがリクエストを受け取りサービスオブジェクトを呼び出す構造。[RP](#rp) の `is_active` 変更が `after_commit` で [BPC](#bpc) を起動し [Turbo](#turbo) に配信する。NGワード検知は [NgVal](#ngval) → [NgWord](#ngword) に委譲し、検知時は [BFlash](#bflash) が部屋全体にアラートを配信する。

---

## 2. RtcChannel シグナリング

| signal type | 処理内容 | 呼び出し先 |
|---|---|---|
| `join` | [RP](#rp) からアクティブ参加者を `pluck` し送信元のみに `transmit` | [RP](#rp) |
| `mute_changed` | [RP](#rp) のミュート状態を更新し [BPC](#bpc) と ActionCable で通知 | [RP](#rp), [BPC](#bpc), [Turbo](#turbo) |
| `ng_word_detected` | `Room.new` でバリデーション → [NgVal](#ngval) → [NgWord](#ngword)、NG なら [BFlash](#bflash) で配信 | [NgVal](#ngval), [NgWord](#ngword), [BFlash](#bflash), [Turbo](#turbo) |
| `offer` / `answer` / `ice` | そのまま ActionCable でブロードキャスト（パススルー） | ActionCable |

`join` は送信元だけに既存参加者リストを返す。`ng_word_detected` は `Room.new` でバリデーションを走らせ、NGなら [BFlash](#bflash) で全員にアラートを配信する。`offer` / `answer` / `ice` はパススルー処理。

---

## 3. JavaScript (rtcs/) モジュール

### 起動時の初期化

| 呼び出し元 | 処理 | 呼び出し先 |
|---|---|---|
| [App](#app) | bootRtcOnTurboLoad | [Entry](#entry) |
| [Entry](#entry) | createRtcContext | [Ctx](#ctx) |
| [Entry](#entry) | bindLifecycle | [LC](#lc) |
| [Entry](#entry) | bindMuteControls | [MC](#mc) |
| [Entry](#entry) | connectCable | [Cable](#cable) |
| [Entry](#entry) | startWordDetector | [WD](#wd) |

### ActionCable 接続・WebRTC ネゴシエーション

| 呼び出し元 | タイミング / 処理 | 呼び出し先 |
|---|---|---|
| [Cable](#cable) | subscriptions.create RtcChannel | [Sub](#sub) |
| [Sub](#sub) | connected: prepareLocalAudio | [AL](#al) |
| [Sub](#sub) | connected: send join | [Send](#send) |
| [Sub](#sub) | received leave: closePeer | [Peer](#peer) |
| [Sub](#sub) | received other: handleReceived | [Proto](#proto) |
| [Proto](#proto) | present → makeOfferTo: createOffer / setLocalDescription | [Peer](#peer), [Send](#send) |
| [Proto](#proto) | offer → answerTo: setRemoteDescription / createAnswer | [Peer](#peer), [Send](#send) |
| [Proto](#proto) | answer: setRemoteDescription + flushPendingIce | [Peer](#peer) |
| [Proto](#proto) | ice: addIceCandidate | [Peer](#peer) |

### クリーンアップ（pagehide）

| 呼び出し元 | 処理 | 呼び出し先 |
|---|---|---|
| [LC](#lc) | send leave | [Send](#send) |
| [LC](#lc) | closePeer | [Peer](#peer) |
| [LC](#lc) | ctx.sub.unsubscribe | [Sub](#sub) |
| [LC](#lc) | unbindMuteControls | [MC](#mc) |
| [LC](#lc) | stopWordDetector | [WD](#wd) |
| [WD](#wd) | SpeechRecognition onresult → notifyRoomNgDetected | [Send](#send) |
| [Send](#send) | perform signal type: ng_word_detected | [Sub](#sub) |

[Entry](#entry) が起動時に [Ctx](#ctx)・[LC](#lc)・[MC](#mc)・[Cable](#cable)・[WD](#wd) を初期化する。ActionCable 接続後に `join` シグナルを送り、`present` を受け取ったら [Proto](#proto) が `makeOfferTo` で WebRTC ネゴシエーションを開始する。`pagehide` 時は [LC](#lc) の cleanup が全モジュールを順番に解放する。
