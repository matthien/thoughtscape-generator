// Same page as the canvas root: Canvas reads the /film/<slug> or /book/<slug>
// path on mount and opens that entry's detail view directly. This route just
// needs to exist so a hard load (or refresh) of a detail link doesn't 404.
export { default } from "../../page";
