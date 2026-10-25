const NAMED: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

// Review HTML sits inside CDATA in both feeds, and the XML parser never
// decodes entities there, so &#039; / &quot; / &amp; survive tag stripping.
// One pass over the string, so "&amp;#039;" correctly becomes "&#039;"
// rather than being decoded twice.
export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    if (body[0] === "#") {
      const code = body[1] === "x" || body[1] === "X"
        ? parseInt(body.slice(2), 16)
        : parseInt(body.slice(1), 10);
      try {
        return String.fromCodePoint(code);
      } catch {
        return match;
      }
    }
    return NAMED[body.toLowerCase()] ?? match;
  });
}
