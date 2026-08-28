// Cheat sheets are read from the repo, not the database (Loop 11 decision — a table only when
// mentors need to edit them in-app; see docs/loops/11-technicals-platform.md § Data model).
// Server-only: uses node:fs.
import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { validateCheatSheet, type CheatSheet } from "./cheatsheet-schema";

export const CHEATSHEET_DIR = path.join(process.cwd(), "content", "cheatsheets");

/** The cheat sheet for a topic, or null when the chapter has not written one yet. */
export function getCheatSheet(topicSlug: string): CheatSheet | null {
  if (!/^[a-z0-9-]+$/.test(topicSlug)) return null; // never let a slug walk the filesystem
  const file = path.join(CHEATSHEET_DIR, `${topicSlug}.json`);
  if (!existsSync(file)) return null;
  const parsed = validateCheatSheet(JSON.parse(readFileSync(file, "utf8")));
  return parsed.ok ? parsed.value : null;
}

export function hasCheatSheet(topicSlug: string): boolean {
  return getCheatSheet(topicSlug) !== null;
}
