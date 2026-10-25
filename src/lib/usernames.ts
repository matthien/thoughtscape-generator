// Cookie names shared by the form's server action and the page that reads them.
export const USERNAME_COOKIES = {
  letterboxd: "ts_letterboxd",
  goodreads: "ts_goodreads",
} as const;

// 30 days, and src/proxy.ts re-sets the cookies on every canvas visit, so the
// window rolls: someone who keeps coming back never sees the form again, and
// someone who stops is forgotten a month later.
export const USERNAME_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax",
  path: "/",
  maxAge: 60 * 60 * 24 * 30,
} as const;
