import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// How long a share link stays valid. The toast reads this back through the
// share action, so changing it here changes the "expires in N days" copy too.
export const SHARE_TTL_DAYS = 7;

const HOUR = 60 * 60 * 1000;
// 16 base64url chars = 96 bits: far past guessable, a third the length of
// the full digest.
const SIG_LENGTH = 16;
// Letterboxd usernames are letters, digits and underscores; Goodreads ids are
// digits, sometimes with a -name suffix. Neither can hold the "." separator.
const USERNAME = /^[A-Za-z0-9_-]+$/;

export type ShareTokenResult =
  | { status: "ok"; letterboxd: string; goodreads?: string }
  | { status: "expired" }
  | { status: "invalid" };

function secret(): string {
  const s = process.env.SHARE_SECRET;
  if (!s) throw new Error("SHARE_SECRET is not set");
  return s;
}

function sign(body: string): string {
  return createHmac("sha256", secret()).update(body).digest("base64url").slice(0, SIG_LENGTH);
}

/**
 * A share link carries the usernames and its own expiry, signed so none of
 * them can be edited: `<letterboxd>[.<goodreads>].<expiry>.<signature>`.
 * Nothing is stored: the link is the only record, and once the expiry passes
 * the server simply stops honouring it. The usernames sit in it as plain
 * text — they're public anyway. The expiry is in hours since the epoch, in
 * base 36, which keeps it to four characters.
 */
export function createShareToken({
  letterboxd,
  goodreads,
}: {
  letterboxd: string;
  goodreads?: string;
}): string {
  if (!USERNAME.test(letterboxd) || (goodreads && !USERNAME.test(goodreads))) {
    throw new Error("Username can't be put in a share link");
  }
  // Rounded up to the hour, so a link always lasts at least the full TTL.
  const exp = (Math.ceil(Date.now() / HOUR) + SHARE_TTL_DAYS * 24).toString(36);
  const body = [letterboxd, goodreads, exp].filter(Boolean).join(".");
  return `${body}.${sign(body)}`;
}

export function verifyShareToken(token: string): ShareTokenResult {
  const parts = token.split(".");
  if (parts.length !== 3 && parts.length !== 4) return { status: "invalid" };

  const sig = parts.pop()!;
  const body = parts.join(".");
  const expected = Buffer.from(sign(body));
  const given = Buffer.from(sig);
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) {
    return { status: "invalid" };
  }

  const [letterboxd, goodreads, exp] =
    parts.length === 3 ? parts : [parts[0], undefined, parts[1]];
  // Checked only after the signature, so an edited date can't even reach here.
  if (parseInt(exp, 36) * HOUR < Date.now()) return { status: "expired" };

  return { status: "ok", letterboxd, goodreads };
}
