"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { USERNAME_COOKIES } from "@/lib/usernames";

export type UsernameFormState = { error: string | null };

// The form posts here; the usernames ride along in cookies rather than the
// URL because Canvas rewrites the path to /film/<slug> and back to "/" as
// details open and close, which would drop any query string. Session cookies,
// so closing the browser brings the form back.
export async function saveUsernames(
  _prev: UsernameFormState,
  formData: FormData
): Promise<UsernameFormState> {
  const letterboxd = String(formData.get("letterboxd") ?? "").trim();
  const goodreads = String(formData.get("goodreads") ?? "").trim();
  if (!letterboxd) return { error: "a letterboxd username is required" };

  const store = await cookies();
  const options = { httpOnly: true, sameSite: "lax", path: "/" } as const;
  store.set(USERNAME_COOKIES.letterboxd, letterboxd, options);
  if (goodreads) store.set(USERNAME_COOKIES.goodreads, goodreads, options);
  else store.delete(USERNAME_COOKIES.goodreads);

  redirect("/");
}

// The canvas panel's "change username" button: forget the usernames and go
// back to the form.
export async function clearUsernames() {
  const store = await cookies();
  store.delete(USERNAME_COOKIES.letterboxd);
  store.delete(USERNAME_COOKIES.goodreads);
  redirect("/");
}
