import Canvas from "@/components/Canvas";
import { getFeedEntries } from "@/lib/feedEntries";

// Feeds are fetched per request; without this the page would prerender once
// at build time and freeze whatever the feeds held then.
export const dynamic = "force-dynamic";

// Stand-in until the username form exists: previews Matt's own feeds so the
// copied canvas has real entries to render.
const DEMO = { letterboxd: "matttheinn", goodreads: "199102300" };

export default async function Home() {
  const entries = await getFeedEntries(DEMO);
  return (
    <Canvas
      entries={entries}
      title={`${DEMO.letterboxd}'s thoughtscape`}
      subtitle="entryway to my opinions about different forms of media"
    />
  );
}
