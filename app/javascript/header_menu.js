function closeMenusOutsideClick(event) {
  const menus = document.querySelectorAll("details[data-header-menu][open]");

  menus.forEach((menu) => {
    if (!menu.contains(event.target)) {
      const panel = menu.querySelector("[data-howto-panel]");
      panel?.classList.add("hidden");
      menu.removeAttribute("open");
    }
  });
}

function toggleHowToMenu(event) {
  const trigger = event.target.closest("[data-howto-toggle]");
  if (!trigger) return;

  event.preventDefault();

  const menu = trigger.closest("details[data-header-menu]");
  if (!menu) return;

  const panel = menu.querySelector("[data-howto-panel]");
  if (!panel) return;

  const willOpen = panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !willOpen);
}

if (!window.__headerMenuBound) {
  document.addEventListener("click", toggleHowToMenu, true);
  document.addEventListener("click", closeMenusOutsideClick, true);
  window.__headerMenuBound = true;
}
