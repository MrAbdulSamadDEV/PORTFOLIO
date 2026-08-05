import { qsa } from "../utils/dom.js";

/**
 * Highlights the matching navigation item while the user scrolls,
 * using IntersectionObserver on the scrollable section targets.
 * At the top of the page the "Home" item is highlighted.
 */
export function initScrollSpy(): void {
  const navLinks = qsa<HTMLAnchorElement>("[data-nav-scroll]");
  if (navLinks.length === 0) return;

  const homeLink = qsa<HTMLAnchorElement>(".site-nav__link").find((link) => link.getAttribute("href") === "/");

  const sectionIds = Array.from(new Set(navLinks.map((link) => link.dataset.navScroll ?? ""))).filter(Boolean);
  const sections = sectionIds
    .map((id) => document.getElementById(id))
    .filter((element): element is HTMLElement => element !== null);

  const setActive = (sectionId: string | null): void => {
    for (const link of navLinks) {
      const isActive = link.dataset.navScroll === sectionId;
      link.classList.toggle("is-active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    }
    if (homeLink) {
      const atTop = sectionId === null || sectionId === "home";
      homeLink.classList.toggle("is-active", atTop);
      if (atTop) {
        homeLink.setAttribute("aria-current", "page");
      } else {
        homeLink.removeAttribute("aria-current");
      }
    }
  };

  if (sections.length === 0 || !("IntersectionObserver" in window)) return;

  const pickActive = (): string | null => {
    const band = window.innerHeight * 0.42;
    let active: string | null = null;
    for (const section of sections) {
      const rect = section.getBoundingClientRect();
      if (rect.top <= band) active = section.id;
    }
    return active;
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio);
      if (visible.length > 0) {
        setActive(visible[0]?.target.id ?? null);
      }
    },
    { rootMargin: "-40% 0px -55% 0px", threshold: [0.05, 0.3, 0.6] },
  );

  sections.forEach((section) => observer.observe(section));

  const onScroll = (): void => {
    if (window.scrollY < 300) {
      setActive("home");
      return;
    }
    const active = pickActive();
    if (active) setActive(active);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}
