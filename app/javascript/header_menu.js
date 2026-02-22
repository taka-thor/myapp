function closeMenusOutsideClick(event) {
  const menus = document.querySelectorAll("details[data-header-menu][open]");

  menus.forEach((menu) => {
    if (!menu.contains(event.target)) {
      menu.removeAttribute("open");
    }
  });
}

if (!window.__headerMenuBound) {
  document.addEventListener("click", closeMenusOutsideClick, true);
  window.__headerMenuBound = true;
}
