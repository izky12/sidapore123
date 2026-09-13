export type UserRole = "admin" | "staff_depot" | "staff_laundry" | "kurir" | "customer";
export type OrderStatus =
  | "baru"
  | "diverifikasi"
  | "diproses"
  | "ditugaskan"
  | "dikirim"
  | "terkirim"
  | "siap_diambil"
  | "selesai"
  | "batal";

export type MetodeAmbil = "dijemput" | "antar_sendiri";
export type BayarSaat = "jemput" | "antar";

export interface LayananLaundry {
  id: string;
  nama: string;
  harga: number | null;
  satuan: string;
  aktif: boolean;
  urutan: number;
  created_at: string;
}
export type LeadJenis = "kos" | "laundry" | "depot";
export type LeadStatus = "baru" | "dihubungi" | "deal" | "batal";

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface WaterOrder {
  id: string;
  customer_id: string | null;
  nama: string;
  no_wa: string;
  lokasi_maps: string;
  jumlah_galon: number;
  catatan: string | null;
  harga: number | null;
  status: OrderStatus;
  assigned_kurir_id: string | null;
  metode_bayar: MetodeBayar | null;
  dibayar: boolean;
  dibayar_at: string | null;
  created_at: string;
}

export type MetodeBayar = "tunai" | "digital";
export type VerifikasiStatus = "menunggu" | "cocok" | "selisih";

export interface LaundryOrder {
  id: string;
  customer_id: string | null;
  nama: string;
  no_wa: string;
  jenis_layanan: string;
  layanan_id: string | null;
  berat_kg: number | null;
  harga: number | null;
  ongkir: number;
  antar_jemput: boolean;
  metode_ambil: MetodeAmbil;
  lokasi_jemput: string | null;
  bayar_saat: BayarSaat | null;
  assigned_kurir_jemput_id: string | null;
  jemput_selesai: boolean;
  via_online: boolean;
  assigned_kurir_id: string | null;
  status: OrderStatus;
  assigned_staff_id: string | null;
  metode_bayar: MetodeBayar | null;
  dibayar: boolean;
  dibayar_at: string | null;
  created_at: string;
}

export interface SetoranKas {
  id: string;
  staff_id: string;
  tanggal: string;
  kas_fisik: number;
  kas_sistem: number | null;
  selisih: number | null;
  catatan: string | null;
  status: VerifikasiStatus;
  catatan_verifikasi: string | null;
  diverifikasi_oleh: string | null;
  diverifikasi_at: string | null;
  created_at: string;
}

export const VERIFIKASI_LABEL: Record<VerifikasiStatus, string> = {
  menunggu: "Menunggu Verifikasi",
  cocok: "Cocok",
  selisih: "Ada Selisih",
};

export interface KosTenant {
  id: string;
  nama: string;
  no_wa: string;
  no_kamar: string;
  room_id: string | null;
  harga_bulanan: number;
  tgl_masuk: string;
  status: "aktif" | "nonaktif";
}

export interface KosPayment {
  id: string;
  tenant_id: string;
  periode: string;
  jumlah: number;
  tgl_bayar: string;
  dicatat_oleh: string | null;
  created_at: string;
  kos_tenants?: { nama: string; no_kamar: string } | null;
}

export type KosRoomStatus = "tersedia" | "terisi" | "maintenance";

export interface KosRoom {
  id: string;
  no_kamar: string;
  tipe: string | null;
  harga_bulanan: number;
  fasilitas: string | null;
  status: KosRoomStatus;
  updated_at: string;
}

export const ROOM_STATUS_LABEL: Record<KosRoomStatus, string> = {
  tersedia: "Tersedia",
  terisi: "Terisi",
  maintenance: "Perbaikan",
};

export interface Transaction {
  id: string;
  sumber: "kos" | "laundry" | "depot" | "lainnya";
  jenis: "masuk" | "keluar";
  jumlah: number;
  deskripsi: string | null;
  tgl: string;
}

export const ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  staff_depot: "Staff Depot",
  staff_laundry: "Staff Laundry",
  kurir: "Kurir",
  customer: "Pelanggan",
};

export const STATUS_LABEL: Record<OrderStatus, string> = {
  baru: "Baru",
  diverifikasi: "Terverifikasi",
  diproses: "Diproses",
  ditugaskan: "Ditugaskan ke Kurir",
  dikirim: "Sedang Diantar",
  terkirim: "Terkirim (Verifikasi Kurir)",
  siap_diambil: "Siap Diambil / Diantar",
  selesai: "Selesai",
  batal: "Dibatalkan",
};

export interface Lead {
  id: string;
  jenis: LeadJenis;
  nama: string;
  no_wa: string;
  alamat: string | null;
  catatan: string | null;
  status: LeadStatus;
  kos_room_id: string | null;
  created_at: string;
  kos_rooms?: { no_kamar: string } | null;
}

export const LEAD_STATUS_LABEL: Record<LeadStatus, string> = {
  baru: "Baru Masuk",
  dihubungi: "Sudah Dihubungi",
  deal: "Deal",
  batal: "Dibatalkan",
};

export interface ServiceLocation {
  id: string;
  kategori: "depot" | "kos" | "laundry";
  nama: string;
  alamat: string;
  maps_link: string | null;
  aktif: boolean;
  created_at: string;
}
