console.log("[topic_editor] loaded");

function initTopicEditor() {
  const openBtn = document.getElementById("topic-edit-open");
  const area = document.getElementById("topic-edit-area");
  const cancelBtn = document.getElementById("topic-edit-cancel");

  console.log("[topic_editor] elements", { openBtn, area, cancelBtn });

  if (!openBtn || !area || !cancelBtn) return;

  // ✅ Turboで再訪/置換があるので二重バインド防止
  if (openBtn.dataset.topicEditorBound === "true") return;
  openBtn.dataset.topicEditorBound = "true";

  openBtn.addEventListener("click", () => {
    console.log("[topic_editor] open clicked");
    area.classList.remove("hidden");

    const input = area.querySelector('input[name="room[topic]"]');
    input?.focus();
    input?.select?.();
  });

  cancelBtn.addEventListener("click", () => {
    console.log("[topic_editor] cancel clicked");
    area.classList.add("hidden");
  });

  // ✅ submit confirm（複数フォームがあっても「confirm_topic_update の submit だけ」拾う）
  // capture: true にして、Turboがsubmitを拾う前に確実に止められるようにする
  document.addEventListener(
    "submit",
    (e) => {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;

      const submitter = e.submitter;
      if (submitter?.dataset?.confirmTopicUpdate !== "true") return;

      const input = form.querySelector('input[name="room[topic]"]');
      const nextTopic = input?.value?.trim() || "";

      if (!nextTopic) {
        e.preventDefault();
        alert("話題を入力してください");
        return;
      }

      const ok = window.confirm(`「${nextTopic}」に変更します。\nよろしいですか？`);
      if (!ok) e.preventDefault();
    },
    true
  );
}

// Turbo対応（重要）
document.addEventListener("turbo:load", initTopicEditor);
// Turbo無しの保険
document.addEventListener("DOMContentLoaded", initTopicEditor);
