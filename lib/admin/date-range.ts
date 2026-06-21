/**
 * Parse a Postgres daterange literal like "[2026-07-01,2026-07-06)" into ISO
 * start/end strings. The stored range is half-open [start, end): `end` is the
 * exclusive day after the last blocked/booked day.
 */
export function parseDateRange(
  literal: string,
): { start: string; end: string } | null {
  const m = literal.match(/^[[(]\s*([0-9-]+)\s*,\s*([0-9-]+)\s*[\])]$/);
  if (!m) return null;
  return { start: m[1]!, end: m[2]! };
}
