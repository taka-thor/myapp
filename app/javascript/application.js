console.log("application.js loaded");

import "@hotwired/turbo-rails";
import "./controllers";
import "./presence";
import "./channels";
import "./reload_room_index_for_bfcache";
import "./topic_editor";
import "./header_menu";
import { bootRtcOnTurboLoad } from "./rtc/entry";
bootRtcOnTurboLoad();
