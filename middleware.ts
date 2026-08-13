import { clerkMiddleware } from "@clerk/nextjs/server";

export default clerkMiddleware({
  authorizedParties: [
    "https://7wingz.com",
    "https://marketing.7wingz.com",
  ],
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};