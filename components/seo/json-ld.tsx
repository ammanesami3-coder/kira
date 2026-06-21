import type { Json } from "@/types/database.types";

/**
 * Renders one or more JSON-LD documents into a `<script type="application/ld+json">`.
 *
 * Server Component. The payload is our own structured data (never user input),
 * so `dangerouslySetInnerHTML` is safe here; we still escape `<` to defend
 * against a stray closing tag in any string field breaking out of the script.
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const json = JSON.stringify(data as Json).replace(/</g, "\\u003c");
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
