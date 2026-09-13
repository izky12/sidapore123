import { redirect } from "next/navigation";
import { getProfile } from "@/lib/getProfile";
import LogoutButton from "@/components/LogoutButton";
import BackButton from "@/components/BackButton";
import AdminNav from "@/components/AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile || profile.role !== "admin") redirect("/login");

  return (
    <div className="min-h-screen md:flex">
      <aside className="border-b border-teal-100 bg-teal-700 text-white md:min-h-screen md:w-60 md:shrink-0 md:border-b-0">
        <AdminNav />
      </aside>

      <div className="flex-1">
        <header className="flex items-center justify-between border-b border-teal-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex items-center gap-2">
            <BackButton fallbackHref="/admin" />
            <p className="hidden text-sm text-ink/60 sm:block">
              Masuk sebagai <span className="font-medium text-ink">{profile.full_name}</span>
            </p>
          </div>
          <LogoutButton />
        </header>
        <main className="px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
