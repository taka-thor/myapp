console.log("application.js loaded");

import "@hotwired/turbo-rails";
import "./controllers";
import "./presence";
import "./channels"; // ← 一覧で購読してDOM更新するため必須
import "./room_index_for_bfcache_reload";
import "./topic_editor";