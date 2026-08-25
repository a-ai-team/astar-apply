"use client";

import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicKey, supabaseUrl } from "./env";

/** Browser client for Client Components. `createBrowserClient` is a singleton. */
export function createClient() {
  return createBrowserClient(supabaseUrl(), supabasePublicKey());
}
