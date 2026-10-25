import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { USERNAME_COOKIES, USERNAME_COOKIE_OPTIONS } from "@/lib/usernames";

// Rolls the username cookies' 30 days forward on each visit to your own
// canvas. Done here because a page can read cookies but can't set them.
export function proxy(request: NextRequest) {
  const response = NextResponse.next();
  for (const name of Object.values(USERNAME_COOKIES)) {
    const value = request.cookies.get(name)?.value;
    if (value) response.cookies.set(name, value, USERNAME_COOKIE_OPTIONS);
  }
  return response;
}

// Only the owner's canvas routes; shared links (/s/...) leave the viewer's
// cookies alone.
export const config = {
  matcher: ["/", "/film/:path*", "/book/:path*"],
};
