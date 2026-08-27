import "server-only";

import { cache } from "react";
import { getSession } from "@/lib/dal";
import { createAdminClient } from "@/lib/supabase/admin";
import { FREE_ENTITLEMENT, getEntitlement, type Entitlement } from "./entitlements";

/** The signed-in user's entitlement, memoised per render pass. Anonymous → free. */
export const getSessionEntitlement = cache(async (): Promise<Entitlement> => {
  const session = await getSession();
  if (!session) return FREE_ENTITLEMENT;
  // Service role: `entitlements` may not exist yet and RLS would hide nothing useful here anyway
  // (own-row policy); the DAL already verified the session.
  try {
    return await getEntitlement(createAdminClient(), session.userId);
  } catch (e) {
    console.warn("entitlements: unavailable — treating as free", e);
    return FREE_ENTITLEMENT;
  }
});
