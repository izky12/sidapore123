import StrukSettingsForm from "./StrukSettingsForm";

export default function StrukSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Pengaturan Struk</h1>
        <p className="text-sm text-ink/60">
          Kustomisasi nama toko, alamat, footer, dan lebar kertas untuk struk yang dicetak di kasir Depot, Laundry,
          dan Kos. Pengaturan disimpan di perangkat ini (tidak perlu internet).
        </p>
      </div>
      <StrukSettingsForm />
    </div>
  );
}
