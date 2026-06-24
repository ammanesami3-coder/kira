import { Globe } from "lucide-react";

import type { Json } from "@/types/database.types";

/**
 * Social profile links rendered from `agency_settings.social_links` (a jsonb
 * object keyed by platform, e.g. `{ "instagram": "https://…" }`). Brand glyphs
 * are inline SVGs because lucide dropped its brand-icon set; unknown platforms
 * fall back to a generic globe so a new network never breaks the layout.
 */

type IconProps = { className?: string };

const xIcon = ({ className }: IconProps) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden
  >
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.65l-5.21-6.82-5.96 6.82H1.69l7.73-8.84L1.25 2.25h6.82l4.71 6.23 5.46-6.23Zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64Z" />
  </svg>
);

const BRAND_ICONS: Record<string, (p: IconProps) => React.ReactNode> = {
  facebook: ({ className }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M22 12a10 10 0 1 0-11.56 9.88v-6.99H7.9V12h2.54V9.8c0-2.5 1.49-3.89 3.78-3.89 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.77-1.63 1.56V12h2.78l-.44 2.89h-2.34v6.99A10 10 0 0 0 22 12Z" />
    </svg>
  ),
  instagram: ({ className }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41a3.72 3.72 0 0 1-1.38-.9 3.72 3.72 0 0 1-.9-1.38c-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16Zm0 1.8c-3.14 0-3.51.01-4.75.07-1.15.05-1.77.24-2.18.4-.55.22-.94.47-1.35.88-.41.41-.66.8-.88 1.35-.16.41-.35 1.03-.4 2.18-.06 1.24-.07 1.61-.07 4.75s.01 3.51.07 4.75c.05 1.15.24 1.77.4 2.18.22.55.47.94.88 1.35.41.41.8.66 1.35.88.41.16 1.03.35 2.18.4 1.24.06 1.61.07 4.75.07s3.51-.01 4.75-.07c1.15-.05 1.77-.24 2.18-.4.55-.22.94-.47 1.35-.88.41-.41.66-.8.88-1.35.16-.41.35-1.03.4-2.18.06-1.24.07-1.61.07-4.75s-.01-3.51-.07-4.75c-.05-1.15-.24-1.77-.4-2.18a3.64 3.64 0 0 0-.88-1.35 3.64 3.64 0 0 0-1.35-.88c-.41-.16-1.03-.35-2.18-.4-1.24-.06-1.61-.07-4.75-.07Zm0 3.06a4.98 4.98 0 1 1 0 9.96 4.98 4.98 0 0 1 0-9.96Zm0 8.22a3.24 3.24 0 1 0 0-6.48 3.24 3.24 0 0 0 0 6.48Zm6.34-8.42a1.16 1.16 0 1 1-2.32 0 1.16 1.16 0 0 1 2.32 0Z" />
    </svg>
  ),
  x: xIcon,
  twitter: xIcon,
  youtube: ({ className }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M23.5 6.5a3 3 0 0 0-2.12-2.12C19.5 3.87 12 3.87 12 3.87s-7.5 0-9.38.51A3 3 0 0 0 .5 6.5C0 8.38 0 12 0 12s0 3.62.5 5.5a3 3 0 0 0 2.12 2.12c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3 3 0 0 0 2.12-2.12C24 15.62 24 12 24 12s0-3.62-.5-5.5ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z" />
    </svg>
  ),
  linkedin: ({ className }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14ZM7.12 20.45H3.55V9h3.57v11.45ZM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0Z" />
    </svg>
  ),
  tiktok: ({ className }) => (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M16.6 5.82a4.28 4.28 0 0 1-1.06-2.82h-3.2v12.2a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12v-3.3a5.9 5.9 0 1 0 5.02 5.83V9.01a7.42 7.42 0 0 0 4.3 1.37V7.1a4.28 4.28 0 0 1-3.24-1.28Z" />
    </svg>
  ),
};

function entries(json: Json): { key: string; url: string }[] {
  if (!json || typeof json !== "object" || Array.isArray(json)) return [];
  return Object.entries(json)
    .filter(
      (e): e is [string, string] =>
        typeof e[1] === "string" && /^https?:\/\//.test(e[1]),
    )
    .map(([key, url]) => ({ key: key.toLowerCase(), url }));
}

export function SocialLinks({
  links,
  className,
}: {
  links: Json;
  className?: string;
}) {
  const items = entries(links);
  if (items.length === 0) return null;

  return (
    <ul className={className}>
      {items.map(({ key, url }) => {
        const Icon = BRAND_ICONS[key];
        return (
          <li key={key}>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={key}
              className="text-muted-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary flex size-9 items-center justify-center rounded-full border transition-colors"
            >
              {Icon ? (
                <Icon className="size-4" />
              ) : (
                <Globe className="size-4" aria-hidden />
              )}
            </a>
          </li>
        );
      })}
    </ul>
  );
}
