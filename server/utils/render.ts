import { aiData, projects as allProjects, type Project, type SiteSettings } from "../config/site.js";
import { escapeAttr, escapeHtml } from "./html.js";

/**
 * Server-side renderers for every page section.
 * Everything here is pure HTML — no client-side JavaScript required
 * to see the complete content of the site.
 */

function icon(classes: string): string {
  return `<i class="${escapeAttr(classes)}" aria-hidden="true"></i>`;
}

function sectionHeading(eyebrow: string, heading: string, id: string, description?: string): string {
  return `
    <div class="section-heading reveal">
      <p class="section-heading__eyebrow">${escapeHtml(eyebrow)}</p>
      <h2 class="section-heading__title" id="${escapeAttr(id)}-heading">${escapeHtml(heading)}</h2>
      ${description ? `<p class="section-heading__description">${escapeHtml(description)}</p>` : ""}
    </div>`;
}

function externalLinkAttrs(): string {
  return 'target="_blank" rel="noopener noreferrer"';
}

export function renderNav(site: SiteSettings, activeSection: string): string {
  const items = site.nav
    .filter((item) => item.action !== "ai")
    .map((item) => {
      const isActive = item.section === activeSection;
      const scrollData = item.action === "scroll" ? ` data-nav-scroll="${escapeAttr(item.section)}"` : "";
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      return `
        <li class="site-nav__item">
          <a class="site-nav__link${isActive ? " is-active" : ""}" href="${escapeAttr(item.url)}"${scrollData} data-tooltip="${escapeAttr(item.label)}" title="${escapeAttr(item.label)}" aria-label="${escapeAttr(item.label)}"${ariaCurrent}>
            ${icon(item.icon)}
          </a>
        </li>`;
    })
    .join("");

  return `
    <aside class="site-nav" aria-label="Primary navigation">
      <a class="site-nav__brand" href="/" aria-label="${escapeAttr(site.site.name)} — home" title="${escapeAttr(site.site.name)}">
        <img src="${escapeAttr(site.site.logo)}" alt="${escapeAttr(site.site.logoAlt)}" width="44" height="44">
      </a>
      <nav class="site-nav__nav">
        <ul class="site-nav__list">${items}</ul>
      </nav>
      <button type="button" class="site-nav__link site-nav__link--button theme-toggle" data-theme-toggle data-tooltip="Toggle theme" title="Toggle theme" aria-label="Switch to dark theme">
        ${icon("fa-solid fa-moon")}
      </button>
    </aside>`;
}

export function renderMobileDrawer(site: SiteSettings): string {
  const items = site.nav
    .map((item) => {
      if (item.action === "ai") {
        return `
          <li class="mobile-drawer__item">
            <button type="button" class="mobile-drawer__link" data-nav-action="ai" data-tooltip="${escapeAttr(item.label)}">
              ${icon(item.icon)}<span>${escapeHtml(item.label)}</span>
            </button>
          </li>`;
      }
      const scrollData = item.action === "scroll" ? ` data-nav-scroll="${escapeAttr(item.section)}"` : "";
      return `
        <li class="mobile-drawer__item">
          <a class="mobile-drawer__link" href="${escapeAttr(item.url)}"${scrollData} data-tooltip="${escapeAttr(item.label)}">
            ${icon(item.icon)}<span>${escapeHtml(item.label)}</span>
          </a>
        </li>`;
    })
    .join("");

  return `
    <button type="button" class="nav-toggle" aria-label="Open navigation menu" aria-expanded="false" aria-controls="mobile-drawer">
      ${icon("fa-solid fa-bars")}
    </button>
    <div class="mobile-drawer-overlay" data-drawer-overlay hidden></div>
    <aside class="mobile-drawer" id="mobile-drawer" role="dialog" aria-modal="true" aria-label="Navigation menu" hidden>
      <div class="mobile-drawer__header">
        <span class="mobile-drawer__brand">
          <img src="${escapeAttr(site.site.logo)}" alt="${escapeAttr(site.site.logoAlt)}" width="40" height="40">
          <strong>${escapeHtml(site.site.name)}</strong>
        </span>
        <button type="button" class="mobile-drawer__close" data-drawer-close aria-label="Close navigation menu">
          ${icon("fa-solid fa-xmark")}
        </button>
      </div>
      <nav aria-label="Mobile navigation">
        <ul class="mobile-drawer__list">${items}</ul>
      </nav>
      <div class="mobile-drawer__footer">
        <p>${escapeHtml(site.site.tagline)}</p>
        <button type="button" class="mobile-drawer__theme" data-theme-toggle>
          ${icon("fa-solid fa-moon")}<span>Switch to dark theme</span>
        </button>
      </div>
    </aside>`;
}

