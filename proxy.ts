import { clerkMiddleware } from "@clerk/nextjs/server";

// Soft auth: all routes are public. Clerk provides identity only.
// Phase 2 will add per-route protection for the sync API.
export default clerkMiddleware();

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
    "/__clerk/:path*",
  ],
};
