import { useEffect } from 'react';

const SITE_URL = 'https://precision-match.com';
const DEFAULT_TITLE = 'Precision Match — AI Resume Builder | Tailor Your Resume to Any Job';
const DEFAULT_DESCRIPTION =
  'Build job-winning resumes in minutes. Precision Match uses AI to tailor your resume to any job description, maximizing ATS scores and interview callbacks.';

interface PageMetaProps {
  /** Page-specific title. Omit for the homepage to use the default brand title as-is. */
  title?: string;
  /** Page-specific meta description. Omit to fall back to the default. */
  description?: string;
  /** Route path, e.g. '/', '/pricing'. Used to build the canonical URL and og:url. */
  path: string;
}

/**
 * Updates document.title, the meta description, Open Graph / Twitter tags,
 * and the canonical link tag for the current public route.
 *
 * This is a client-side-only fix: it corrects what a JS-executing crawler
 * or a user's browser tab sees, and sets a real per-page canonical URL.
 * It can't change what non-JS social-preview bots (Slack/LinkedIn/Twitter
 * unfurl bots) see on first fetch, since those read the static HTML in
 * index.html before any script runs. Full control over that would require
 * server-side rendering or prerendering, which is a separate, bigger change.
 */
export function PageMeta({ title, description, path }: PageMetaProps) {
  useEffect(() => {
    const fullTitle = title ? `${title} | Precision Match` : DEFAULT_TITLE;
    const fullDescription = description || DEFAULT_DESCRIPTION;
    const canonicalUrl = `${SITE_URL}${path === '/' ? '' : path}`;

    document.title = fullTitle;

    const setMetaContent = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', value);
    };
    const setLinkHref = (selector: string, value: string) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('href', value);
    };

    setMetaContent('meta[name="description"]', fullDescription);
    setMetaContent('meta[property="og:title"]', fullTitle);
    setMetaContent('meta[property="og:description"]', fullDescription);
    setMetaContent('meta[property="og:url"]', canonicalUrl);
    setMetaContent('meta[name="twitter:title"]', fullTitle);
    setMetaContent('meta[name="twitter:description"]', fullDescription);
    setLinkHref('link[rel="canonical"]', canonicalUrl);

    return () => {
      // Reset to site defaults on unmount so navigating away (e.g. into the
      // authenticated dashboard) doesn't leave a stale marketing-page title.
      document.title = DEFAULT_TITLE;
    };
  }, [title, description, path]);

  return null;
}

export default PageMeta;
