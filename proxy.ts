// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "./app/api/[...nextauth]/route";
import { checkRateLimit } from "@/app/lib/rateLimit";

const PAGE_LOAD_LIMIT = 60;
const PAGE_LOAD_LOCK_MINUTES = 5;

function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get("x-forwarded-for");
  if (forwardedFor) return forwardedFor.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

export default auth(async function proxy(request: NextRequest) {
  // Step 1: block visitors who've reloaded/navigated too many times
  const ip = getClientIp(request);
  const pageCheck = await checkRateLimit(`page:${ip}`, PAGE_LOAD_LIMIT, PAGE_LOAD_LOCK_MINUTES);
  if (!pageCheck.allowed) {
    return NextResponse.redirect(new URL("/locked", request.url));
  }

  // Step 2: require login for the cart pages
  const isCartPage = request.nextUrl.pathname.startsWith("/cart");
  // @ts-expect-error - "auth" is attached to the request by the auth() wrapper
  const isLoggedIn = !!request.auth;

  if (isCartPage && !isLoggedIn) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};

