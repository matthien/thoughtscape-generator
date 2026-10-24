import { CARD_W, CARD_H } from "@/lib/detailLayout";
import { TITLE_POS } from "@/lib/mat";

// Automatic card placement for a mat nobody has arranged by hand.
//
// Two rules: no card overlaps another (or the title copy), and newer entries
// sit closer to the center. Cards are placed one at a time, newest first, and
// each takes the free spot nearest the title. That spot is found by walking an
// outward spiral from the title and stopping at the first position where the
// card fits. Because earlier (newer) cards claim the inner spots first, age
// falls off with distance on its own, with no explicit ring logic.
//
// Everything here is deterministic, so the same feed always produces the same
// arrangement and a shared link looks identical on every load.

// Breathing room kept on every side of a card's footprint, so neighbors end
// up ~2x this apart. Also absorbs the up-to-4deg resting tilt, which pushes
// a rotated card's corners a few px past its unrotated box. This is the knob
// for how spread out the mat feels.
const MARGIN = 60;

// Clear space kept around the title copy. Separate from MARGIN so spreading
// the cards out doesn't also push them far away from the title.
const TITLE_MARGIN = 24;

// Star row (20px tall) plus the 2px flex gap above it in Card.module.css.
const STARS_H = 22;

// 5-star movies render 15% larger (--card-scale in Card.tsx).
const BOOST = 1.15;

// Book covers keep their own aspect ratio, which isn't known until the image
// loads in the browser. Most are close to 2:3; this leaves room for the
// somewhat taller ones without spacing every book like an outlier.
const BOOK_H = 230;

// The NEW badge pokes out past the top-right corner (Card.module.css .badge:
// 14px above, ~27px past the right edge).
const BADGE_RIGHT = 30;
const BADGE_TOP = 14;

// The viewport is wider than it is tall, so the spiral is stretched
// horizontally. Otherwise the outer rings would run off the top and bottom of
// the screen while the sides sat empty.
const ASPECT = 1.5;

// Spiral resolution: distance between successive turns, and the step along
// the curve. Smaller packs tighter but searches longer; at these values a
// 40-card layout takes a few milliseconds.
const RING_SPACING = 14;
const ARC_STEP = 14;

type Rect = { left: number; top: number; right: number; bottom: number };

type Placeable = {
  media_type: string;
  rating: number | null;
  logged_at: string;
  /** Matches Card's NEW badge rule: shown when this is under 7 days old. */
  created_at: string;
};

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

// The card's on-mat size at rest, stars included.
function cardSize(entry: Placeable) {
  if (entry.media_type === "book") return { w: CARD_W, h: BOOK_H + STARS_H };
  const scale = entry.rating === 5 ? BOOST : 1;
  return { w: CARD_W * scale, h: CARD_H * scale + STARS_H };
}

function overlaps(a: Rect, b: Rect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

/**
 * Returns a copy of each entry with x/y filled in. Entries should arrive
 * newest first; that order is what decides who gets the inner spots.
 */
export function autoLayout<T extends Placeable>(entries: T[]): (T & { x: number; y: number })[] {
  // The title copy (296px wide in Canvas.module.css, two short lines) sits
  // centered on TITLE_POS. It's reserved first so no card lands on it.
  const taken: Rect[] = [
    {
      left: TITLE_POS.x - 148 - TITLE_MARGIN,
      right: TITLE_POS.x + 148 + TITLE_MARGIN,
      top: TITLE_POS.y - 24 - TITLE_MARGIN,
      bottom: TITLE_POS.y + 24 + TITLE_MARGIN,
    },
  ];
  const now = Date.now();

  return entries.map((entry) => {
    const { w, h } = cardSize(entry);
    const isNew = now - new Date(entry.created_at).getTime() < NEW_WINDOW_MS;

    // The footprint around a card whose top-left corner is at (x, y).
    const footprint = (x: number, y: number): Rect => ({
      left: x - MARGIN,
      top: y - MARGIN - (isNew ? BADGE_TOP : 0),
      right: x + w + MARGIN + (isNew ? BADGE_RIGHT : 0),
      bottom: y + h + MARGIN,
    });

    // Archimedean spiral: radius grows by RING_SPACING per full turn. The
    // angle step shrinks as the radius grows so points stay ~ARC_STEP apart.
    let angle = 0;
    for (;;) {
      const radius = (RING_SPACING * angle) / (2 * Math.PI);
      // Candidate positions are the card's center; convert to top-left.
      const x = TITLE_POS.x + radius * Math.cos(angle) * ASPECT - w / 2;
      const y = TITLE_POS.y + radius * Math.sin(angle) - h / 2;
      const rect = footprint(x, y);
      if (!taken.some((t) => overlaps(rect, t))) {
        taken.push(rect);
        return { ...entry, x: Math.round(x), y: Math.round(y) };
      }
      angle += ARC_STEP / Math.max(radius, ARC_STEP);
    }
  });
}
