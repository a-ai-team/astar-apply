// Mentor roster shown on /home and in the chat intro. Adding a mentor = one entry here plus a
// square portrait at public/mentors/<slug>.jpg. Reading from the `mentors` table comes later;
// TODO(james): wire to public.mentors once real rows exist.

export type Mentor = {
  slug: string;
  name: string;
  /** Roles in display order; rendered with a non-breaking "·" so the separator never leads a line. */
  roles: string[];
  university: string;
  focus: string[];
  /** True when a corpus sits behind the Mentor for this person today. */
  live: boolean;
};

export type Seat = { seat: true };

export const MENTORS: Mentor[] = [
  {
    slug: "tesleem",
    name: "Tesleem Fowora",
    roles: ["President, LSESU Business & Investment Group", "Private Equity Summer Analyst, HarbourVest"],
    university: "LSE",
    focus: ["Private equity", "IB technicals", "Spring weeks"],
    live: true,
  },
];

/** "A · B" — the separator binds to the preceding word (see PR #24). */
export function credentialLine(m: Pick<Mentor, "roles">): string {
  return m.roles.join(" · ");
}

export function portraitSrc(m: Pick<Mentor, "slug">): string {
  return `/mentors/${m.slug}.jpg`;
}

/** Pads the roster with reserved seats up to a full row (at least one row when empty). */
export function rosterWithSeats(mentors: Mentor[], cols: number): Array<Mentor | Seat> {
  const width = Math.max(1, cols);
  const rows = Math.max(1, Math.ceil(mentors.length / width));
  const out: Array<Mentor | Seat> = [...mentors];
  while (out.length < rows * width) out.push({ seat: true });
  return out;
}

export function isSeat(x: Mentor | Seat): x is Seat {
  return "seat" in x;
}
