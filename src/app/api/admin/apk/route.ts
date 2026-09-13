import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_SIZE_BYTES = 150 * 1024 * 1024; // 150MB, batas wajar untuk APK

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const form = await req.formData();
  const file = form.get("file");
  const versionLabel = (form.get("version_label") as string | null) ?? null;

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
  }
  if (!file.name.toLowerCase().endsWith(".apk")) {
    return NextResponse.json({ error: "File harus berformat .apk" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: "Ukuran file maksimal 150MB" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // Nama file di storage dibuat unik (timestamp) supaya link lama yang mungkin
  // sudah dibagikan/di-cache pelanggan tidak tiba-tiba berubah isinya diam-diam;
  // riwayat rilis lama tetap tersimpan di tabel app_releases.
  const path = `sidapore-${Date.now()}.apk`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await adminClient.storage
    .from("apk")
    .upload(path, arrayBuffer, {
      contentType: "application/vnd.android.package-archive",
      upsert: false,
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 400 });
  }

  const { error: insertError } = await adminClient.from("app_releases").insert({
    file_path: path,
    original_name: file.name,
    version_label: versionLabel,
    size_bytes: file.size,
    uploaded_by: admin.id,
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 400 });
  }

  const { data: pub } = adminClient.storage.from("apk").getPublicUrl(path);

  return NextResponse.json({ ok: true, url: pub.publicUrl });
}