export function renderSocialRail(site: SiteSettings): string {
  const links = site.socials
    .map(
      (social) => `
        <li class="social-rail__item">
          <a class="social-rail__link" href="${escapeAttr(social.url)}" aria-label="${escapeAttr(social.name)}" title="${escapeAttr(social.name)}" ${externalLinkAttrs()}>
            ${icon(social.icon)}
            <span class="social-rail__tooltip" role="tooltip">${escapeHtml(social.name)}</span>
          </a>
        </li>`,
    )
    .join("");

  return `
    <aside class="social-rail" aria-label="Social links">
      <ul class="social-rail__list">${links}</ul>
    </aside>`;
}

export function renderHero(site: SiteSettings): string {
  const badges = site.hero.floatingBadges
    .map((badge) => `<span class="hero__badge">${icon(badge.icon)}${escapeHtml(badge.label)}</span>`)
    .join("");

  return `
    <section class="hero" id="home" aria-labelledby="hero-heading">
      <div class="hero__content">
        <p class="hero__greeting">${escapeHtml(site.hero.greeting)}</p>
        <h1 class="hero__name" id="hero-heading">${escapeHtml(site.hero.name)}</h1>
        <p class="hero__roles" data-hero-typing data-hero-roles='${escapeAttr(JSON.stringify(site.hero.typingRoles))}' aria-label="${escapeAttr(site.hero.typingRoles.join(", "))}">
          <span data-hero-typing-text>${escapeHtml(site.hero.typingRoles[0] ?? site.hero.roles[0] ?? "")}</span><span class="hero__caret" aria-hidden="true"></span>
        </p>
        <p class="hero__description">${escapeHtml(site.hero.description)}</p>
        <div class="hero__actions">
          <a class="btn btn--primary" href="${escapeAttr(site.hero.primaryButton.url)}">
            <span>${escapeHtml(site.hero.primaryButton.label)}</span>${icon(site.hero.primaryButton.icon)}
          </a>
          <a class="btn btn--ghost" href="${escapeAttr(site.hero.secondaryButton.url)}">
            <span>${escapeHtml(site.hero.secondaryButton.label)}</span>${icon(site.hero.secondaryButton.icon)}
          </a>
        </div>
      </div>
      <div class="hero__visual">
        <div class="hero__photo-frame">
          <div class="hero__photo" aria-hidden="true"></div>
          <img class="hero__photo-img"
            srcset="${escapeAttr(site.hero.image)}" type="image/webp"
            src="${escapeAttr(site.hero.imagePng)}"
            alt="${escapeAttr(site.hero.imageAlt)}"
            width="${site.hero.imageWidth}" height="${site.hero.imageHeight}"
            fetchpriority="high" decoding="async">
          <span class="hero__ring" aria-hidden="true"></span>
          ${badges}
        </div>
      </div>
    </section>`;
}

export function renderAbout(site: SiteSettings): string {
  const textCards = [
    { title: "Who I Am", icon: "fa-solid fa-user", text: site.about.whoIAm },
    { title: "My Journey", icon: "fa-solid fa-route", text: site.about.myJourney },
    { title: "My Goals", icon: "fa-solid fa-bullseye", text: site.about.myGoals },
  ]
    .map(
      (card) => `
        <article class="about-card reveal">
          <div class="about-card__icon">${icon(card.icon)}</div>
          <h3 class="about-card__title">${escapeHtml(card.title)}</h3>
          <p class="about-card__text">${escapeHtml(card.text)}</p>
        </article>`,
    )
    .join("");

  const stats = site.about.statistics
    .map(
      (stat) => `
        <div class="about-stat reveal">
          <div class="about-stat__icon">${icon(stat.icon)}</div>
          <strong class="about-stat__value">${escapeHtml(stat.value)}</strong>
          <span class="about-stat__label">${escapeHtml(stat.label)}</span>
        </div>`,
    )
    .join("");

  const timeline = site.about.journey
    .map(
      (entry) => `
        <li class="timeline-item reveal">
          <div class="timeline-item__icon">${icon(entry.icon)}</div>
          <div class="timeline-item__body">
            <span class="timeline-item__period">${escapeHtml(entry.period)}</span>
            <h4 class="timeline-item__title">${escapeHtml(entry.title)}</h4>
            <p class="timeline-item__description">${escapeHtml(entry.description)}</p>
          </div>
        </li>`,
    )
    .join("");

  return `
    <section class="section" id="about" aria-labelledby="about-heading">
      <div class="section__inner">
        ${sectionHeading(site.about.eyebrow, site.about.heading, "about")}
        <div class="about-grid">
          ${textCards}
        </div>
        <div class="about-stats">${stats}</div>
        <div class="about-timeline">
          <h3 class="about-timeline__heading">My Journey Timeline</h3>
          <ol class="timeline">${timeline}</ol>
        </div>
      </div>
    </section>`;
}

