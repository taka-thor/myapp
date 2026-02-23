import { Controller } from "@hotwired/stimulus";

<script>
  document.addEventListener("turbo:load", () => {
    const options = document.querySelectorAll(".icon-option");
    const hiddenInput = document.getElementById("selected-icon-id");
    const submitBtn = document.getElementById("icon-submit");
    const form = document.getElementById("icon-form");

    options.forEach((option) => {
      option.addEventListener("click", () => {
        // 他の選択状態をリセット
        options.forEach((o) => o.classList.remove("ring-4", "ring-sky-400"));

        // クリックしたものだけ外枠をつける（水色・青強め）
        option.classList.add("ring-4", "ring-sky-400");

        // hidden に選択中の icon_url をセット
        hiddenInput.value = option.dataset.iconId;

        // 決定ボタンを表示 & 有効化
        submitBtn.classList.remove(
          "opacity-0",
          "translate-y-4",
          "pointer-events-none"
        );
        form.classList.remove("pointer-events-none");
      });
    });
  });
</script>
