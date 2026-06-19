import { useEffect } from "react";

const SITE_URL = "https://job-pa.com";
const SOCIAL_IMAGE_URL = `${SITE_URL}/og-image.png`;
const ORG_SCHEMA_ID = "jobpa-public-schema";

function setMeta(selector: string, attr: "name" | "property", key: string, content: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(url: string) {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "canonical";
    document.head.appendChild(link);
  }
  link.href = url;
}

function setJsonLd(data: object) {
  let script = document.head.querySelector<HTMLScriptElement>(`script#${ORG_SCHEMA_ID}`);
  if (!script) {
    script = document.createElement("script");
    script.id = ORG_SCHEMA_ID;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

export function PublicSeo({
  title,
  description,
  path = "/",
  keywords,
}: {
  title: string;
  description: string;
  path?: string;
  keywords?: string[];
}) {
  useEffect(() => {
    const normalizedPath = path === "/" ? "" : path.replace(/\/+$/, "");
    const canonical = `${SITE_URL}${normalizedPath}`;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    if (keywords?.length) {
      setMeta('meta[name="keywords"]', "name", "keywords", keywords.join(", "));
    }
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    setMeta('meta[property="og:url"]', "property", "og:url", canonical);
    setMeta('meta[property="og:image"]', "property", "og:image", SOCIAL_IMAGE_URL);
    setMeta('meta[property="og:image:alt"]', "property", "og:image:alt", "JobPA agentic career assistant and Career Ops dashboard");
    setMeta('meta[property="og:site_name"]', "property", "og:site_name", "JobPA");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", title);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", description);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", SOCIAL_IMAGE_URL);
    setCanonical(canonical);
    setJsonLd({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": `${SITE_URL}/#organization`,
          name: "JobPA",
          url: SITE_URL,
          logo: `${SITE_URL}/jobpa-logo.png`,
          sameAs: [SITE_URL],
        },
        {
          "@type": "SoftwareApplication",
          "@id": `${SITE_URL}/#software`,
          name: "JobPA",
          applicationCategory: "BusinessApplication",
          operatingSystem: "Web",
          url: SITE_URL,
          image: SOCIAL_IMAGE_URL,
          description: "Agentic AI Career Ops for job seekers to track, tailor, and improve every application.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "SGD",
            category: "Free trial",
          },
        },
        {
          "@type": "WebPage",
          "@id": `${canonical}#webpage`,
          url: canonical,
          name: title,
          description,
          isPartOf: {
            "@type": "WebSite",
            "@id": `${SITE_URL}/#website`,
            name: "JobPA",
            url: SITE_URL,
          },
          about: {
            "@id": `${SITE_URL}/#software`,
          },
          inLanguage: "en",
          keywords: keywords?.join(", "),
        },
      ],
    });
  }, [description, keywords, path, title]);

  return null;
}
