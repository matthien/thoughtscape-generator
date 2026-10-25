import { notFound } from "next/navigation";
import Canvas from "@/components/Canvas";
import ShareNotice from "@/components/ShareNotice";
import { getFeedEntries } from "@/lib/feedEntries";
import { SHARE_TTL_DAYS, verifyShareToken } from "@/lib/shareToken";

// Same reason as the root page: the feeds are fetched per request.
export const dynamic = "force-dynamic";

// A shared link: the usernames come from the signed token instead of the
// viewer's cookies, which are never read or touched here.
export default async function SharedPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const share = verifyShareToken(token);

  if (share.status === "invalid") notFound();
  if (share.status === "expired") {
    return <ShareNotice message={`this thoughtscape has expired.\nshared links last ${SHARE_TTL_DAYS} days.`} />;
  }

  let entries;
  try {
    entries = await getFeedEntries({ letterboxd: share.letterboxd, goodreads: share.goodreads });
  } catch {
    return <ShareNotice message={"couldn't load this thoughtscape.\nthe feeds may be down or private."} />;
  }

  return (
    <Canvas
      entries={entries}
      title={`${share.letterboxd}'s thoughtscape`}
      basePath={`/s/${token}`}
    />
  );
}
