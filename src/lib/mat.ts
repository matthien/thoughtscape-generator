export const TITLE_POS = { x: 775, y: 480 };

// Grid rendered as a single tiled SVG image rather than stacked CSS
// gradients: hard-stop gradient lines rasterize inconsistently across
// device pixel ratios (invisible on some displays, overly heavy on
// others at fractional zoom/scaling). A baked vector tile scales the
// same way a normal image does, so it stays visible everywhere.
export const GRID_TILE_URL = (() => {
  const major = "rgba(150,152,158,0.12)";
  const minor = "rgba(150,152,158,0.07)";
  const minorOffsets = [40, 80, 120, 160];
  const minorLines = minorOffsets
    .map(
      (o) =>
        `<rect x="${o}" y="0" width="1" height="200" fill="${minor}"/>` +
        `<rect x="0" y="${o}" width="200" height="1" fill="${minor}"/>`
    )
    .join("");
  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">` +
    `<rect x="0" y="0" width="1.5" height="200" fill="${major}"/>` +
    `<rect x="0" y="0" width="200" height="1.5" fill="${major}"/>` +
    minorLines +
    `</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
})();

// Home view puts the title copy dead-center in the viewport (Matt's
// explicit call after trying bounding-box centering, which drifted with
// asymmetric card arrangements).
export function centerPan() {
  return {
    x: window.innerWidth / 2 - TITLE_POS.x,
    y: window.innerHeight / 2 - TITLE_POS.y,
  };
}