export function renderSkills(site: SiteSettings): string {
  const groups = site.skills.groups
    .map(
      (group) => `
        <article class="skills-card reveal">
          <header class="skills-card__header">
            <div class="skills-card__icon">${icon(group.icon)}</div>
            <h3 class="skills-card__title">${escapeHtml(group.title)}</h3>
          </header>
          <ul class="skills-card__list">
            ${group.skills
              .map(
                (skill) => `
                  <li class="skill">
                    <span class="skill__icon">${icon(skill.icon)}</span>
                    <div class="skill__info">
                      <div class="skill__top">
                        <span class="skill__name">${escapeHtml(skill.name)}</span>
                        <span class="skill__level">${skill.level}%</span>
                      </div>
                      <div class="skill__track" role="progressbar" aria-valuenow="${skill.level}" aria-valuemin="0" aria-valuemax="100" aria-label="${escapeAttr(skill.name)} proficiency">
                        <span class="skill__fill" style="--progress: ${skill.level}%"></span>
                      </div>
                    </div>
                  </li>`,
              )
              .join("")}
          </ul>
        </article>`,
    )
    .join("");

  return `
    <section class="section" id="skills" aria-labelledby="skills-heading">
      <div class="section__inner">
        ${sectionHeading(site.skills.eyebrow, site.skills.heading, "skills", site.skills.description)}
        <div class="skills-grid">${groups}</div>
      </div>
    </section>`;
}

function renderProjectCard(project: Project): string {
  const techBadges = project.technologies.map((tech) => `<li class="project-card__tech">${escapeHtml(tech)}</li>`).join("");
  const featuredBadge = project.featured ? `<span class="project-card__featured">${icon("fa-solid fa-star")}Featured</span>` : "";

  return `
    <article class="project-card reveal" data-category="${escapeAttr(project.category)}" data-featured="${project.featured ? "true" : "false"}">
      <div class="project-card__media">
        <img src="${escapeAttr(project.imagePng)}"
          srcset="${escapeAttr(project.image)}" type="image/webp"
          alt="${escapeAttr(project.imageAlt)}"
          width="800" height="500" loading="lazy" decoding="async">
        <div class="project-card__flags">
          ${featuredBadge}
          <span class="project-card__status">${escapeHtml(project.status)}</span>
        </div>
      </div>
      <div class="project-card__body">
        <div class="project-card__meta">
          <span class="project-card__category">${icon("fa-solid fa-tag")}${escapeHtml(project.category)}</span>
          <time class="project-card__date" datetime="${escapeAttr(project.completedDate)}">${escapeHtml(project.completedDate)}</time>
        </div>
        <h3 class="project-card__title">${escapeHtml(project.title)}</h3>
        <p class="project-card__description">${escapeHtml(project.description)}</p>
        <ul class="project-card__techs" aria-label="Technologies used">${techBadges}</ul>
        <div class="project-card__actions">
          <a class="btn btn--small btn--dark" href="${escapeAttr(project.github)}" ${externalLinkAttrs()}>
            ${icon("fa-brands fa-github")}<span>GitHub</span>
          </a>
          <a class="btn btn--small btn--primary" href="${escapeAttr(project.liveDemo)}" ${externalLinkAttrs()}>
            <span>Live Demo</span>${icon("fa-solid fa-arrow-up-right-from-square")}
          </a>
        </div>
      </div>
    </article>`;
}

