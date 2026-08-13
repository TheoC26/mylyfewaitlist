import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Service-role Supabase client. SERVER ONLY.
 *
 * This key bypasses row-level security on every table in the project. It must
 * never gain a NEXT_PUBLIC_ prefix and must never be imported from a component.
 * The `server-only` import above turns a stray client-side import into a build
 * error rather than a key that ships to the browser.
 *
 * Mirrors the construction in mylyfeserver/src/services/supabaseService.js.
 * Session persistence is off: there is no user session here, and leaving it on
 * makes a server process try to write tokens to a nonexistent storage.
 */

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

export const isConfigured = Boolean(url && serviceKey);

export const supabaseAdmin = isConfigured
  ? createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    })
  : null;
