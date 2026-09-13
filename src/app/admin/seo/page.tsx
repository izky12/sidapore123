import SeoSettings from "./SeoSettings";

export default function SeoSettingsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Verifikasi SEO (Google)</h1>
      <p className="mt-1 text-sm text-ink/60">
        Tempel kode verifikasi HTML dari Google Search Console. Butuh kunci tambahan untuk menyimpan.
      </p>
      <div className="mt-6 max-w-xl">
        <SeoSettings />
      </div>
    </div>
  );
}
