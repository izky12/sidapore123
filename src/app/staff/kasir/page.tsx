import { redirect } from "next/navigation";
import { getProfile } from "@/lib/getProfile";
import KasirForm from "./KasirForm";

export default async function KasirPage() {
  const profile = await getProfile();
  if (!profile || (profile.role !== "staff_depot" && profile.role !== "staff_laundry")) {
    redirect("/staff");
  }

  return <KasirForm role={profile.role} staffId={profile.id} staffName={profile.full_name} />;
}
