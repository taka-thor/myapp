console.log("application.js loaded");

import "@hotwired/turbo-rails";
import "./controllers";
import "./presence";
import "./channels"; // ← 一覧で購読してDOM更新するため必須
import "./bfcache_reload";
