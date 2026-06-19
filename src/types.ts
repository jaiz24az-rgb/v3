export interface Balance {
  rtTunai: number;
  rtPettyCash: number;
  rtBank: number;
  rombongTunai: number;
  rombongBank: number;
}

export type TransactionType = 'pemasukan' | 'pengeluaran';

export interface LedgerEntry {
  id: string;
  tanggal: string; // Tanggal transaksi keuangan
  deskripsi: string;
  jumlah: number;
  tipe: TransactionType;
  sumberKas: keyof Balance;
  kategori: string;
  petugas: string;
  tanggalInput?: string; // Tanggal input/pencatatan transaksi
  fotoBase64?: string; // Transaction receipt photo
  fotoNamaFile?: string; // Transaction receipt filename
  isCustomRombong?: boolean; // Flag to indicate custom payment
  approvedByAdmin?: boolean; // Approved by admin
  needApproval?: boolean; // Needs admin approval to count
  rombongId?: string; // Links to rombong
  bulan?: string; // Links to billing month
  tahun?: number; // Links to billing year
}

export interface FamilyMember {
  id: string;
  nama: string;
  hubungan: string;
  nik?: string;
  noHape?: string;
}

export interface WargaBill {
  id: string;
  nama: string;
  blok: string;
  noRumah: string;
  noWa?: string; // WhatsApp number for billing
  isDeleted?: boolean;
  statusKeaktifan?: 'aktif' | 'nonaktif' | 'pindah_sementara';
  noKtp?: string; // KTP Number (16 digits)
  noKk?: string;  // KK Number (16 digits)
  alamatKtpAsal?: string; // Original address as shown on KTP
  ktpBase64?: string; // Compressed KTP image Base64 data code
  kkBase64?: string;  // Compressed KK image Base64 data code
  ktpNamaFile?: string; // KTP original file name
  kkNamaFile?: string;  // KK original file name
  fotoBase64?: string; // Profile photo Base64 data code
  fotoNamaFile?: string; // Profile photo original file name
  statusRumah?: 'milik_sendiri' | 'sewa_kontrak' | 'lainnya'; // Status kepemilikan rumah (keluarga vs sewa/kontrak)
  tglAwalSewa?: string; // Tanggal awal kontrak (optional)
  tglAkhirSewa?: string; // Tanggal akhir kontrak (optional)
  isWargaBaru?: boolean; // Flag for new citizen (free bills before placement)
  mulaiBulan?: string; // Starting month for billing
  mulaiTahun?: number; // Starting year for billing
  iuranRT: { 
    bulan: string; 
    lunas: boolean; 
    nominal: number; 
    tahun?: number; 
    tanggalBayar?: string; 
    jamBayar?: string; 
    noCashFlow?: boolean; 
    catatan?: string;
    fotoBase64?: string; // Payment receipt photo Base64
    fotoNamaFile?: string; // Payment receipt filename
    manualKoreksi?: boolean; // User manual correction flag 2024-2026
  }[];
  anggotaKeluarga?: FamilyMember[];
}

export interface RombongBill {
  id: string;
  namaPemilik: string;
  lokasi: string;
  noLapak: string;
  noWa?: string; // WhatsApp number for billing
  isDeleted?: boolean;
  statusKeaktifan?: 'aktif' | 'nonaktif' | 'pindah_sementara';
  fotoBase64?: string; // Rombong photo Base64 data code
  fotoNamaFile?: string; // Rombong photo original file name
  iuranRombong: { 
    bulan: string; 
    lunas: boolean; 
    nominal: number; 
    tahun?: number; 
    tanggalBayar?: string; 
    jamBayar?: string; 
    noCashFlow?: boolean; 
    catatan?: string;
    fotoBase64?: string; // Payment receipt photo Base64
    fotoNamaFile?: string; // Payment receipt filename
    manualKoreksi?: boolean; // User manual correction flag 2024-2026
  }[];
}

export interface AppUser {
  id: string;
  username: string;
  pin: string; // PIN or Password
  role: 'admin' | 'bendahara' | 'warga' | 'rombong' | 'kolektor' | 'sekretaris' | 'audit';
  nama: string;
  wargaId?: string;
  rombongId?: string;
}

export interface OfficialLetter {
  id: string;
  nomorSurat: string; // e.g. 012/RT-08/POPOH/VI/2026
  tanggalSurat: string; // YYYY-MM-DD
  jenisSurat: 'undangan_rapat' | 'undangan_kerja_bakti' | 'undangan_khusus' | 'custom';
  perihal: string;
  penerima: string; // e.g. Bp. Heri, Seluruh Warga RT 08
  keperluan?: string; // used for Surat Pengantar or specific notes
  wargaId?: string; // Optional links to citizen
  createdAt: string;
  createdBy: string; // role or name of creator
}


