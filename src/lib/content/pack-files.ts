// Week-pack file naming (Loop 20). Shared by the download route and `scripts/path/build-packs.ts`,
// so keep this file free of `server-only` and React.
import { DEFAULT_PATH } from "./taxonomy";

/** Private Storage bucket holding one PDF per week; created on first `npm run packs:build`. */
export const PACKS_BUCKET = "packs";

const pad = (week: number) => String(week).padStart(2, "0");

/** Object key inside the bucket. */
export function packObjectPath(week: number): string {
  return `${DEFAULT_PATH.slug}/week-${pad(week)}.pdf`;
}

/**
 * Deals items out one group at a time (group order, then each group's own order) until `limit`,
 * so a pack's practice set covers every subtopic before it doubles up on any.
 */
export function pickRoundRobin<T>(groups: T[][], limit: number): T[] {
  const out: T[] = [];
  for (let i = 0; out.length < limit && groups.some((g) => i < g.length); i++) {
    for (const g of groups) {
      if (i < g.length && out.length < limit) out.push(g[i]);
    }
  }
  return out;
}

/** The filename a student sees in their downloads folder. */
export function packDownloadName(week: number): string {
  const title = DEFAULT_PATH.weeks.find((w) => w.week === week)?.title ?? "";
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `astar-apply-week-${pad(week)}${slug ? `-${slug}` : ""}.pdf`;
}
