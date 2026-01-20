console.log("application.js loaded");

import "@hotwired/turbo-rails";
import "./controllers";
import "./presence";
import "./channels"; // ← 一覧で購読してDOM更新するため必須
import "./change_part_of_dom_in_room_index";
import "./topic_editor";