import type { Project, SiteSettings } from "../config/site.js";

/**
 * Builders for schema.org JSON-LD structured data.
 * The returned objects are serialized by the page template.
 */

type JsonObject = Record<string, unknown>;

export function buildPerson(site: SiteSettings): JsonObject {
  return {
    "@type": "Person",
    "@id": `${site.site.domain}/#person`,
    name: site.site.name,
    url: site.site.domain,
    image: `${site.site.domain}${site.site.profileImage}`,
    description: site.site.tagline,
    jobTitle: site.hero.roles,
    email: `mailto:${site.site.email}`,
    telephone: site.site.phoneHref.replace("tel:", ""),
    address: {
      "@type": "PostalAddress",
      addressLocality: site.site.location,
      addressCountry: "PK",
    },
    knowsAbout: ["TypeScript", "Node.js", "Express", "HTML5", "CSS3", "JavaScript", "Cloud Data Engineering", "Linux", "Git", "GitHub"],
    sameAs: site.socials.map((social) => social.url),
  };
}

export function buildWebSite(site: SiteSettings): JsonObject {
  return {
    "@type": "WebSite",
    "@id": `${site.site.domain}/#website`,
    name: `${site.site.name} — Portfolio`,
    url: site.site.domain,
    description: site.site.tagline,
    inLanguage: site.site.language,
    publisher: { "@id": `${site.site.domain}/#person` },
  };
}

export function buildOrganization(site: SiteSettings): JsonObject {
  return {
    "@type": "Organization",
    "@id": `${site.site.domain}/#organization`,
    name: site.site.name,
    url: site.site.domain,
    logo: {
      "@type": "ImageObject",
      url: `${site.site.domain}${site.site.logo}`,
    },
    sameAs: site.socials.map((social) => social.url),
    contactPoint: {
      "@type": "ContactPoint",
      email: site.site.email,
      telephone: site.site.phoneHref.replace("tel:", ""),
      contactType: "customer service",
      availableLanguage: ["en"],
    },
  };
}

export function buildContactPoint(site: SiteSettings): JsonObject {
  return {
    "@type": "ContactPoint",
    contactType: "personal",
    email: site.site.email,
    telephone: site.site.phoneHref.replace("tel:", ""),
    availableLanguage: ["en"],
    areaServed: "Worldwide",
  };
}

export function buildProfileImage(site: SiteSettings): JsonObject {
  return {
    "@type": "ImageObject",
    "@id": `${site.site.domain}/#profile-image`,
    url: `${site.site.domain}${site.site.profileImage}`,
    width: site.site.profileImageWidth,
    height: site.site.profileImageHeight,
    caption: site.site.profileImageAlt,
  };
}

export function buildWebPage(site: SiteSettings, url: string, title: string, description: string, type = "WebPage"): JsonObject {
  return {
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name: title,
    description,
    inLanguage: site.site.language,
    isPartOf: { "@id": `${site.site.domain}/#website` },
    about: { "@id": `${site.site.domain}/#person` },
    primaryImageOfPage: { "@id": `${site.site.domain}/#profile-image` },
  };
}

export function buildProfilePage(site: SiteSettings, url: string, title: string, description: string): JsonObject {
  return {
    ...buildWebPage(site, url, title, description, "ProfilePage"),
    mainEntity: { "@id": `${site.site.domain}/#person` },
    dateModified: new Date().toISOString().split("T")[0],
  };
}

export function buildBreadcrumbList(site: SiteSettings, items: Array<{ name: string; url: string }>): JsonObject {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function buildCreativeWork(site: SiteSettings, project: Project): JsonObject {
  return {
    "@type": "CreativeWork",
    "@id": `${site.site.domain}/#${project.id}`,
    name: project.title,
    description: project.description,
    url: project.liveDemo || project.github,
    image: `${site.site.domain}${project.image}`,
    dateCreated: project.completedDate,
    keywords: project.technologies.join(", "),
    programmingLanguage: project.technologies.filter((tech) => ["TypeScript", "JavaScript", "Python", "C++", "C#", "HTML5", "CSS3"].includes(tech)),
    genre: project.category,
    isPartOf: { "@id": `${site.site.domain}/#website` },
  };
}

export function buildItemList(site: SiteSettings, projects: Project[]): JsonObject {
  return {
    "@type": "ItemList",
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: buildCreativeWork(site, project),
    })),
  };
}
