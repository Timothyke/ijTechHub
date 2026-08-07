// Shared mobile nav toggle. Include after the header markup on every page
// that has a .menu-btn + .mobile-nav pair (see header in index.html).
(function () {
  const btn = document.querySelector(".menu-btn");
  const nav = document.querySelector(".mobile-nav");
  if (!btn || !nav) return;

  btn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  // Close the menu when a link inside it is tapped.
  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    });
  });
})();
