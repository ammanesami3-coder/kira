import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

// Next.js 16 renamed the "middleware" convention to "proxy".
// next-intl's locale negotiation/redirects run here.
export default createMiddleware(routing);

export const config = {
  // Skip API routes, Next internals, Vercel internals and static files.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