export function renderProjectsGrid(projects: Project[]): string {
  if (projects.length === 0) {
    return '<p class="projects-empty">No projects found in this category yet.</p>';
  }
  return `<div class="projects-grid">${projects.map(renderProjectCard).join("")}</div>`;
}

export function renderFeaturedProjects(site: SiteSettings): string {
  const featured = allProjects.filter((project) => project.featured);
  return `
    <section class="section" id="featured-projects" aria-labelledby="featured-projects-heading">
      <div class="section__inner">
        ${sectionHeading(
          "Featured Work",
          "Projects I'm proud of",
          "featured-projects",
          "A selection of my favourite builds. Explore the full collection for more.",
        )}
        ${renderProjectsGrid(featured)}
        <div class="section-actions reveal">
          <a class="btn btn--primary" href="/projects">
            <span>View All Projects</span>${icon("fa-solid fa-folder-open")}
          </a>
        </div>
      </div>
    </section>`;
}

function renderContactForm(site: SiteSettings): string {
  const form = site.contact.form;
  return `
    <form class="contact-form" data-contact-form data-success-text="${escapeAttr(form.successText)}" data-error-text="${escapeAttr(form.errorText)}" data-mailto="mailto:${escapeAttr(site.site.email)}" novalidate>
      <div class="contact-form__row">
        <div class="contact-form__field">
          <label for="contact-name">${escapeHtml(form.nameLabel)} <span aria-hidden="true">*</span></label>
          <input id="contact-name" name="name" type="text" autocomplete="name" required maxlength="80" placeholder="e.g. John Smith">
          <p class="contact-form__error" data-error-for="name" role="alert"></p>
        </div>
        <div class="contact-form__field">
          <label for="contact-email">${escapeHtml(form.emailLabel)} <span aria-hidden="true">*</span></label>
          <input id="contact-email" name="email" type="email" autocomplete="email" required maxlength="120" placeholder="e.g. john@example.com">
          <p class="contact-form__error" data-error-for="email" role="alert"></p>
        </div>
      </div>
      <div class="contact-form__field">
        <label for="contact-message">${escapeHtml(form.messageLabel)} <span aria-hidden="true">*</span></label>
        <textarea id="contact-message" name="message" rows="6" required maxlength="2000" placeholder="Tell me about your project or question..."></textarea>
        <p class="contact-form__error" data-error-for="message" role="alert"></p>
      </div>
      <button type="submit" class="btn btn--primary contact-form__submit">
        <span>${escapeHtml(form.submitLabel)}</span>${icon(form.submitIcon)}
      </button>
      <div class="contact-form__status" data-form-status role="status" hidden></div>
    </form>`;
}

export function renderContactSection(site: SiteSettings): string {
  const cards = site.contact.cards
    .map(
      (card) => `
        <a class="contact-card reveal" href="${escapeAttr(card.href)}" ${card.href.startsWith("http") ? externalLinkAttrs() : ""}>
          <div class="contact-card__icon">${icon(card.icon)}</div>
          <div class="contact-card__body">
            <span class="contact-card__label">${escapeHtml(card.label)}</span>
            <strong class="contact-card__value">${escapeHtml(card.value)}</strong>
          </div>
          ${icon("fa-solid fa-arrow-right")}
        </a>`,
    )
    .join("");

  return `
    <section class="section" id="contact" aria-labelledby="contact-heading">
      <div class="section__inner">
        ${sectionHeading(site.contact.eyebrow, site.contact.heading, "contact", site.contact.description)}
        <div class="contact-grid">
          <div class="contact-cards">${cards}</div>
          <div class="contact-form-wrap reveal">
            ${renderContactForm(site)}
          </div>
        </div>
      </div>
    </section>`;
}

