import type { Request, Response } from "express";
import { projects, settings } from "../config/site.js";
import {
  buildBreadcrumbList,
  buildContactPoint,
  buildCreativeWork,
  buildItemList,
  buildOrganization,
  buildPerson,
  buildProfileImage,
  buildWebPage,
  buildWebSite,
  buildProfilePage,
} from "../utils/structured-data.js";
import { renderPage, type PageOptions } from "../utils/page.js";
import {
  renderAiWidget,
  renderBackToTop,
  renderContactPageContent,
  renderFooter,
  renderHomeContent,
  renderMobileDrawer,
  renderNav,
  renderNotFoundContent,
  renderProjectsPageContent,
  renderSocialRail,
} from "../utils/render.js";

const domain = settings.site.domain;

function sharedOptions(body: string, bodyClass: string, jsonLd: unknown[], activeSection: string): PageOptions {
  return {
    title: "",
    description: "",
    keywords: "",
    canonical: "",
    jsonLd,
    bodyClass,
    body,
    nav: renderNav(settings, activeSection),
    drawer: renderMobileDrawer(settings),
    socialRail: renderSocialRail(settings),
    footer: renderFooter(settings),
    backToTop: renderBackToTop(settings),
    aiWidget: renderAiWidget(settings),
  };
}

function sendPage(res: Response, options: PageOptions, status = 200): void {
  res.status(status).type("html").send(renderPage(settings, options));
}

export function homePage(_req: Request, res: Response): void {
  const meta = settings.pages.home;
  const url = "/";
  const canonical = `${domain}${url}`;

  const jsonLd = [
    buildPerson(settings),
    buildWebSite(settings),
    buildProfilePage(settings, canonical, meta.title, meta.description),
    buildBreadcrumbList(settings, [{ name: "Home", url: canonical }]),
    buildOrganization(settings),
    buildProfileImage(settings),
    buildItemList(settings, projects.filter((project) => project.featured)),
  ];

  sendPage(res, {
    ...sharedOptions(renderHomeContent(settings), "page-home", jsonLd, "home"),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    canonical,
    ogType: "profile",
    ogTitle: meta.title,
    ogDescription: meta.description,
  });
}

export function projectsPage(_req: Request, res: Response): void {
  const meta = settings.pages.projects;
  const url = "/projects";
  const canonical = `${domain}${url}`;

  const jsonLd = [
    buildWebPage(settings, canonical, meta.title, meta.description, "CollectionPage"),
    buildBreadcrumbList(settings, [
      { name: "Home", url: `${domain}/` },
      { name: "Projects", url: canonical },
    ]),
    buildItemList(settings, projects),
    buildOrganization(settings),
  ];

  sendPage(res, {
    ...sharedOptions(renderProjectsPageContent(settings), "page-projects", jsonLd, "projects-page"),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    canonical,
  });
}

export function contactPage(_req: Request, res: Response): void {
  const meta = settings.pages.contact;
  const url = "/contact";
  const canonical = `${domain}${url}`;

  const jsonLd = [
    buildWebPage(settings, canonical, meta.title, meta.description, "ContactPage"),
    buildBreadcrumbList(settings, [
      { name: "Home", url: `${domain}/` },
      { name: "Contact", url: canonical },
    ]),
    buildContactPoint(settings),
    buildPerson(settings),
    buildOrganization(settings),
  ];

  sendPage(res, {
    ...sharedOptions(renderContactPageContent(settings), "page-contact", jsonLd, "contact-page"),
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    canonical,
  });
}

export function notFoundPage(_req: Request, res: Response): void {
  const title = "404 — Page Not Found | Abdul Samad";
  const description = "The page you were looking for doesn't exist. Return to the portfolio of Abdul Samad — Cloud Data Engineering student and Full Stack Developer.";
  const canonical = `${domain}/404`;

  sendPage(
    res,
    {
      ...sharedOptions(renderNotFoundContent(settings), "page-404", [buildWebPage(settings, canonical, title, description)], ""),
      title,
      description,
      keywords: "404, page not found, Abdul Samad",
      canonical,
      robots: "noindex, nofollow",
    },
    404,
  );
}
