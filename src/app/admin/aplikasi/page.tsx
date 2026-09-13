import ApkUploader from "./ApkUploader";

export default function AplikasiPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-2xl font-bold text-ink">Aplikasi (APK)</h1>
        <p className="text-sm text-ink/60">
          Upload file .apk terbaru supaya pelanggan bisa download aplikasi Sidapore langsung dari website
          (lewat alert "Pasang Aplikasi" di semua halaman, dan link di sini).
        </p>
      </div>
      <ApkUploader />
    </div>
  );
}