export function renderFooter(site: SiteSettings): string {
  const quickLinks = site.nav
    .filter((item) => item.action !== "ai")
    .map(
      (item) => `
        <li>
          <a href="${escapeAttr(item.url)}"${item.action === "scroll" ? ` data-nav-scroll="${escapeAttr(item.section)}"` : ""}>${escapeHtml(item.label)}</a>
        </li>`,
    )
    .join("");

  const year = new Date().getFullYear();

  return `
    <footer class="site-footer">
      <div class="site-footer__grid">
        <div class="site-footer__brand">
          <a class="site-footer__logo" href="/" aria-label="${escapeAttr(site.site.name)} — home">
            <img src="${escapeAttr(site.site.logo)}" alt="${escapeAttr(site.site.logoAlt)}" width="44" height="44">
            <strong>${escapeHtml(site.site.name)}</strong>
          </a>
          <p class="site-footer__bio">${escapeHtml(site.footer.description)}</p>
        </div>
        <nav class="site-footer__col" aria-label="Quick links">
          <h2 class="site-footer__heading">${escapeHtml(site.footer.quickLinksHeading)}</h2>
          <ul class="site-footer__links">${quickLinks}</ul>
        </nav>
        <div class="site-footer__col" aria-label="Contact information">
          <h2 class="site-footer__heading">${escapeHtml(site.footer.contactHeading)}</h2>
          <ul class="site-footer__contact">
            <li><a href="mailto:${escapeAttr(site.site.email)}">${icon("fa-solid fa-envelope")}${escapeHtml(site.site.email)}</a></li>
            <li><a href="${escapeAttr(site.site.phoneHref)}">${icon("fa-solid fa-phone")}${escapeHtml(site.site.phoneDisplay)}</a></li>
            <li>${icon("fa-solid fa-location-dot")}${escapeHtml(site.site.location)}</li>
          </ul>
        </div>
      </div>
      <div class="site-footer__bottom">
        <p>© ${year} ${escapeHtml(site.site.name)}. ${escapeHtml(site.footer.rights)}</p>
        <p class="site-footer__credit">${icon("fa-solid fa-code")} ${escapeHtml(site.footer.credit)}</p>
      </div>
    </footer>`;
}

export function renderBackToTop(site: SiteSettings): string {
  return `
    <button type="button" class="back-to-top" aria-label="${escapeAttr(site.footer.backToTopLabel)}" hidden>
      ${icon("fa-solid fa-arrow-up")}
    </button>`;
}

export function renderAiWidget(site: SiteSettings): string {
  return `
    <div class="ai-widget" data-ai-widget data-welcome-text="${escapeAttr(aiData.welcome)}">
      <button type="button" class="ai-widget__toggle" aria-expanded="false" aria-controls="ai-chat" data-ai-toggle>
        <span class="ai-widget__icon">${icon("fa-solid fa-robot")}</span>
        <span class="ai-widget__label">${escapeHtml(site.ai.buttonLabel)}</span>
        <span class="ai-widget__tooltip" role="tooltip">${escapeHtml(site.ai.tooltip)}</span>
      </button>
      <section class="ai-chat" id="ai-chat" aria-label="${escapeAttr(site.ai.title)}" data-ai-chat hidden>
        <header class="ai-chat__header">
          <div class="ai-chat__avatar" aria-hidden="true">${icon("fa-solid fa-robot")}</div>
          <div class="ai-chat__heading">
            <h2>${escapeHtml(site.ai.title)}</h2>
            <p>${escapeHtml(site.ai.subtitle)}</p>
          </div>
          <div class="ai-chat__actions">
            <button type="button" class="ai-chat__action" data-ai-search-toggle aria-label="${escapeAttr(site.ai.searchLabel)}" aria-pressed="false">
              ${icon("fa-solid fa-magnifying-glass")}
            </button>
            <button type="button" class="ai-chat__action" data-ai-clear aria-label="${escapeAttr(site.ai.clearLabel)}">
              ${icon("fa-solid fa-eraser")}
            </button>
            <button type="button" class="ai-chat__action" data-ai-close aria-label="${escapeAttr(site.ai.closeLabel)}">
              ${icon("fa-solid fa-xmark")}
            </button>
          </div>
        </header>
        <div class="ai-chat__search" data-ai-search hidden>
          <input type="search" placeholder="Search conversation..." aria-label="Search conversation" autocomplete="off">
        </div>
        <div class="ai-chat__messages" data-ai-messages role="log" aria-live="polite" aria-relevant="additions text" aria-label="Chat messages"></div>
        <form class="ai-chat__composer" data-ai-form>
          <textarea class="ai-chat__input" rows="1" placeholder="${escapeAttr(site.ai.placeholder)}" aria-label="${escapeAttr(site.ai.placeholder)}" maxlength="500"></textarea>
          <button type="submit" class="ai-chat__send" aria-label="Send message">${icon("fa-solid fa-paper-plane")}</button>
        </form>
      </section>
    </div>`;
}

