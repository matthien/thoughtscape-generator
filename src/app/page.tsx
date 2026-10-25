import { cookies } from "next/headers";
import { clearUsernames, createShareLink } from "@/app/actions";
import Canvas from "@/components/Canvas";
import UsernameForm from "@/components/UsernameForm";
import { getFeedEntries } from "@/lib/feedEntries";
import { USERNAME_COOKIES } from "@/lib/usernames";

// Feeds are fetched per request; without this the page would prerender once
// at build time and freeze whatever the feeds held then.
export const dynamic = "force-dynamic";

export default async function Home() {
  const store = await cookies();
  const letterboxd = store.get(USERNAME_COOKIES.letterboxd)?.value;
  const goodreads = store.get(USERNAME_COOKIES.goodreads)?.value;

  if (!letterboxd) return <UsernameForm />;

  let entries;
  try {
    entries = await getFeedEntries({ letterboxd, goodreads });
  } catch {
    // Both feeds failed, almost always a mistyped username: send them back
    // to the form with what they typed still filled in.
    return (
      <UsernameForm
        initial={{ letterboxd, goodreads }}
        error={"couldn't verify those usernames.\nplease check again."}
        unverified
      />
    );
  }

  return (
    <Canvas
      entries={entries}
      title={`${letterboxd}'s thoughtscape`}
      changeUsernameAction={clearUsernames}
      shareAction={createShareLink}
    />
  );
}
