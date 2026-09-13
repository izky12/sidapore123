import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role === "admin" ? user : null;
}

const ALLOWED_ROLES = ["staff_depot", "staff_laundry", "kurir", "admin"];

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { full_name, phone, email, password, role } = await req.json();

  if (!full_name || !email || !password || !role) {
    return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
  }
  if (!ALLOWED_ROLES.includes(role)) {
    return NextResponse.json({ error: "Role tidak valid" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name, phone },
  });

  if (createErr || !created.user) {
    return NextResponse.json({ error: createErr?.message ?? "Gagal membuat akun" }, { status: 400 });
  }

  // trigger handle_new_user sudah membuat profile dengan role default 'customer' — naikkan ke role yang dipilih
  const { error: updateErr } = await adminClient
    .from("profiles")
    .update({ role, phone })
    .eq("id", created.user.id);

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: created.user.id });
}

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id, active } = await req.json();
  const adminClient = createAdminClient();

  const { error } = await adminClient.from("profiles").update({ active }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Tidak diizinkan" }, { status: 403 });

  const { id } = await req.json();
  if (!id) return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  if (id === admin.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  const adminClient = createAdminClient();

  // menghapus user di auth.users otomatis menghapus baris profiles terkait (on delete cascade)
  const { error } = await adminClient.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
