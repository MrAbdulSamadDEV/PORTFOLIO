/**
 * Shared type definitions for data fetched from /data/*.json.
 */

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
  status: string;
  completedDate: string;
}

export interface AiFaq {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
}

export interface AiKnowledgeBase {
  welcome: string;
  unknown: string;
  suggestions: string[];
  synonyms: Record<string, string[]>;
  intents: Record<string, string[]>;
  faqs: AiFaq[];
}

export interface SiteSettings {
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
    suggestionsHeading: string;
  };
}
