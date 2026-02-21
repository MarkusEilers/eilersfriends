import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match all pathnames except for
  // - API routes
  // - Next.js internals (_next)
  // - Static files (images, etc.)
  // - Sanity Studio
  matcher: [
    "/((?!api|_next|_vercel|studio|.*\\..*).*)",
  ],
};
