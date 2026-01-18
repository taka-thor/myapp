console.log("[topic_editor] loaded");

function initTopicEditor() {
  const openBtn = document.getElementById("topic-edit-open");
  const area = document.getElementById("topic-edit-area");
  const cancelBtn = document.getElementById("topic-edit-cancel");

  console.log("[topic_editor] elements", { openBtn, area, cancelBtn });
  if (!openBtn || !area || !cancelBtn) return;

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

  document.addEventListener("submit", (e) => {
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
  });
}

// Turbo対応（これ超重要）
document.addEventListener("turbo:load", initTopicEditor);
// Turboなしでも動く保険
document.addEventListener("DOMContentLoaded", initTopicEditor);
