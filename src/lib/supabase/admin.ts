import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// PERINGATAN: hanya dipakai di server (route handler/server action).
// SUPABASE_SERVICE_ROLE_KEY tidak boleh diawali NEXT_PUBLIC_ dan tidak boleh dikirim ke browser.
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}
