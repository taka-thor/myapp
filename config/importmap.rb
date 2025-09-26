pin "application"
pin "rtc-test", to: "rtc-test.js"
pin_all_from "app/javascript/channels", under: "channels"
# Action Cable 本体（CDN ESM）
pin "@rails/actioncable", to: "https://cdn.jsdelivr.net/npm/@rails/actioncable@7.2.0/app/assets/javascripts/actioncable.esm.js"
