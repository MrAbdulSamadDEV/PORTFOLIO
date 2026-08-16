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
  renderFooter,
  renderHomeContent,
  renderMobileDrawer,
  renderNav,
  renderNotFoundContent,
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
    showLoader: false,
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
    buildContactPoint(settings),
    buildItemList(settings, projects),
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
    showLoader: true,
    preloadHero: true,
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
