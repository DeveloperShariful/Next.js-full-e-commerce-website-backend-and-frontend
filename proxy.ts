// proxy.ts

import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

/*const isPublicRoute = createRouteMatcher([
  "/",
  "/shop(.*)",
  "/product(.*)",
  "/categories(.*)",
  "/about",
  "/contact",
  "/cart",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/uploadthing(.*)" ,
  "/api/webhooks(.*)"
]);



export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

*/

const isProtectedRoute = createRouteMatcher([
  "/admin(.*)",     
  "/profile(.*)",  
  "/api/admin(.*)"   
]);

export default clerkMiddleware(async (auth, req) => {
  
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
});


export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};