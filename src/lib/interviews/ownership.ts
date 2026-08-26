// Ownership check shared by every interview server action and page (Loop 07). Actions load the
// row with the service-role client (after `verifySession`) so a stranger gets an explicit 403
// rather than RLS's silent "not found"; writes still go through the cookie client under RLS.

export type OwnedRow = { id: string; user_id: string } | null | undefined;

export type OwnershipResult = { ok: true } | { ok: false; status: 403 | 404; error: string };

export function checkOwnership(row: OwnedRow, userId: string): OwnershipResult {
  if (!row) return { ok: false, status: 404, error: "interview not found" };
  if (row.user_id !== userId) return { ok: false, status: 403, error: "this interview belongs to another user" };
  return { ok: true };
}

export class OwnershipError extends Error {
  status: 403 | 404;
  constructor(r: Exclude<OwnershipResult, { ok: true }>) {
    super(r.error);
    this.status = r.status;
  }
}

/** Throws OwnershipError (403/404) unless `row` belongs to `userId`. */
export function assertOwnership<T extends NonNullable<OwnedRow>>(row: T | null | undefined, userId: string): T {
  const r = checkOwnership(row, userId);
  if (!r.ok) throw new OwnershipError(r);
  return row as T;
}
