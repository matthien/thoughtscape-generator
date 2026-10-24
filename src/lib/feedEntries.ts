import "server-only";
import { unstable_cache } from "next/cache";
import type { MediaEntry } from "@/lib/types";
import { fetchLetterboxdEntries, fetchDirector } from "@/lib/letterboxd";
import { fetchGoodreadsEntries } from "@/lib/goodreads";
import { autoLayout } from "@/lib/autoLayout";

// Feed guids can be full URLs; Card uses the id inside SVG gradient ids,
// so keep it to characters that are safe there.
function safeId(source: string, sourceId: string): string {
  return `${source}-${sourceId.replace(/[^a-zA-Z0-9]+/g, "-")}`;
}

// A film's director never changes, so each lookup is cached for 30 days,
// keyed by the review URL. Repeat visits (and anyone else who logged the same
// film) skip the page fetch. It's the director name that's cached, not the
// whole film page.
const cachedDirector = unstable_cache(
  (externalUrl: string) => fetchDirector(externalUrl).catch(() => null),
  ["director"],
  { revalidate: 60 * 60 * 24 * 30 }
);

// The RSS has no director, so it's read from each film's Letterboxd page,
// the same lookup the main site's sync does. A few at a time rather than all
// at once: measured ~0.7s for 50 films at 10 in flight, and it stays polite to
// Letterboxd. A film whose lookup fails just shows no director line.
async function addDirectors<T extends { external_url: string | null; director: string | null }>(
  movies: T[]
): Promise<void> {
  const queue = [...movies];
  await Promise.all(
    Array.from({ length: 10 }, async () => {
      for (let movie = queue.shift(); movie; movie = queue.shift()) {
        if (movie.external_url) movie.director = await cachedDirector(movie.external_url);
      }
    })
  );
}

/**
 * Fetches a visitor's public feeds and shapes them into the same MediaEntry
 * rows the canvas renders on the main site — just built per request instead
 * of read from a database. Either username is optional, but at least one is
 * expected. If both are given and one feed fails, the other still renders.
 */
export async function getFeedEntries({
  letterboxd,
  goodreads,
}: {
  letterboxd?: string;
  goodreads?: string;
}): Promise<MediaEntry[]> {
  const [movies, books] = await Promise.allSettled([
    letterboxd ? fetchLetterboxdEntries(letterboxd) : Promise.resolve([]),
    goodreads ? fetchGoodreadsEntries(goodreads) : Promise.resolve([]),
  ]);
  if (movies.status === "rejected" && books.status === "rejected") {
    throw movies.reason;
  }

  // Positions are filled in by autoLayout() once everything is collected.
  const entries: Omit<MediaEntry, "x" | "y">[] = [];

  for (const m of movies.status === "fulfilled" ? movies.value : []) {
    const id = safeId("letterboxd", m.source_id);
    entries.push({
      ...m,
      id,
      source: "letterboxd",
      media_type: "movie",
      director: null, // filled in by addDirectors() below
      author: null,
      shelved_at: null,
      mat_number: 1,
      // Nothing is "synced" here, so the NEW badge (keyed off created_at)
      // means "logged in the last 7 days" instead.
      created_at: m.logged_at,
    });
  }

  for (const b of books.status === "fulfilled" ? books.value : []) {
    const id = safeId("goodreads", b.source_id);
    entries.push({
      ...b,
      id,
      source: "goodreads",
      media_type: "book",
      director: null,
      contains_spoilers: false,
      shelved_at: null,
      mat_number: 1,
      created_at: b.logged_at,
    });
  }

  await addDirectors(entries.filter((e) => e.media_type === "movie"));

  // No cap: everything the feeds return goes on the mat (unlike the main
  // site's latest 40). The feeds cap themselves; Letterboxd's RSS stops at
  // the 50 most recent. Newest first is the order autoLayout() needs: it
  // hands out the spots nearest the center in the order it receives entries.
  entries.sort((a, b) => b.logged_at.localeCompare(a.logged_at));
  return autoLayout(entries);
}
