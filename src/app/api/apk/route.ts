import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const revalidate = 60;

export async function GET() {
  const adminClient = createAdminClient();
  const { data } = await adminClient
    .from("app_releases")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return NextResponse.json({ release: null });

  const { data: pub } = adminClient.storage.from("apk").getPublicUrl(data.file_path);

  return NextResponse.json({
    release: {
      url: pub.publicUrl,
      version_label: data.version_label,
      original_name: data.original_name,
      size_bytes: data.size_bytes,
      created_at: data.created_at,
    },
  });
}
