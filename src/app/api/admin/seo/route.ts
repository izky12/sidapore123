import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// pola tag <meta name="google-site-verification" content="..."> (urutan atribut bebas)
const META_RE =
  /^<meta\s+(?:name=["']google-site-verification["']\s+content=["'][^"'<>]+["']|content=["'][^"'<>]+["']\s+name=["']google-site-verification["'])\s*\/?>$/i;

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("site_settings")
    .select("value")
    .eq("key", "google_site_verification")
    .single();

  return NextResponse.json({ value: data?.value ?? "" });
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { snippet } = await req.json();
  if (typeof snippet !== "string") {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }
  if (snippet.trim() !== "" && !META_RE.test(snippet.trim())) {
    return NextResponse.json({ error: "Format kode tidak valid. Tempel persis tag <meta> dari Google." }, { status: 400 });
  }

  // Sudah dilindungi requireAdmin() di atas (login admin asli + cek role),
  // jadi tidak perlu kunci tambahan lagi — 1 pintu masuk yang aman & tidak
  // merepotkan klien mengingat password kedua.
  const adminClient = createAdminClient();
  const { error } = await adminClient.rpc("set_google_verification", { new_value: snippet.trim() });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
