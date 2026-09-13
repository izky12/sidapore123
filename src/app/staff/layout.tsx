import { redirect } from "next/navigation";
import { getProfile } from "@/lib/getProfile";
import LogoutButton from "@/components/LogoutButton";
import BackButton from "@/components/BackButton";
import { ROLE_LABEL } from "@/lib/types";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (profile.role === "customer") redirect("/");

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-teal-100 bg-white px-4 py-3 sm:px-6 sm:py-4">
        <div className="flex items-center gap-2">
          <BackButton fallbackHref="/staff" />
          <div className="flex items-center gap-2.5">
            <img src="/icons/icon-192.png" alt="Sidapore" className="h-9 w-9 rounded-lg" />
            <div>
              <p className="font-display text-lg font-bold text-teal-600">Sidapore</p>
              <p className="text-xs text-ink/50">
                {profile.full_name} &middot; {ROLE_LABEL[profile.role]}
              </p>
            </div>
          </div>
        </div>
        <LogoutButton />
      </header>
      <main className="mx-auto max-w-5xl px-4 py-5 sm:px-6 sm:py-8">{children}</main>
    </div>
  );
}
