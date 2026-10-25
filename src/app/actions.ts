"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createShareToken, SHARE_TTL_DAYS } from "@/lib/shareToken";
import { USERNAME_COOKIES, USERNAME_COOKIE_OPTIONS } from "@/lib/usernames";

export type UsernameFormState = { error: string | null };

// The form posts here; the usernames ride along in cookies rather than the
// URL because Canvas rewrites the path to /film/<slug> and back to "/" as
// details open and close, which would drop any query string. They last 30
// days, rolled forward on each visit by src/proxy.ts.
export async function saveUsernames(
  _prev: UsernameFormState,
  formData: FormData
): Promise<UsernameFormState> {
  const letterboxd = String(formData.get("letterboxd") ?? "").trim();
  const goodreads = String(formData.get("goodreads") ?? "").trim();
  if (!letterboxd) return { error: "a letterboxd username is required" };

  const store = await cookies();
  store.set(USERNAME_COOKIES.letterboxd, letterboxd, USERNAME_COOKIE_OPTIONS);
  if (goodreads) store.set(USERNAME_COOKIES.goodreads, goodreads, USERNAME_COOKIE_OPTIONS);
  else store.delete(USERNAME_COOKIES.goodreads);

  redirect("/");
}

// The canvas panel's share button: a fresh signed link for whoever's
// usernames are in the cookies, valid for SHARE_TTL_DAYS from now. Returns a
// path; the browser adds its own origin.
export async function createShareLink(): Promise<{ path: string; days: number }> {
  const store = await cookies();
  const letterboxd = store.get(USERNAME_COOKIES.letterboxd)?.value;
  const goodreads = store.get(USERNAME_COOKIES.goodreads)?.value;
  if (!letterboxd) throw new Error("No username to share");
  return { path: `/s/${createShareToken({ letterboxd, goodreads })}`, days: SHARE_TTL_DAYS };
}

// The canvas panel's "change username" button: forget the usernames and go
// back to the form.
export async function clearUsernames() {
  const store = await cookies();
  store.delete(USERNAME_COOKIES.letterboxd);
  store.delete(USERNAME_COOKIES.goodreads);
  redirect("/");
}