export function renderBreadcrumbs(site: SiteSettings, items: Array<{ name: string; url: string }>): string {
  const crumbs = items
    .map((item, index) => {
      const isLast = index === items.length - 1;
      return isLast
        ? `<li aria-current="page">${escapeHtml(item.name)}</li>`
        : `<li><a href="${escapeAttr(item.url)}">${escapeHtml(item.name)}</a></li>`;
    })
    .join("");
  return `<nav class="breadcrumbs" aria-label="Breadcrumb"><ol>${crumbs}</ol></nav>`;
}

export function renderHomeContent(site: SiteSettings): string {
  return [
    renderHero(site),
    renderAbout(site),
    renderSkills(site),
    renderFeaturedProjects(site),
    renderContactSection(site),
  ].join("");
}

export function renderProjectsPageContent(site: SiteSettings): string {
  return `
    <header class="page-hero">
      ${renderBreadcrumbs(site, [
        { name: "Home", url: "/" },
        { name: "Projects", url: "/projects" },
      ])}
      <p class="page-hero__eyebrow">My Work</p>
      <h1 class="page-hero__title">Projects</h1>
      <p class="page-hero__description">${escapeHtml(site.pages.projects.description)}</p>
    </header>
    <section class="section" aria-labelledby="all-projects-heading">
      <div class="section__inner">
        ${sectionHeading("Portfolio", "All Projects", "all-projects", "")}
        <div data-projects-grid>${renderProjectsGrid(allProjects)}</div>
        <div class="projects-cta reveal">
          <h2 id="projects-cta-heading">Like what you see?</h2>
          <p>Have an idea you'd like to bring to life? Let's talk about it.</p>
          <a class="btn btn--primary" href="/contact">
            <span>Contact Me</span>${icon("fa-solid fa-envelope")}
          </a>
        </div>
      </div>
    </section>`;
}

export function renderContactPageContent(site: SiteSettings): string {
  return `
    <header class="page-hero">
      ${renderBreadcrumbs(site, [
        { name: "Home", url: "/" },
        { name: "Contact", url: "/contact" },
      ])}
      <p class="page-hero__eyebrow">${escapeHtml(site.contact.eyebrow)}</p>
      <h1 class="page-hero__title">${escapeHtml(site.contact.heading)}</h1>
      <p class="page-hero__description">${escapeHtml(site.contact.description)}</p>
    </header>
    <section class="section" aria-labelledby="contact-options-heading">
      <div class="section__inner">
        <div class="contact-grid">
          <div class="contact-cards">
            ${site.contact.cards
              .map(
                (card) => `
                  <a class="contact-card reveal" href="${escapeAttr(card.href)}" ${card.href.startsWith("http") ? externalLinkAttrs() : ""}>
                    <div class="contact-card__icon">${icon(card.icon)}</div>
                    <div class="contact-card__body">
                      <span class="contact-card__label">${escapeHtml(card.label)}</span>
                      <strong class="contact-card__value">${escapeHtml(card.value)}</strong>
                    </div>
                    ${icon("fa-solid fa-arrow-right")}
                  </a>`,
              )
              .join("")}
          </div>
          <div class="contact-form-wrap reveal">
            ${renderContactForm(site)}
          </div>
        </div>
      </div>
    </section>`;
}

export function renderNotFoundContent(site: SiteSettings): string {
  return `
    <section class="not-found" aria-labelledby="not-found-heading">
      <div class="not-found__illustration" aria-hidden="true">
        <span class="not-found__code">4</span>
        <span class="not-found__zero">${icon("fa-solid fa-ghost")}</span>
        <span class="not-found__code">4</span>
      </div>
      <h1 class="not-found__title" id="not-found-heading">Page not found</h1>
      <p class="not-found__text">The page you're looking for doesn't exist or has been moved. Let's get you back on track.</p>
      <div class="not-found__actions">
        <a class="btn btn--primary" href="/">
          ${icon("fa-solid fa-house")}<span>Back to Home</span>
        </a>
        <a class="btn btn--ghost" href="/projects">
          ${icon("fa-solid fa-folder-open")}<span>Search Projects</span>
        </a>
      </div>
      <p class="not-found__hint">Looking for something specific? Try ${icon("fa-solid fa-robot")} <strong>MAX AI</strong> — the assistant in the corner can point you in the right direction.</p>
    </section>`;
}
