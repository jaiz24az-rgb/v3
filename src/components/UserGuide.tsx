import React, { useState, useRef, useEffect } from 'react';
import { 
  BookOpen, 
  Key, 
  Database, 
  User, 
  Users, 
  CheckCircle, 
  AlertTriangle, 
  Download, 
  Upload, 
  RefreshCw, 
  FileText, 
  Check, 
  Copy, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff,
  HelpCircle,
  Info,
  Printer,
  Wifi,
  Cloud,
  CalendarRange,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { Balance, LedgerEntry, WargaBill, RombongBill, AppUser } from '../types';
import {
  signInWithGoogleForWorkspace,
  logoutWorkspace,
  isWorkspaceConnected,
  uploadBackupToGoogleDrive,
  syncLedgerToGoogleSheets,
  pushEventToGoogleCalendar
} from '../utils/googleWorkspace';
import { getAuth } from 'firebase/auth';

interface UserGuideProps {
  // Financial states & triggers
  kas: Balance;
  updateKas: (newKas: Balance) => void;
  ledger: LedgerEntry[];
  updateLedger: (newLedger: LedgerEntry[]) => void;
  wargaList: WargaBill[];
  updateWargaList: (newWarga: WargaBill[]) => void;
  rombongList: RombongBill[];
  updateRombongList: (newRombong: RombongBill[]) => void;
  
  // Settings & configs
  usersList: AppUser[];
  updateUsersList: (newUsers: AppUser[]) => void;
  blocksList: string[];
  updateBlocksList: (newBlocks: string[]) => void;
  yearsList: number[];
  updateYearsList: (newYears: number[]) => void;
  rateRT: number;
  updateRateRT: (newRate: number) => void;
  rateRombong: number;
  updateRateRombong: (newRate: number) => void;
  rtTitle: string;
  updateRtTitle: (newTitle: string) => void;
  rtAddress: string;
  updateRtAddress: (newAddress: string) => void;
  rtEmail: string;
  updateRtEmail: (newEmail: string) => void;

  // Utilities
  currentUser: AppUser | null;
  onTriggerReset: () => void;
  onClearCache?: () => void;

  // Local Sync Settings
  localSyncEnabled?: boolean;
  updateLocalSyncEnabled?: (val: boolean) => void;
  localServerIp?: string;
  updateLocalServerIp?: (val: string) => void;
  localServerStatus?: 'connected' | 'scanning' | 'error' | 'offline';
  serverDiscoveredIps?: string[];
  localSyncMessage?: string;
  onRetryLocalCheck?: () => void;
}

export default function UserGuide({
  kas, updateKas,
  ledger, updateLedger,
  wargaList, updateWargaList,
  rombongList, updateRombongList,
  usersList, updateUsersList,
  blocksList, updateBlocksList,
  yearsList, updateYearsList,
  rateRT, updateRateRT,
  rateRombong, updateRateRombong,
  rtTitle, updateRtTitle,
  rtAddress, updateRtAddress,
  rtEmail, updateRtEmail,
  currentUser, onTriggerReset, onClearCache,
  localSyncEnabled = true,
  updateLocalSyncEnabled,
  localServerIp = '',
  updateLocalServerIp,
  localServerStatus = 'offline',
  serverDiscoveredIps = [],
  localSyncMessage = '',
  onRetryLocalCheck
}: UserGuideProps) {
  const [activeTab, setActiveTab] = useState<'peran' | 'troubleshoot' | 'backup'>('peran');
  const isAdmin = currentUser?.role === 'admin';
  const effectiveTab = isAdmin ? activeTab : 'peran';
  
  // Role guide drilldown
  const [activeRoleTab, setActiveRoleTab] = useState<'admin' | 'bendahara' | 'kolektor' | 'warga'>('admin');

  // Google Workspace Integration states
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [isConnectingGoogle, setIsConnectingGoogle] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  
  // Google Sync Statuses
  const [sheetsSyncStatus, setSheetsSyncStatus] = useState<{ type: 'idle' | 'success' | 'loading' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [driveSyncStatus, setDriveSyncStatus] = useState<{ type: 'idle' | 'success' | 'loading' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [calendarSyncStatus, setCalendarSyncStatus] = useState<{ type: 'idle' | 'success' | 'loading' | 'error'; message: string }>({ type: 'idle', message: '' });
  
  // Google sheets result url
  const [spreadsheetUrl, setSpreadsheetUrl] = useState<string>('');
  // Google drive result file id
  const [driveFileId, setDriveFileId] = useState<string>('');
  // Google calendar event link
  const [calendarEventLink, setCalendarEventLink] = useState<string>('');

  // Form Google Calendar
  const [calTitle, setCalTitle] = useState('Rencana Rapat Warga RT 08');
  const [calDesc, setCalDesc] = useState('Agenda musyawarah bulanan warga RT 08 Perumahan TAS 3 untuk membahas keamanan dan kas warga.');
  const [calDate, setCalDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [calStart, setCalStart] = useState('08:00');
  const [calEnd, setCalEnd] = useState('10:00');

  // Monitor status koneksi di load pertama
  useEffect(() => {
    const auth = getAuth();
    if (auth.currentUser && isWorkspaceConnected()) {
      setGoogleUser(auth.currentUser);
      setGoogleConnected(true);
    }
  }, []);

  const handleConnectGoogle = async () => {
    setIsConnectingGoogle(true);
    try {
      const res = await signInWithGoogleForWorkspace();
      if (res) {
        setGoogleUser(res.user);
        setGoogleConnected(true);
      }
    } catch (err: any) {
      alert('Gagal menyambungkan ke Google Workspace: ' + (err.message || String(err)));
    } finally {
      setIsConnectingGoogle(false);
    }
  };

  const handleDisconnectGoogle = async () => {
    const isConfirmed = window.confirm('Apakah Anda yakin ingin memutuskan sambungan akun Google dari aplikasi ini?');
    if (!isConfirmed) return;
    try {
      await logoutWorkspace();
      setGoogleUser(null);
      setGoogleConnected(false);
      setSheetsSyncStatus({ type: 'idle', message: '' });
      setDriveSyncStatus({ type: 'idle', message: '' });
      setCalendarSyncStatus({ type: 'idle', message: '' });
      setSpreadsheetUrl('');
      setDriveFileId('');
      setCalendarEventLink('');
    } catch (err: any) {
      alert('Gagal memutuskan sambungan: ' + err.message);
    }
  };

  const handleSyncToSheets = async () => {
    setSheetsSyncStatus({ type: 'loading', message: 'Sedang membuat spreadsheet baru dan mengekspor seluruh pembukuan...' });
    try {
      const res = await syncLedgerToGoogleSheets(ledger, wargaList, rombongList, rtTitle);
      if (res.success && res.spreadsheetUrl) {
        setSpreadsheetUrl(res.spreadsheetUrl);
        setSheetsSyncStatus({ type: 'success', message: 'Berhasil disinkronkan ke Google Sheets!' });
      } else {
        setSheetsSyncStatus({ type: 'error', message: res.error || 'Terjadi kesalahan tidak dikenal.' });
      }
    } catch (err: any) {
      setSheetsSyncStatus({ type: 'error', message: err.message || String(err) });
    }
  };

  const handleBackupToDrive = async () => {
    setDriveSyncStatus({ type: 'loading', message: 'Sedang mengunggah berkas salinan cadangan ke Google Drive Anda...' });
    try {
      const backupData = {
        version: '1.2_RT08',
        timestamp: new Date().toISOString(),
        metadata: {
          rtTitle,
          rtAddress,
          rtEmail,
          rateRT,
          rateRombong
        },
        kas,
        blocksList,
        yearsList,
        usersList,
        wargaList,
        rombongList,
        ledger
      };
      const dateString = new Date().toISOString().split('T')[0];
      const fileName = `backup_kas_rt08_${dateString}.json`;

      const res = await uploadBackupToGoogleDrive(backupData, fileName);
      if (res.success && res.fileId) {
        setDriveFileId(res.fileId);
        setDriveSyncStatus({ type: 'success', message: `Database berhasil dicadangkan ke Google Drive! ID Berkas: ${res.fileId}` });
      } else {
        setDriveSyncStatus({ type: 'error', message: res.error || 'Gagal mencadangkan ke Google Drive.' });
      }
    } catch (err: any) {
      setDriveSyncStatus({ type: 'error', message: err.message || String(err) });
    }
  };

  const handlePushToCalendar = async () => {
    if (!calTitle.trim()) {
      alert('Judul kegiatan Calendar tidak boleh kosong.');
      return;
    }
    setCalendarSyncStatus({ type: 'loading', message: 'Sedang mengagendakan kegiatan ke Google Calendar...' });
    try {
      const res = await pushEventToGoogleCalendar(calTitle, calDesc, calDate, calStart, calEnd);
      if (res.success && res.eventHtmlLink) {
        setCalendarEventLink(res.eventHtmlLink);
        setCalendarSyncStatus({ type: 'success', message: 'Agenda kegiatan berhasil dijadwalkan di Google Calendar!' });
      } else {
        setCalendarSyncStatus({ type: 'error', message: res.error || 'Gagal menambahkan ke Google Calendar.' });
      }
    } catch (err: any) {
      setCalendarSyncStatus({ type: 'error', message: err.message || String(err) });
    }
  };

  // Emergency reset state
  const [inputMasterCode, setInputMasterCode] = useState('');
  const [newAdminPin, setNewAdminPin] = useState('');
  const [showAdminPin, setShowAdminPin] = useState(false);
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');
  const [revealMasterCode, setRevealMasterCode] = useState(false);

  // Backup file inputs state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [restoreStatus, setRestoreStatus] = useState<{ type: 'idle' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });

  // Copy helper
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const triggerCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const [printWarning, setPrintWarning] = useState(false);

  const handlePrintPdf = () => {
    // Check if we are inside an iframe (standard preview mode)
    const isInIframe = window.self !== window.top;
    if (isInIframe) {
      setPrintWarning(true);
    } else {
      try {
        window.print();
      } catch (e) {
        setPrintWarning(true);
      }
    }
  };

  // 1. Generate and download complete Backup JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: '1.2_RT08',
        timestamp: new Date().toISOString(),
        metadata: {
          rtTitle,
          rtAddress,
          rtEmail,
          rateRT,
          rateRombong
        },
        kas,
        blocksList,
        yearsList,
        usersList,
        wargaList,
        rombongList,
        ledger
      };

      const jsonStr = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      const dateString = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup_kas_rt08_${dateString}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      alert('Gagal mengekspor data cadangan: ' + (err as Error).message);
    }
  };

  // 2. Import and reconcile backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const resultStr = event.target?.result as string;
        const data = JSON.parse(resultStr);

        // Verification checks
        if (!data.kas || !data.usersList || (!data.wargaList && !data.rombongList)) {
          throw new Error('Format file cadangan tidak valid. Objek data utama (kas/warga/rombong) tidak ditemukan.');
        }

        // Apply backup states securely
        if (data.kas) updateKas(data.kas);
        if (data.metadata?.rtTitle) updateRtTitle(data.metadata.rtTitle);
        if (data.metadata?.rtAddress) updateRtAddress(data.metadata.rtAddress);
        if (data.metadata?.rtEmail) updateRtEmail(data.metadata.rtEmail);
        if (data.metadata?.rateRT !== undefined) updateRateRT(data.metadata.rateRT);
        if (data.metadata?.rateRombong !== undefined) updateRateRombong(data.metadata.rateRombong);
        
        if (data.blocksList) updateBlocksList(data.blocksList);
        if (data.yearsList) updateYearsList(data.yearsList);
        if (data.usersList) updateUsersList(data.usersList);
        if (data.wargaList) updateWargaList(data.wargaList);
        if (data.rombongList) updateRombongList(data.rombongList);
        if (data.ledger) updateLedger(data.ledger);

        setRestoreStatus({
          type: 'success',
          message: `Berhasil memulihkan ${data.wargaList?.length || 0} warga, ${data.rombongList?.length || 0} lapak rombong, dan ${data.ledger?.length || 0} riwayat transaksi Buku Kas!`
        });
      } catch (err) {
        setRestoreStatus({
          type: 'error',
          message: 'Gagal mengimpor file: ' + (err as Error).message
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (e.target) e.target.value = '';
  };

  // 3. Emergency Admin PIN Recovery Code Handler
  const handleEmergencyAdminRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (inputMasterCode.trim() !== 'RT08_PULIH_DARURAT_2026') {
      setRecoveryError('Kode Keamanan Pemulihan Darurat Salah/Tidak Valid!');
      return;
    }

    if (newAdminPin.trim().length < 4) {
      setRecoveryError('PIN Keamanan Baru harus minimal 4 digit!');
      return;
    }

    // Locate admin user in local list
    const updatedUsers = usersList.map(u => {
      if (u.role === 'admin' || u.username === 'admin') {
        return {
          ...u,
          pin: newAdminPin.trim()
        };
      }
      return u;
    });

    try {
      updateUsersList(updatedUsers);
      setRecoverySuccess('Akses Admin telah dipulihkan! PIN baru untuk akun "admin" berhasil diperbarui menjadi "' + newAdminPin.trim() + '". Harap simpan PIN ini baik-baik.');
      setInputMasterCode('');
      setNewAdminPin('');
    } catch (err) {
      setRecoveryError('Gagal melakukan penulisan pemulihan data: ' + (err as Error).message);
    }
  };

  return (
    <div id="printable-user-guide" className="bg-slate-50 border border-slate-200 rounded-3xl p-5 md:p-8 shadow-xl max-w-5xl mx-auto text-slate-800 animate-in fade-in duration-305">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-5 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-2xl flex items-center justify-center shadow-inner no-print">
            <BookOpen className="w-6 h-6 pointer-events-none" />
          </div>
          <div>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight leading-none print:text-black">Buku Panduan & Data Recovery</h2>
            <p className="text-xs text-slate-500 font-medium mt-1 no-print">Manual pengoperasian sistem, penyelesaian kendala login, dan pengelolaan backup.</p>
            <p className="text-xs text-slate-700 font-bold mt-1 hidden print:block">Sistem Informasi Iuran Kas & Tagihan RT 08 RW 06</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
          <button
            onClick={handlePrintPdf}
            className="no-print bg-cyan-500 hover:bg-cyan-650 text-slate-950 text-[11px] font-black px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-xs border border-cyan-400/20 active:scale-95 animate-pulse"
            title="Cetak panduan ke printer atau PDF"
          >
            <Printer className="w-3.5 h-3.5 text-slate-950" />
            <span>Cetak PDF</span>
          </button>
          
          <div className="bg-emerald-100 border border-emerald-200 text-slate-800 text-[11px] font-bold px-3 py-1.5 rounded-xl font-mono">
            Pembaruan: Mei 2026 (RT 08)
          </div>
        </div>
      </div>

      {/* Main Tab Options */}
      <div className="flex flex-wrap items-center gap-2 mb-6 bg-slate-100 border border-slate-200/80 p-1.5 rounded-2xl no-print">
        <button
          onClick={() => setActiveTab('peran')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
            effectiveTab === 'peran'
              ? 'bg-white text-sky-600 shadow-sm border border-slate-200/50'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Panduan Hak Akses Peran</span>
        </button>

        {isAdmin && (
          <button
            onClick={() => setActiveTab('troubleshoot')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              effectiveTab === 'troubleshoot'
                ? 'bg-white text-sky-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>Troubleshooting & Lupa PIN</span>
          </button>
        )}

        {isAdmin && (
          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-black cursor-pointer transition-all ${
              effectiveTab === 'backup'
                ? 'bg-white text-sky-600 shadow-sm border border-slate-200/50'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Pusat Backup & Restore Data</span>
          </button>
        )}
      </div>

      {/* CONDITIONAL RENDERING OF THE TABS */}
      
      {/* 1. HAK AKSES PERAN TAB */}
      <div className={`space-y-6 animate-in fade-in duration-300 ${effectiveTab === 'peran' ? 'block' : 'hidden print:block'}`}>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 bg-slate-200/60 p-1 rounded-xl no-print border border-slate-300/40">
            {['admin', 'bendahara', 'sekretaris', 'kolektor', 'warga'].map((role) => (
              <button
                key={role}
                onClick={() => setActiveRoleTab(role as any)}
                className={`py-2 px-2 rounded-lg text-[10px] sm:text-xs font-extrabold capitalize cursor-pointer transition truncate ${
                  activeRoleTab === role
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {role === 'admin' ? '👑 Admin' : role === 'bendahara' ? '💼 Bendahara' : role === 'sekretaris' ? '📝 Sekretaris' : role === 'kolektor' ? '🎒 Kolektor' : '🏡 Warga & Lapak'}
              </button>
            ))}
          </div>

          <div className="bg-white border border-slate-250 p-5 rounded-2xl shadow-xs min-h-[300px]">
            <div className={`space-y-4 ${activeRoleTab === 'admin' ? 'block' : 'hidden print:block'}`}>
                <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <Unlock className="w-4 h-4" />
                  <span>Hak Otoritas & Tanggung Jawab: Administrator / Ketua RT</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Peran ini ditujukan untuk **Ketua RT 08** selaku pengambil kebijakan tertinggi. Memiliki kewenangan tak terbatas dalam memodifikasi struktur, nilai iuran, dan data seluruh keuangan perumahan.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-slate-800 block">✓ Modul Utama Admin:</strong>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed">
                      <li>Mengatur Nama, Alamat, &amp; Email Surat di Kepala Surat Kop RT.</li>
                      <li>Mengubah Nominal standard iuran bulanan Warga dan iuran Sewa Rombong Kuliner.</li>
                      <li>Menambah, mengedit, ataupun **MENGHAPUS** akun pengurus (Bendahara/Kolektor).</li>
                      <li>Melakukan tindakan pengosongan menyeluruh Buku Kas (Reset Mutasi Kas).</li>
                    </ul>
                  </div>
                  <div className="bg-amber-50 border border-amber-200/60 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-slate-800 block">☢️ Panduan Keamanan Admin:</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Satu-satunya akun yang tidak dapat dihapus adalah akun admin bawaan (`admin`). Jagalah PIN keamanan akun ini demi kerahasiaan kas warga. Pengurus dapat mereset PIN admin melalu form pemulihan darurat di tab troubleshoot halaman ini apabila terblokir.
                    </p>
                  </div>
                </div>
              </div>

            <div className={`space-y-4 ${activeRoleTab === 'bendahara' ? 'block' : 'hidden print:block'}`}>
                <div className="flex items-center gap-2 text-sky-700 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 animate-pulse text-sky-600" />
                  <span>Hak Otoritas & Tanggung Jawab: Bendahara Utama</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Peran ini dirancang untuk **Bendahara RT 08**. Berperan penuh atas pemutakhiran mutasi harian, pembayaran belanja operasional wilayah, pencatatan iuran ruko/lapak, serta validasi kas setoran.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-slate-800 block">✓ Modul Utama Bendahara:</strong>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed">
                      <li>Mencatat pengeluaran uang secara real-time di form Buku Kas (Ledger).</li>
                      <li>Membuat koreksi mutasi jika terjadi salah input nominal.</li>
                      <li>Melakukan audit audit verifikasi di **Buku Kolektor** untuk mencocokkan jumlah setoran dana tunai kolektif dengan kenyataan fisik uang.</li>
                      <li>Memindahkan saldo antarsektor (Contoh: Menyetor saldo RT Tunai fisik ke RT Bank).</li>
                    </ul>
                  </div>
                  <div className="bg-emerald-50 border border-emerald-250/60 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-slate-800 block">💡 Tips Rekonsiliasi Kas:</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Sebelum menyetujui penyerahan uang tunai yang diinput oleh kolektor, hitung fisik uang di depan kolektor secara langsung. Gunakan stempel tombol hijau **"Verifikasi"** pada Buku Kolektor untuk menandai transaksi tersebut sudah dicocokkan.
                    </p>
                  </div>
                </div>
              </div>

            <div className={`space-y-4 ${activeRoleTab === 'sekretaris' ? 'block' : 'hidden print:block'}`}>
                <div className="flex items-center gap-2 text-teal-700 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4 text-teal-600" />
                  <span>Hak Otoritas & Tanggung Jawab: Sekretaris RT</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Peran ini khusus dirancang untuk **Sekretaris RT 08**. Diberikan otorisasi tinggi dalam mengurus pendaftaran kependudukan warga, pencetakan berkas, serta pengunggahan arsip surat resmi seperti KK dan KTP warga.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                     <strong className="text-slate-800 block">✓ Modul Utama Sekretaris:</strong>
                     <ul className="list-disc list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed">
                       <li>Mengedit biodata warga, nomor WhatsApp, nomor KTP (NIK), dan nomor KK.</li>
                       <li>Mengunggah (upload) serta mengunduh scan berkas dokumen KK / KTP secara digital.</li>
                       <li>Mencetak laporan registrasi lengkap kependudukan (Daftar Registry Warga) ke kertas atau PDF.</li>
                       <li>Mengekspor dossier profil warga individu menjadi dokumen arsip resmi.</li>
                     </ul>
                  </div>
                  <div className="bg-rose-50 border border-rose-200/60 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-rose-800 block">✖️ Pembatasan Keuangan (Batas Otoritas):</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Sekretaris **TIDAK** diperkenankan mengakses Buku Kas RT, melihat rekonsiliasi Buku Kolektor, memodifikasi mutasi, mengubah tarif acuan iuran, ataupun melakukan pelunasan iuran bulanan. Hal ini demi keamanan dan transparansi tata kelola kas yang terpisah.
                    </p>
                  </div>
                </div>
              </div>

            <div className={`space-y-4 ${activeRoleTab === 'kolektor' ? 'block' : 'hidden print:block'}`}>
                <div className="flex items-center gap-2 text-amber-700 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4" />
                  <span>Hak Otoritas & Tanggung Jawab: Kolektor Iuran</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Peran ini diperuntukkan bagi **Kolektor Iuran RT 08** dan **Kolektor Rombong Kuliner**. Bertugas melakukan penagihan bulanan dari rumah ke rumah atau lapak ke lapak, lalu melunasi iuran tersebut di sistem.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-slate-800 block">✓ Modul Utama Kolektor:</strong>
                    <ul className="list-disc list-inside space-y-1.5 text-slate-600 font-medium leading-relaxed">
                      <li>Menekan kotak centang bulan pada tabel tagihan warga untuk mengubah statusnya menjadi **LUNAS**.</li>
                      <li>Memilih metode pembayaran penagihan (tunai atau transfer bank).</li>
                      <li>Melacak kepemilikan jumlah uang tunai fisik yang masih di dompet melalui nilai saldo **"Sisa Tunai Kolektor"**.</li>
                      <li>Mengirimkan form permohonan serah terima uang fisik ke bendahara di menu Buku Kolektor.</li>
                    </ul>
                  </div>
                  <div className="bg-indigo-50 border border-indigo-200 p-3.5 rounded-xl space-y-2 text-xs">
                    <strong className="text-slate-800 block">⚠️ Perhatian Skema Pencatatan:</strong>
                    <p className="text-slate-600 font-medium leading-relaxed">
                      Saat kolektor melunasi iuran, saldo digital sistem langsung bertambah ke `rtTunai`/`rombongTunai`. Oleh sebab itu, form penarikan tunai kolektor ke bendahara **TIDAK** menambah saldo kas utama lagi, melainkan hanya mencatatkan perpindahan tempat fisik uang dari tangan kolektor ke bendahara utama.
                    </p>
                  </div>
                </div>
              </div>

            <div className={`space-y-4 ${activeRoleTab === 'warga' ? 'block' : 'hidden print:block'}`}>
                <div className="flex items-center gap-2 text-rose-700 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <Info className="w-4 h-4" />
                  <span>Hak Akses Layanan Mandiri: Warga RT 08 / Penyewa Rombong</span>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Peran ini disediakan untuk **Warga Sipil / Pemilik Rombong**. Semua warga bebas menilik status iurannya masing-masing secara transparan tanpa perlu login admin atau mengubah data kas pengurus lain.
                </p>
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3 text-xs leading-relaxed">
                  <p className="text-slate-600 font-semibold font-sans">
                    ✨ <strong className="text-slate-800">Menjaga Privasi Data Warga:</strong> Pengurus RT dapat membuatkan akun mandiri spesifik warga (Contoh: Username: `a4_10`, Role: `warga`, Terikat pada Warga: `Bapak Anto Blok A4 No.10`). Warga tersebut hanya dapat melacak halaman tab **Tagihan Saya** miliknya, dan tombol interaksi edit / tambah transaksi akan otomatis tersembunyi.
                  </p>
                  <p className="text-slate-500 font-medium">
                    Warga dapat menyaring riwayat berdasarkan tahun (misalnya: 2024, 2025, 2026), mengunduh struk kuitansi PDF digital, serta mencocokkan pembayaran transfernya.
                  </p>
                </div>
              </div>
            </div>

            {/* Informasi Historis Iuran Sudah Terbayar */}
            {isAdmin && (
              <div className="bg-emerald-50 border border-emerald-200/60 p-5 rounded-2xl flex items-start gap-3.5 text-emerald-950 text-xs shadow-xs">
                <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-xl flex items-center justify-center shrink-0 font-bold text-lg border border-emerald-200/50">
                  💡
                </div>
                <div className="space-y-1.5 leading-relaxed">
                  <strong className="text-emerald-900 font-extrabold text-sm block">Ketetapan Histori Iuran RT (Januari 2024 s/d Mei 2026)</strong>
                  <p className="text-emerald-805 font-medium font-sans">
                    Sesuai dengan ketetapan pengurus RT 08, <strong>seluruh iuran bulanan warga maupun sewa lapak rombong kuliner dari bulan Januari 2024 sampai dengan bulan Mei 2026 sudah terbayar semuanya secara lunas (100%)</strong>.
                  </p>
                  <p className="text-emerald-700 font-medium font-sans text-[11px]">
                    Sistem secara otomatis mengaktifkan status lunas berbayar (<span className="font-extrabold text-emerald-600">✓ Lunas</span>) di lembar buku tagihan historis dan kartu kendali warga untuk rentang waktu tersebut demi kebersihan pembukuan kas serta ketepatan akumulasi tunggakan baru mulai Juni 2026 ke depan.
                  </p>
                </div>
              </div>
            )}
          </div>

      {/* 2. TROUBLESHOOTING & RESET PIN TAB */}
      <div className={`space-y-6 animate-in fade-in duration-300 ${isAdmin && effectiveTab === 'troubleshoot' ? 'block' : 'hidden'}`}>
          <div className="bg-amber-50 border border-amber-200/80 p-4 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
            <div className="space-y-1 leading-relaxed">
              <strong className="text-amber-950 font-bold">⚠️ PROSEDUR DARURAT: Lupa PIN / Password Admin</strong>
              <p className="text-amber-800 font-medium">
                Jika Administrator / Ketua RT lupa PIN-nya, Anda dilarang keras mencoba menghapus database. Gunakan formula pemulihan di bawah ini untuk mereset sandi keamanan Admin secara langsung.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
            {/* Form reset PIN Admin darurat */}
            <form onSubmit={handleEmergencyAdminRecovery} className="md:col-span-7 bg-white border border-slate-250 p-5 rounded-2xl shadow-xs space-y-4 flex flex-col justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2 mb-3">
                  <Lock className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>Alat Pemulihan PIN Admin Utama</span>
                </h3>
                
                <p className="text-xs text-slate-500 leading-relaxed mb-4">
                  Alat ini mendeteksi akun dengan ID `admin` (Ketua RT) dan memperbarui PIN login secara langsung di dalam browser database lokal &amp; cloud. 
                </p>

                {recoveryError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs font-semibold mb-3">
                    ⚠️ {recoveryError}
                  </div>
                )}

                {recoverySuccess && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold mb-4 leading-relaxed">
                    🎉 {recoverySuccess}
                  </div>
                )}

                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                      Masukan Kode Pemulihan Darurat RT 08:
                    </label>
                    <input
                      type="password"
                      required
                      placeholder="Masukkan Kode Keamanan Recovery"
                      value={inputMasterCode}
                      onChange={(e) => setInputMasterCode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-red-500 rounded-xl px-3 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-red-500 focus:outline-none"
                    />
                    <span className="text-[10px] text-slate-400 mt-1 block leading-tight font-medium">
                      (Kode keunikan keamanan master bypass untuk memverifikasi keaslian Ketua RT).
                    </span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-widest font-mono mb-1.5">
                      Tentukan PIN Baru Pengurus Admin:
                    </label>
                    <div className="relative">
                      <input
                        type={showAdminPin ? 'text' : 'password'}
                        required
                        placeholder="Contoh: 123456"
                        value={newAdminPin}
                        onChange={(e) => setNewAdminPin(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-emerald-500 rounded-xl pl-3 pr-10 py-2 text-xs font-mono font-bold focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPin(!showAdminPin)}
                        className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 transition"
                      >
                        {showAdminPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 border border-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer transition shadow-md mt-4 flex items-center justify-center gap-1.5"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Otorisasi Reset & Perbarui PIN Admin</span>
              </button>
            </form>

            {/* Kode Pemulihan Master Box Info */}
            <div className="md:col-span-5 bg-slate-900 text-slate-200 border border-slate-950 p-5 rounded-2xl flex flex-col justify-between">
              <div className="space-y-4">
                <span className="bg-red-500/10 text-red-400 border border-red-500/10 px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-extrabold font-mono inline-block">
                  KUNCI KESEPAKATAN PENGURUS
                </span>
                <h4 className="font-extrabold text-sm text-white font-sans">Sandi Bypass Pemulihan (Kertas Rahasia)</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed font-medium">
                  Bila Anda tidak sengaja melupakan sandi, pergunakan kode unik pemulihan rahasia yang telah disepakati oleh seluruh rukun warga di bawah ini:
                </p>

                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between font-mono text-xs text-sky-400 font-bold">
                  <span className="tracking-wider select-all">
                    {revealMasterCode ? 'RT08_PULIH_DARURAT_2026' : '•••••••••••••_PULIH_••••••••'}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setRevealMasterCode(!revealMasterCode)}
                      className="p-1 text-slate-400 hover:text-slate-200 transition cursor-pointer"
                      title={revealMasterCode ? "Sembunyikan Kode" : "Tampilkan Kode"}
                    >
                      {revealMasterCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerCopy('RT08_PULIH_DARURAT_2026', 'master_code')}
                      className="p-1 text-slate-400 hover:text-sky-300 transition cursor-pointer"
                      title="Salin Kode Pemulihan"
                    >
                      {copiedKey === 'master_code' ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/60 p-3 rounded-xl text-[10px] text-slate-400 leading-relaxed mt-4">
                💡 **Tips Pengurus Lain**: Bendahara atau Kolektor yang lupa PIN tidak memerlukan kode ini. Mereka cukup meminta ketua RT masuk sebagai Admin, lalu menekan tombol **"Kelola Pengurus RT" &gt; Atur Ulang PIN** pada baris akun mereka untuk mereset sandi secara instan.
              </div>
            </div>
          </div>

          {/* FAQ kendala */}
          <div className="bg-white border border-slate-250 p-5 rounded-2xl space-y-4 text-xs font-sans">
            <h4 className="font-extrabold text-slate-950 text-sm flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
              <span>Pertanyaan Sering Ditanyakan (FAQ) Seputar Kendala Sistem</span>
            </h4>

            <div className="space-y-3.5 leading-relaxed">
              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold">1. Bagaimana jika data iuran di HP Kolektor tidak sinkron dengan Laptop Bendahara?</strong>
                <p className="text-slate-600 font-medium font-sans">
                  Pastikan kedua perangkat terkoneksi ke Internet. Sistem ini menggunakan sinkronisasi database cloud real-time. Jika salah satu perangkat menampilkan status "Penyimpanan Lokal (Offline)" pada pojok kanan atas, artinya jaringan internet sedang terputus, dan data akan otomatis terunggah saat jaringan terhubung kembali.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold">2. Saya melakukan salah klik lunas, bagaimana membatalkannya?</strong>
                <p className="text-slate-600 font-medium font-sans">
                  Gunakan tab "Pencarian Warga" di tab Daftar Tagihan. Cari baris warga yang bersangkutan, lalu Anda dapat membuka detailnya dan menekan menu **"Koreksi Manual"** (hanya diizinkan untuk Admin) guna menyesuaikan status kelunasan dan sumber kas tanpa melipatgandakan mutasi.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold">3. Bagaimana jika Admin juga melupakan atau kehilangan Kode Pemulihan Darurat?</strong>
                <p className="text-slate-600 font-medium font-sans">
                  Apabila Ketua RT atau Pengurus Admin kehilangan atau melupakan Kode Kunci Pemulihan Darurat (<code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[11px] font-semibold">RT08_PULIH_DARURAT_2026</code>), langkah terakhir yang dapat ditempuh adalah memeriksa secara langsung kode sumber aplikasi (pada berkas pengkondisian keamanan halaman login atau buku panduan ini), menghubungi tim IT Developer pengembang yang mengelola sistem, atau mengimpor file backup database lama (.json) yang masih menyimpan kredensial PIN sebelumnya yang Anda ingat.
                </p>
              </div>

              <div className="space-y-1">
                <strong className="text-slate-900 block font-bold">4. Bagaimana cara mencadangkan (backup) dan memulihkan (restore) database .json?</strong>
                <p className="text-slate-600 font-medium font-sans">
                  Untuk mengamankan atau memindahkan data pengurus, warga, dan seluruh riwayat kas ke perangkat lain, ikuti panduan berikut:
                  <span className="block mt-1"></span>
                  • <strong className="text-slate-900">Untuk Backup:</strong> Pindah ke tab <strong className="text-slate-900">"Backup &amp; Restore Data"</strong> (tab ketiga di menu navigasi atas halaman panduan ini). Kemudian klik tombol berwarna biru <strong className="text-sky-605 font-bold">"Ekspor &amp; Unduh Database RT 08"</strong>. Browser Anda akan langsung mengunduh file berformat <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px] font-bold">.json</code>. Simpan file ini dengan aman di Google Drive, Flashdisk, atau kirimkan ke grup WhatsApp pengurus.
                  <span className="block mt-1"></span>
                  • <strong className="text-slate-900">Untuk Restore:</strong> Buka tab <strong className="text-slate-900">"Backup &amp; Restore Data"</strong> pada perangkat baru. Klik tombol berwarna hitam <strong className="text-slate-800 font-bold">"Unggah &amp; Timpa Data Sekarang"</strong>, lalu pilih file <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono text-[11px] font-bold">.json</code> cadangan yang telah Anda unduh sebelumnya. Seluruh riwayat transaksi, nominal kas, daftar warga, dan PIN pengurus akan kembali ke kondisi saat backup dibuat.
                </p>
              </div>
            </div>
          </div>
        </div>

      {/* 3. PUSAT BACKUP & RESTORE DATA TAB */}
      <div className={`space-y-6 animate-in fade-in duration-300 ${isAdmin && effectiveTab === 'backup' ? 'block' : 'hidden'}`}>
          <div className="bg-sky-50 border border-sky-100 p-4 rounded-2xl flex items-start gap-3 text-sky-900 text-xs">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-sky-600" />
            <div className="space-y-1 leading-relaxed">
              <strong className="text-sky-950 font-bold">Mengapa Backup Data Rutin Itu Penting?</strong>
              <p className="text-sky-800 font-medium">
                Sistem ini menyimpan semua pencatatan secara offline di browser HP/Laptop Anda dan di Cloud Database (jika terhubung). Melakukan ekspor data cadangan berkala menjamin kas warga terlindungi dari kerusakan gawai, terhapusnya cache browser, atau kendala server secara permanen.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
            {/* Download section */}
            <div className="bg-white border border-slate-250 p-5 rounded-2xl flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <Download className="w-4 h-4 text-sky-600" />
                  <span>1. Unduh File Cadangan (.json)</span>
                </div>
                <p className="text-slate-500 leading-relaxed font-sans font-medium">
                  Unduh seluruh database saat ini (iuran, blok, kas, mutasi, akun pengurus) ke dalam satu file file cadangan. Simpan file ini di flashdisk, email, atau kirimkan via WhatsApp ke pengurus RT lainnya.
                </p>
              </div>

              <button
                type="button"
                onClick={handleExportBackup}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-2.5 rounded-xl cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Download className="w-4 h-4" />
                <span>Ekspor &amp; Unduh Database RT 08</span>
              </button>
            </div>

            {/* Upload section */}
            <div className="bg-white border border-slate-250 p-5 rounded-2xl flex flex-col justify-between text-xs space-y-4">
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 text-slate-900 font-extrabold text-sm border-b border-slate-100 pb-2">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>2. Unggah &amp; Pulihkan Database</span>
                </div>
                <p className="text-slate-500 leading-relaxed font-sans font-medium">
                  Menimpa data sistem saat ini dengan file `.json` cadangan yang sudah disimpan sebelumnya. Cocok digunakan saat mengganti laptop pimpinan bendahara atau pemulihan darurat pasca ganti HP.
                </p>

                {restoreStatus.type === 'success' && (
                  <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold rounded-xl">
                    ✓ {restoreStatus.message}
                  </div>
                )}

                {restoreStatus.type === 'error' && (
                  <div className="p-2.5 bg-rose-50 border border-rose-250 text-rose-700 text-[11px] font-semibold rounded-xl">
                    ⚠️ {restoreStatus.message}
                  </div>
                )}
              </div>

              <div>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                  ref={fileInputRef}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2.5 rounded-xl cursor-pointer transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <Upload className="w-4 h-4" />
                  <span>Unggah &amp; Timpa Data Sekarang</span>
                </button>
              </div>
            </div>
          </div>

          {/* 2. INTEGRASI GOOGLE WORKSPACE (CLOUD SINKRONISASI) */}
          <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-1">
              <Cloud className="w-5 h-5 text-sky-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm font-sans">2. Integrasi Google Cloud Workspace (Google Drive, Sheets &amp; Calendar)</h3>
                <p className="text-[11px] text-slate-500 font-medium">Cadangkan keuangan ke Drive, ekspor mutasi ke Sheets, dan buat agenda RT di Google Calendar.</p>
              </div>
            </div>

            {/* Status Koneksi Akun Google */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider block font-mono">Status Koneksi Google</span>
                {googleConnected ? (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <p className="text-slate-800 font-black text-xs">
                      Terhubung ({googleUser?.email || 'Akun Google Pengurus'})
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-450 bg-rose-500"></span>
                    <p className="text-slate-500 font-black text-xs">Akun Google Belum Terhubung</p>
                  </div>
                )}
                <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">
                  Hubungkan akun sekali untuk membuka akses sinkronisasi data cloud real-time dengan hak akses resmi Anda.
                </p>
              </div>

              <div className="w-full md:w-auto">
                {googleConnected ? (
                  <button
                    type="button"
                    onClick={handleDisconnectGoogle}
                    className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-black py-2 px-4 rounded-xl cursor-pointer transition text-[11px] active:scale-95 flex items-center justify-center gap-1"
                  >
                    Putuskan Akun Google
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={isConnectingGoogle}
                    onClick={handleConnectGoogle}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 px-4 rounded-xl cursor-pointer transition text-[11px] active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-55"
                  >
                    {isConnectingGoogle ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Mengaitkan Akun...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" width="100%" height="100%">
                          <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.277 1.341-1.08 2.477-2.287 3.245l3.52 2.73C22.42 18.54 24 15.13 24 11.24a12 12 0 0 0-.25-2.24H12.24z"/>
                          <path fill="#4285F4" d="M12.24 24c3.24 0 5.95-1.08 7.93-2.91l-3.52-2.73c-.98.66-2.23 1.06-3.66 1.06-2.82 0-5.2-1.91-6.05-4.48L2.94 18.2C4.93 21.64 8.54 24 12.24 24z"/>
                          <path fill="#FBBC05" d="M6.19 14.94a7.16 7.16 0 0 1 0-4.52l-3.52-2.73a11.96 11.96 0 0 0 0 10l3.52-2.75z"/>
                          <path fill="#34A853" d="M12.24 4.79c1.76 0 3.34.6 4.58 1.79l3.43-3.41C18.17 1.25 15.48 0 12.24 0 8.54 0 4.93 2.36 2.94 5.8l3.52 2.73c.85-2.57 3.23-4.48 6.05-4.48z"/>
                        </svg>
                        <span>Sambungkan Akun Google</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Opsi Sinkronisasi jika sudah terhubung */}
            {googleConnected ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
                
                {/* SHEETS SYNC BLOCK */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Google Sheets</span>
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Ekspor Laporan Keuangan
                    </h4>
                    <p className="text-[10.5px] text-slate-500 leading-normal font-sans font-medium">
                      Buat spreadsheet berkas pelunasan iuran warga, iuran rombong, dan mutasi kas ledger RT.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    {sheetsSyncStatus.type !== 'idle' && (
                      <div className={`p-2 rounded-lg text-[10.5px] font-bold ${
                        sheetsSyncStatus.type === 'loading' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                        sheetsSyncStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-250' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {sheetsSyncStatus.message}
                      </div>
                    )}

                    {spreadsheetUrl && (
                      <a
                        href={spreadsheetUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition text-[10.5px]"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Buka Spreadsheet Baru</span>
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={sheetsSyncStatus.type === 'loading'}
                      onClick={handleSyncToSheets}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg cursor-pointer transition text-[10.5px] active:scale-95 shadow-xs"
                    >
                      {sheetsSyncStatus.type === 'loading' ? 'Sedang Menyinkronkan...' : 'Buat & Sinkronkan Sheets'}
                    </button>
                  </div>
                </div>

                {/* DRIVE BACKUP BLOCK */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-xs">
                  <div className="space-y-1.5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Google Drive</span>
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      Cadangan Otomatis Cloud
                    </h4>
                    <p className="text-[10.5px] text-slate-500 leading-normal font-sans font-medium">
                      Simpan berkas salinan cadangan `.json` lengkap RT 08 Anda langsung di Google Drive secara aman.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {driveSyncStatus.type !== 'idle' && (
                      <div className={`p-2 rounded-lg text-[10.5px] font-bold ${
                        driveSyncStatus.type === 'loading' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                        driveSyncStatus.type === 'success' ? 'bg-sky-50 text-sky-800 border border-sky-250' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {driveSyncStatus.message}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={driveSyncStatus.type === 'loading'}
                      onClick={handleBackupToDrive}
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 rounded-lg cursor-pointer transition text-[10.5px] active:scale-95 shadow-xs"
                    >
                      {driveSyncStatus.type === 'loading' ? 'Sedang Mengunggah...' : 'Unggah Cadangan ke Drive'}
                    </button>
                  </div>
                </div>

                {/* CALENDAR AGENDA BLOCK */}
                <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col justify-between space-y-3 shadow-xs">
                  <div className="space-y-1.5 font-sans">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Google Calendar</span>
                    <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      Penjadwalan Agenda RT
                    </h4>
                    <p className="text-[10.5px] text-slate-500 leading-normal font-medium">
                      Agenda rapat pengurus, kerja bakti, penagihan keliling, atau kegiatan rapat warga.
                    </p>

                    {/* Form agenda mini */}
                    <div className="pt-2 space-y-2 border-t border-slate-100">
                      <div>
                        <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Judul Kegiatan:</label>
                        <input
                          type="text"
                          value={calTitle}
                          onChange={(e) => setCalTitle(e.target.value)}
                          placeholder="Nama rapat/sidang/kegiatan..."
                          className="w-full bg-slate-50 border border-slate-300 p-1.5 rounded font-sans text-[10px] font-bold hover:bg-slate-100 focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-1.5">
                        <div>
                          <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Tanggal:</label>
                          <input
                            type="date"
                            value={calDate}
                            onChange={(e) => setCalDate(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-300 p-1.5 rounded font-sans text-[10px] focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Jam Mulai - Selesai:</label>
                          <div className="flex gap-1 items-center">
                            <input
                              type="text"
                              value={calStart}
                              onChange={(e) => setCalStart(e.target.value)}
                              placeholder="08:00"
                              className="w-1/2 bg-slate-50 border border-slate-300 p-1 rounded font-mono text-[10px] text-center focus:outline-none"
                            />
                            <span className="text-[9px] text-slate-400">-</span>
                            <input
                              type="text"
                              value={calEnd}
                              onChange={(e) => setCalEnd(e.target.value)}
                              placeholder="10:00"
                              className="w-1/2 bg-slate-50 border border-slate-300 p-1 rounded font-mono text-[10px] text-center focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {calendarSyncStatus.type !== 'idle' && (
                      <div className={`p-2 rounded-lg text-[10.5px] font-bold leading-normal ${
                        calendarSyncStatus.type === 'loading' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                        calendarSyncStatus.type === 'success' ? 'bg-indigo-50 text-indigo-805 text-indigo-700 border border-indigo-250' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {calendarSyncStatus.message}
                      </div>
                    )}

                    {calendarEventLink && (
                      <a
                        href={calendarEventLink}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition text-[10.5px]"
                      >
                        <Calendar className="w-3.5 h-3.5 animate-bounce" />
                        <span>Buka Agenda di Calendar</span>
                      </a>
                    )}

                    <button
                      type="button"
                      disabled={calendarSyncStatus.type === 'loading'}
                      onClick={handlePushToCalendar}
                      className="w-full bg-indigo-500 hover:bg-indigo-650 text-white font-bold py-1.5 rounded-lg cursor-pointer transition text-[10.5px] active:scale-95 shadow-xs"
                    >
                      {calendarSyncStatus.type === 'loading' ? 'Sedang Menjadwalkan...' : 'Jadwalkan di Calendar'}
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200/60 text-amber-800 font-sans">
                <p className="text-[11px] font-bold text-amber-850">
                  ⚠️ Layanan Sinkronisasi Cloud Tersedia setelah Login:
                </p>
                <p className="text-[10px] text-amber-700 leading-normal mt-1 font-medium select-none">
                  Untuk mengaktifkan sinkronisasi cadangan Google Drive, pelaporan bulanan otomatis Google Sheets, dan koordinasi agenda warga Google Calendar, silakan gunakan tombol "Sambungkan Akun Google" di atas terlebih dahulu.
                </p>
              </div>
            )}
          </div>

          {/* 3. SETELAN SINKRONISASI TRANSMISI WI-FI LOKAL */}
          <div className="bg-slate-50 border border-slate-250 p-5 rounded-2xl space-y-4 text-xs">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-1">
              <Wifi className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">3. Sinkronisasi Penyimpanan Bersama (Jaringan Wi-Fi Lokal / Tanpa Internet)</h3>
                <p className="text-[11px] text-slate-500 font-medium">Hubungkan beberapa HP / Laptop sekaligus melalui satu gawai utama sebagai Pusat Penyimpanan.</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed font-sans">
              Apabila pengurus ingin menggunakan satu database bersama tanpa bergantung pada cloud internet, salah satu laptop atau HP dapat dijalankan sebagai <strong>Pusat Server (Host)</strong>. Gawai pengurus lainnya cukup menghubungkannya lewat Wi-Fi yang sama tanpa perlu kuota internet.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
              {/* Petunjuk Server IP */}
              <div className="bg-emerald-50/55 border border-emerald-100 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-1.5">
                  <span className="font-extrabold text-emerald-950 text-[12px] block">📢 Alamat Akses Server Saat Ini:</span>
                  <p className="text-emerald-800 leading-relaxed text-[11px]">
                    Jika perangkat ini adalah pusat server utama yang Anda jalankan, beritahukan Alamat IP lokal di bawah ini ke pengurus lain agar mereka dapat mengakses dan mengedit data yang sama secara langsung:
                  </p>
                </div>

                <div className="space-y-1">
                  {serverDiscoveredIps.length > 0 ? (
                    serverDiscoveredIps.map((ip, idx) => (
                      <div key={idx} className="flex items-center justify-between gap-2 bg-white border border-emerald-200/60 p-2 rounded-lg font-mono text-[11px] font-bold text-emerald-805">
                        <span className="text-emerald-800 select-all">http://{ip}:3000</span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(`http://${ip}:3000`);
                            alert(`Alamat IP http://${ip}:3000 berhasil disalin ke clipboard!`);
                          }}
                          className="text-[9px] bg-emerald-100 hover:bg-emerald-200 px-1.5 py-0.5 rounded text-emerald-700 cursor-pointer"
                        >
                          Salin
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-slate-500 text-center font-medium italic">
                      IP lokal tidak terdeteksi. Hubungkan perangkat Anda ke jaringan Wi-Fi yang sama terlebih dahulu.
                    </div>
                  )}
                </div>
              </div>

              {/* Form Input Alamat IP Server Wi-Fi */}
              <div className="bg-white border border-slate-250 p-4 rounded-xl flex flex-col justify-between space-y-3">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="font-extrabold text-slate-800 text-[11px] flex items-center gap-1">
                      <span>Aktifkan Sinkronisasi Jaringan Lokal</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => updateLocalSyncEnabled && updateLocalSyncEnabled(!localSyncEnabled)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        localSyncEnabled ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    >
                      <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                        localSyncEnabled ? 'translate-x-4' : 'translate-x-0'
                      }`} />
                    </button>
                  </div>

                  {localSyncEnabled && (
                    <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                      <span className="text-[11px] font-extrabold text-slate-700 block">Alamat IP Server Utama (Host):</span>
                      <div className="flex gap-1">
                        <input
                          type="text"
                          value={localServerIp}
                          onChange={(e) => updateLocalServerIp && updateLocalServerIp(e.target.value)}
                          placeholder="Contoh: http://192.168.1.50:3000"
                          className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-lg font-mono text-[11px] font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 leading-normal font-medium">
                        Masukkan IP PC/HP Server utama untuk mengakses database bersama secara real-time.
                      </p>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[11px]">
                    <span className="font-bold text-slate-500">Status Koneksi Wi-Fi:</span>
                    {localServerStatus === 'connected' ? (
                      <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-705 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-555 bg-emerald-500 animate-pulse"></span>
                        Terhubung
                      </span>
                    ) : localServerStatus === 'scanning' ? (
                      <span className="flex items-center gap-1 bg-sky-50 border border-sky-100 text-sky-700 text-[10px] px-2 py-0.5 rounded-full font-bold animate-pulse">
                        Mengecek...
                      </span>
                    ) : localServerStatus === 'error' ? (
                      <span className="flex items-center gap-1 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Gagal (Menyimpan di HP saja)
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 bg-slate-100 border border-slate-200 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        Mati (Lokal HP Saja)
                      </span>
                    )}
                  </div>

                  {localSyncEnabled && (
                    <button
                      type="button"
                      onClick={onRetryLocalCheck}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 font-bold py-1.5 rounded-lg cursor-pointer transition text-[11px] flex items-center justify-center gap-1 active:scale-95"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${localServerStatus === 'scanning' ? 'animate-spin' : ''}`} />
                      <span>Hubungkan Ulang &amp; Tarik Data Server</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats of local storage backup capability */}
          <div className="bg-slate-100 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans">
            <div className="flex items-center gap-2 text-slate-700 font-medium">
              <Info className="w-4 h-4 shrink-0 text-slate-500" />
              <span>Status Objek Aktif Sistem saat ini:</span>
              <span className="font-bold font-mono bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-slate-800">
                {wargaList.length} Warga | {rombongList.length} Lapak | {ledger.length} Transaksi Ledger
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={onClearCache}
                className="text-sky-650 bg-sky-50 hover:bg-sky-100 border border-sky-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition text-[11px] active:scale-95 flex items-center gap-1"
                title="Bersihkan data penyangga sementara di gawai ini, lalu muat ulang otomatis untuk menarik data segar paling baru dari server aktif."
              >
                <RefreshCw className="w-3 h-3 text-sky-600 animate-spin-once" />
                <span>Segarkan Cache &amp; Data</span>
              </button>
              {isAdmin && (
                <>
                  <span className="text-slate-300 select-none">|</span>
                  <button
                    type="button"
                    onClick={onTriggerReset}
                    className="text-rose-600 bg-rose-50 hover:bg-rose-100/60 border border-rose-200 px-3 py-1.5 rounded-xl font-bold cursor-pointer transition text-[11px] active:scale-95"
                  >
                    Kosongkan Pembukuan RT (Reset)
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

      {/* Print Warning Modal for iFrame */}
      {printWarning && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 no-print text-left">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl space-y-6 relative animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setPrintWarning(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 transition text-lg p-1 hover:bg-slate-100 rounded-full w-8 h-8 flex items-center justify-center font-bold"
              title="Tutup"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200/50">
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              </div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Cetak PDF Terkendala Fitur iFrame</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-sans font-medium">
                Sistem mendeteksi bahwa aplikasi sedang dijalankan dalam <strong className="text-amber-700">Frame Pratinjau (iFrame)</strong>. Browser melarang pembukaan kotak dialog cetak secara langsung demi alasan keamanan.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-2xl space-y-3 text-xs text-slate-600 font-sans font-medium leading-relaxed">
              <strong className="text-slate-800 font-extrabold block">Solusi Sangat Mudah:</strong>
              <div className="space-y-2.5">
                <div className="flex gap-2">
                  <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px] font-black shrink-0">1</span>
                  <p>
                    Klik ikon <strong className="text-slate-900">"Buka di Tab Baru" (Open in New Tab)</strong> berbentuk tanda panah meluncur keluar kotak di <strong className="text-slate-900">kanan atas layar pratinjau Anda</strong>.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px] font-black shrink-0">2</span>
                  <p>
                    Di tab baru tersebut, masuk kembali ke halaman <strong className="text-slate-900">"Buku Panduan"</strong> ini.
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="w-5 h-5 bg-sky-100 text-sky-700 rounded-full flex items-center justify-center text-[11px] font-black shrink-0">3</span>
                  <p>
                    Tekan tombol <strong className="text-cyan-600 font-bold">"Cetak PDF"</strong> kembali. Kotak simpan PDF akan muncul secara otomatis dan lancar!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setPrintWarning(false)}
                className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-2.5 rounded-xl text-xs font-black transition cursor-pointer active:scale-95 text-center shadow-xs"
              >
                Dipahami, Saya Buka di Tab Baru
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
