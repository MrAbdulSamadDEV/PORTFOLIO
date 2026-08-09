import { readFileSync } from "node:fs";
import path from "node:path";
import { PATHS } from "./env.js";

/**
 * Content model for client/data/settings.json.
 * Every user-facing value on the website is editable from this file.
 */
export interface NavItem {
  label: string;
  url: string;
  section: string;
  icon: string;
  action: "page" | "scroll" | "ai";
}

export interface SocialLink {
  name: string;
  url: string;
  icon: string;
}

export interface PageMeta {
  title: string;
  description: string;
  keywords: string;
}

export interface SiteSettings {
  site: {
    name: string;
    shortName: string;
    domain: string;
    tagline: string;
    author: string;
    email: string;
    phoneDisplay: string;
    phoneHref: string;
    location: string;
    language: string;
    themeColor: string;
    logo: string;
    logoAlt: string;
    profileImage: string;
    profileImagePng: string;
    profileImageAlt: string;
    profileImageWidth: number;
    profileImageHeight: number;
    ogImage: string;
    ogImagePng: string;
    ogImageAlt: string;
    yearStarted: number;
    keywords: string;
  };
  pages: {
    home: PageMeta;
    projects: PageMeta;
    contact: PageMeta;
  };
  nav: NavItem[];
  socials: SocialLink[];
  hero: {
    greeting: string;
    name: string;
    roles: string[];
    typingRoles: string[];
    image: string;
    imagePng: string;
    imageAlt: string;
    imageWidth: number;
    imageHeight: number;
    description: string;
    primaryButton: { label: string; url: string; icon: string };
    secondaryButton: { label: string; url: string; icon: string };
    floatingBadges: Array<{ label: string; icon: string }>;
    video: {
      webm: string;
      mp4: string;
      poster: string;
      posterPng: string;
      posterAlt: string;
      width: number;
      height: number;
    };
  };
  about: {
    eyebrow: string;
    heading: string;
    whoIAm: string;
    myJourney: string;
    myGoals: string;
    statistics: Array<{ value: string; label: string; icon: string }>;
    journey: Array<{
      title: string;
      period: string;
      icon: string;
      description: string;
    }>;
  };
  skills: {
    eyebrow: string;
    heading: string;
    description: string;
    groups: Array<{
      title: string;
      icon: string;
      skills: Array<{ name: string; level: number; icon: string }>;
    }>;
  };
  contact: {
    eyebrow: string;
    heading: string;
    description: string;
    cards: Array<{ label: string; value: string; href: string; icon: string }>;
    form: {
      nameLabel: string;
      emailLabel: string;
      messageLabel: string;
      submitLabel: string;
      submitIcon: string;
      successTitle: string;
      successText: string;
      errorText: string;
    };
  };
  footer: {
    description: string;
    quickLinksHeading: string;
    contactHeading: string;
    rights: string;
    credit: string;
    backToTopLabel: string;
  };
  ai: {
    title: string;
    subtitle: string;
    buttonLabel: string;
    tooltip: string;
    placeholder: string;
    openLabel: string;
    closeLabel: string;
    clearLabel: string;
    searchLabel: string;
    copyLabel: string;
  };
}

export interface Project {
  id: string;
  title: string;
  slug: string;
  description: string;
  image: string;
  imagePng: string;
  imageAlt: string;
  category: string;
  technologies: string[];
  github: string;
  liveDemo: string;
  featured: boolean;
  status: "Live" | "In Progress" | "Archived";
  completedDate: string;
}

export interface FaqEntry {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface AiKnowledgeBase {
  welcome: string;
  unknown: string;
  synonyms: Record<string, string[]>;
  intents: Record<string, string[]>;
  faqs: FaqEntry[];
}

function loadJson<T>(relativePath: string, label: string): T {
  try {
    const raw = readFileSync(path.join(PATHS.data, relativePath), "utf8");
    return JSON.parse(raw) as T;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to load ${label} (client/data/${relativePath}): ${message}`);
  }
}

export const settings: SiteSettings = loadJson<SiteSettings>("settings.json", "settings");
export const projects: Project[] = loadJson<Project[]>("projects.json", "projects");
export const aiData: AiKnowledgeBase = loadJson<AiKnowledgeBase>("ai.json", "ai knowledge base");
