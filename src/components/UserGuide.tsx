import React, { useState, useRef, useEffect } from 'react'; // Verified line endings
import { 
  isSupabaseConfigured, 
  supabase, 
  saveAppUser, 
  saveLedgerEntry, 
  saveWargaBill, 
  saveRombongBill, 
  saveOfficialLetter, 
  upsertGeneralSettings 
} from '../supabase';
import { isFirebaseConfigured } from '../firebase';
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
  Calendar,
  Github
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

  // Supabase migration state
  const [migrationStatus, setMigrationStatus] = useState<{ type: 'idle' | 'loading' | 'success' | 'error'; message: string }>({ type: 'idle', message: '' });
  const [migrationProgress, setMigrationProgress] = useState(0);

  const handleMigrateToSupabase = async () => {
    if (!isSupabaseConfigured || !supabase) {
      setMigrationStatus({ type: 'error', message: 'Koneksi Supabase belum terkonfigurasi. Selesaikan Langkah 3 terlebih dahulu.' });
      return;
    }

    setMigrationStatus({ type: 'loading', message: 'Menyiapkan proses migrasi data dari penyimpanan lokal...' });
    setMigrationProgress(5);

    try {
      // 1. Migrate settings
      setMigrationStatus({ type: 'loading', message: 'Memigrasikan Pengaturan Umum & Nilai Kas...' });
      await upsertGeneralSettings({
        kas,
        blocksList,
        yearsList,
        rateRT,
        rateRombong,
        rtTitle,
        rtAddress,
        rtEmail,
      });
      setMigrationProgress(20);

      // 2. Migrate users
      setMigrationStatus({ type: 'loading', message: `Memigrasikan Akun Pengurus (${usersList.length} akun)...` });
      for (let i = 0; i < usersList.length; i++) {
        await saveAppUser(usersList[i]);
      }
      setMigrationProgress(40);

      // 3. Migrate warga bills
      setMigrationStatus({ type: 'loading', message: `Memigrasikan Pembukuan Iuran Warga (${wargaList.length} warga)...` });
      for (let i = 0; i < wargaList.length; i++) {
        await saveWargaBill(wargaList[i]);
      }
      setMigrationProgress(65);

      // 4. Migrate rombong bills
      setMigrationStatus({ type: 'loading', message: `Memigrasikan Buku Iuran Rombong Kuliner (${rombongList.length} lapak)...` });
      for (let i = 0; i < rombongList.length; i++) {
        await saveRombongBill(rombongList[i]);
      }
      setMigrationProgress(80);

      // 5. Migrate ledger entries (buku kas)
      setMigrationStatus({ type: 'loading', message: `Memigrasikan Riwayat Keuangan/Mutasi Kas RT (${ledger.length} transaksi)...` });
      for (let i = 0; i < ledger.length; i++) {
        await saveLedgerEntry(ledger[i]);
      }
      setMigrationProgress(95);

      // 6. Migrate letters
      const localLettersList = localStorage.getItem('perumtas_rt08_official_letters');
      if (localLettersList) {
        try {
          const parsedLetters = JSON.parse(localLettersList);
          if (Array.isArray(parsedLetters) && parsedLetters.length > 0) {
            setMigrationStatus({ type: 'loading', message: `Memigrasikan Surat Undangan Resmi (${parsedLetters.length} berkas)...` });
            for (let i = 0; i < parsedLetters.length; i++) {
              await saveOfficialLetter(parsedLetters[i]);
            }
          }
        } catch (err) {
          console.warn('Gagal membaca/migrasi surat resmi offline:', err);
        }
      }

      setMigrationProgress(100);
      setMigrationStatus({ 
        type: 'success', 
        message: 'Keren! Migrasi 100% Berhasil! Seluruh data iuran, lapak rombong, ledger mutasi kas, dan akun pengurus telah diunggah dan disimpan ke server Supabase Cloud Anda. Silakan muat ulang (refresh) halaman browser untuk mengaktifkan sinkronisasi otomatis.' 
      });
    } catch (err) {
      console.error(err);
      setMigrationStatus({ 
        type: 'error', 
        message: 'Gagal melakukan migrasi data: ' + (err instanceof Error ? err.message : String(err)) 
      });
    }
  };
  
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

        {/* Supabase integration removed as it's fully connected to Firebase Cloud */}
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
                      Saat kolektor melunasi iuran, saldo digital sistem langsung bertambah ke `rtPettyCash` (Kas Kecil)/`rombongTunai`. Oleh sebab itu, form penarikan tunai kolektor ke bendahara **TIDAK** menambah saldo kas utama lagi, melainkan hanya mencatatkan perpindahan tempat fisik uang dari tangan kolektor ke bendahara utama.
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
        
        {/* Banner Penjelasan Utama */}
        <div className="bg-gradient-to-r from-emerald-50 to-sky-50 border border-emerald-150 p-4.5 rounded-2xl flex items-start gap-3.5 text-slate-800 text-xs shadow-xs font-sans">
          <CheckCircle className="w-5 h-5 shrink-0 mt-0.5 text-emerald-600 animate-bounce" />
          <div className="space-y-1 leading-relaxed">
            <strong className="text-emerald-950 font-extrabold text-[12.5px] block">
              🟢 SISTEM SINKRONISASI REAL-TIME CLOUD AKTIF OTOMATIS
            </strong>
            <p className="text-slate-650 font-medium leading-relaxed">
              Kabar gembira! Aplikasi Buku Kas RT 08 Anda saat ini <strong className="text-emerald-805">telah terhubung secara penuh ke database cloud Firebase bawaan yang aman</strong>. Anda dan pengurus lainnya tidak perlu melakukan konfigurasi apa pun secara manual!
            </p>
            <p className="text-slate-650 font-medium leading-relaxed pt-1">
              Hanya dengan memastikan masing-masing HP pengurus <strong className="text-indigo-805">terhubung ke jaringan Internet (baik lewat wifi rumah, wifi umum, maupun paket data seluler)</strong>, seluruh input data iuran warga, rincian pengeluaran mutasi kas, lapak kuliner, dan akun petugas akan langsung terekam dan saling tersinkronisasi satu sama lain secara nyata (real-time) saat itu juga!
            </p>
          </div>
        </div>

          {/* Jalur Penyimpanan yang Jelas */}
        <div className="max-w-4xl mx-auto space-y-5 font-sans text-xs">
            <div className="flex items-center gap-2 border-b border-indigo-200 pb-2.5">
              <span className="bg-emerald-100 text-emerald-700 p-1.5 rounded-lg">
                <Cloud className="w-4 h-4" />
              </span>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm font-sans uppercase tracking-tight">💾 JALUR DATA CLOUD & PENYIMPANAN RT</h3>
                 <p className="text-[10.5px] text-slate-500 font-medium">Sistem utama secara konstan menggunakan sinkronisasi database cloud otomatis.</p>
              </div>
            </div>

            {/* Sub-Tile 1: Cloud Storage Utama (Firebase Cloud) */}
            <div className="bg-gradient-to-br from-emerald-50/40 to-white border border-emerald-250 p-4.5 rounded-2xl space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold uppercase font-mono border border-emerald-200">SISTEM UTAMA</span>
                  <h4 className="font-extrabold text-slate-900 text-xs">Cloud Database Firebase (Bawaan)</h4>
                </div>
                <span className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[9.5px] px-2 py-0.5 rounded-full font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  Terhubung &amp; Sinkron
                </span>
              </div>
              <p className="text-slate-650 text-[10.5px] leading-relaxed font-sans font-medium">
                Setiap kali pengurus mengisi iuran di HP mereka ke website, data akan langsung dikirim ke server cloud dan dipancarkan ke HP pengurus lain yang sedang membuka halaman yang sama. <strong className="text-emerald-800">Tidak ada pengisian kode, credential, login AWS/Google, atau token database rumit yang perlu Anda pusingkan.</strong> Cukup buka website dengan internet aktif!
              </p>
            </div>

            {/* Sub-Tile 2: Cadangan Google Cloud Workspace (Google Drive & Sheets) */}
            <div className="bg-slate-50/70 border border-slate-250 p-4.5 rounded-2xl space-y-4 font-sans shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                <Cloud className="w-4 h-4 text-sky-600" />
                <h4 className="font-extrabold text-slate-900 text-xs">Integrasi Google Workspace Backup &amp; Laporan</h4>
              </div>

              {googleConnected ? (
                <div className="grid grid-cols-1 gap-4 animate-in fade-in duration-300">
                  {/* Sheets Sync Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Google Sheets Laporan</span>
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Salin Kas RT ke Spreadsheet
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">
                        Buat spreadsheet pelunasan iuran warga, iuran lapak, dan ledger RT.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {sheetsSyncStatus.type !== 'idle' && (
                        <div className={`p-2 rounded-lg text-[10px] font-bold ${
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
                          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold py-2 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition text-[10px] text-center"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Membuka Spreadsheet Baru</span>
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={sheetsSyncStatus.type === 'loading'}
                        onClick={handleSyncToSheets}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl cursor-pointer transition text-[10px] shadow-sm disabled:opacity-55 active:scale-95 duration-100"
                      >
                        {sheetsSyncStatus.type === 'loading' ? 'Sedang Menyalin...' : 'Mencadangkan &amp; Ekspor ke Sheets'}
                      </button>
                    </div>
                  </div>

                  {/* Drive Backup Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs font-sans">
                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Google Drive Backup</span>
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                        Simpan Cadangan Sistem di Drive
                      </h5>
                      <p className="text-[10px] text-slate-505 leading-normal font-sans font-medium">
                        Unggah salinan cadangan berkas RT lengkap langsung ke dalam folder akun Google Drive pengurus.
                      </p>
                    </div>

                    <div className="space-y-2">
                      {driveSyncStatus.type !== 'idle' && (
                        <div className={`p-2 rounded-lg text-[10px] font-bold ${
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
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl cursor-pointer transition text-[10px] shadow-sm disabled:opacity-55 active:scale-95 duration-100"
                      >
                        {driveSyncStatus.type === 'loading' ? 'Sedang Mengunggah...' : 'Mencadangkan ke Google Drive'}
                      </button>
                    </div>
                  </div>

                  {/* Calendar Agenda Card */}
                  <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex flex-col justify-between gap-3 shadow-xs font-sans">
                    <div className="space-y-1 font-sans">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider font-mono">Google Calendar</span>
                      <h5 className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-indigo-555 bg-indigo-500"></span>
                        Penjadwalan Agenda RT
                      </h5>
                      <p className="text-[10px] text-slate-500 leading-normal font-medium">
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
                            <label className="text-[9.5px] font-bold text-slate-600 block mb-0.5">Jam:</label>
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

                    <div className="space-y-2 font-sans">
                      {calendarSyncStatus.type !== 'idle' && (
                        <div className={`p-2 rounded-lg text-[10px] font-bold leading-normal ${
                          calendarSyncStatus.type === 'loading' ? 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse' :
                          calendarSyncStatus.type === 'success' ? 'bg-indigo-50 text-indigo-700 border border-indigo-250' :
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
                          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-1.5 px-3 rounded-lg flex items-center justify-center gap-1 cursor-pointer transition text-[10px] text-center"
                        >
                          <Calendar className="w-3.5 h-3.5 animate-bounce" />
                          <span>Buka Agenda di Calendar</span>
                        </a>
                      )}

                      <button
                        type="button"
                        disabled={calendarSyncStatus.type === 'loading'}
                        onClick={handlePushToCalendar}
                        className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2 rounded-xl cursor-pointer transition text-[10px] shadow-sm disabled:opacity-55 active:scale-95 duration-100"
                      >
                        {calendarSyncStatus.type === 'loading' ? 'Sedang Menjadwalkan...' : 'Jadwalkan di Calendar'}
                      </button>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200/60 text-amber-805 font-sans">
                  <p className="text-[11px] font-bold text-amber-850">
                    ⚠️ Layanan Sinkronisasi Cloud Tersedia setelah Login:
                  </p>
                  <p className="text-[10px] text-amber-750 leading-normal mt-1 font-medium select-none">
                    Untuk mengaktifkan sinkronisasi cadangan Google Drive, pelaporan bulanan otomatis Google Sheets, dan koordinasi agenda warga Google Calendar, silakan gunakan tombol "Sambungkan Akun Google" di atas terlebih dahulu.
                  </p>
                </div>
              )}
            </div>

            {/* Sub-Tile 3: Penyimpanan Darurat Manual (.json File Backup) */}
            <div className="bg-white border border-slate-205 p-4.5 rounded-2xl space-y-4 font-sans shadow-xs">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                <FileText className="w-4 h-4 text-slate-600" />
                <h4 className="font-extrabold text-slate-900 text-xs">Penyimpanan Manual: Backup Berkas Database (.JSON)</h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Download panel */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between gap-3">
                  <div className="space-y-1">
                    <span className="font-extrabold text-[11px] text-slate-800 block">Ekspor Database (.json)</span>
                    <p className="text-[10px] text-slate-500 leading-normal font-sans font-medium">
                      Unduh seluruh isi pembukuan, data iuran, lapak kuliner, dan mutasi kas ledger RT 08 ke HP/Laptop Anda saat ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportBackup}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-3 rounded-lg cursor-pointer transition text-[10px] shadow-xs flex items-center justify-center gap-1.5 active:scale-95 duration-100"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh Cadangan .Json</span>
                  </button>
                </div>

                {/* Upload panel */}
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl flex flex-col justify-between gap-3 font-sans">
                  <div className="space-y-1">
                    <span className="font-extrabold text-[11px] text-slate-800 block">Impor Database (.json)</span>
                    <p className="text-[10px] text-slate-505 leading-normal font-sans font-medium">
                      Ganti seluruh data saat ini menggunakan berkas cadangan `.json`. Bermanfaat saat ganti HP / serah-terima kepengurusan.
                    </p>
                  </div>

                  <div>
                    {restoreStatus.type === 'success' && (
                      <div className="p-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] font-bold rounded-lg mb-1.5">
                        ✓ {restoreStatus.message}
                      </div>
                    )}
                    {restoreStatus.type === 'error' && (
                      <div className="p-2 bg-rose-50 border border-rose-250 text-rose-750 text-[10px] font-bold rounded-lg mb-1.5 font-sans">
                        ⚠️ {restoreStatus.message}
                      </div>
                    )}
                    
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
                      className="w-full bg-slate-900 hover:bg-slate-800 text-white font-extrabold py-2 px-3 rounded-lg cursor-pointer transition text-[10px] shadow-xs flex items-center justify-center gap-1.5 active:scale-95 duration-100"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>Impor Berkas .Json</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Info Tambahan & Troubleshooting Google + Supabase */}
            <div className="bg-slate-100 border border-slate-250 p-4.5 rounded-xl space-y-3.5 mt-2 text-slate-800 font-sans">
              <div className="flex items-start gap-2.5">
                <Info className="w-4 h-4 text-sky-650 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-extrabold text-[11.5px] text-slate-900 leading-tight">
                    Mengapa Tombol Google Bisa Terhubung di AI Studio tapi "Gagal/Tidak Beraksi" di Vercel?
                  </h4>
                  <p className="text-[10.5px] text-slate-650 leading-relaxed font-medium">
                    Ini adalah perilaku keamanan standar dari Google & Firebase. Lingkungan AI Studio dinilai sebagai kawasan developer aman, sedangkan situs publik Anda di Vercel (misal: <code className="bg-white/80 px-1 py-0.5 rounded text-[9.5px] font-mono text-indigo-900">buku-kas08.vercel.app</code>) belum terdaftar secara sah sebagai domain tepercaya Anda.
                  </p>
                </div>
              </div>

              <div className="border-t border-slate-200 pt-3 pl-6.5 space-y-2 text-[10.5px] text-slate-700 font-medium leading-relaxed">
                <span className="font-extrabold text-[11px] text-slate-900 block mb-1">🔧 3 Langkah Mudah Mengaktifkan Google Login di Website Live (Vercel):</span>
                <ol className="list-decimal pl-4.5 space-y-1.5 list-outside">
                  <li>
                    <strong className="text-slate-900">Salin Alamat Vercel Anda:</strong> Dapatkan alamat domain website Anda di Vercel (seperti <code className="bg-white/80 px-1 py-0.5 rounded font-mono text-[9.5px]">nama-rt-kamu.vercel.app</code>, rapikan tanpa awalan <code className="text-slate-400">https://</code>).
                  </li>
                  <li>
                    <strong className="text-slate-900">Tambahkan Authorized Domains di Firebase:</strong> Buka <a href="https://console.firebase.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline">Firebase Console</a> &rarr; Masuk ke menu <strong className="text-slate-805">Authentication</strong> &rarr; Tab <strong className="text-slate-805">Settings</strong> &rarr; Pilih <strong className="text-slate-805">Authorized Domains</strong> &rarr; Klik <strong className="text-slate-900">"Add Domain"</strong>, lalu masukkan alamat domain Vercel Anda tersebut dan simpan.
                  </li>
                  <li>
                    <strong className="text-slate-900">Otorisasi OAuth di Google Cloud Console:</strong> Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline">Google Cloud Console</a> &rarr; Pilih proyek Anda &rarr; Pilih menu <strong className="text-slate-805">APIs & Services &gt; Credentials</strong> &rarr; Cari dan edit <strong className="text-slate-805">ID Klien OAuth 2.0</strong>, lalu di bagian bawah tepatnya di <strong className="text-slate-900">"Authorized redirect URIs"</strong> tambahkan tautan rujukan arah: <code className="bg-white px-1 py-0.5 rounded text-indigo-900 font-mono text-[9.5px]">https://DOMAIN_VERCEL_ANDA/__/auth/handler</code>.
                  </li>
                </ol>
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
          </div>

      {/* 4. INTEGRASI SUPABASE CLOUD TAB */}
      <div className={`space-y-6 animate-in fade-in duration-300 ${isAdmin && effectiveTab === 'supabase' ? 'block' : 'hidden'}`}>
        
        {/* Supabase description removed */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Step 1 & 2 */}
            <div className="bg-white border border-slate-250 p-5 rounded-2xl space-y-4 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex gap-2.5">
                  <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">1</span>
                  <div className="space-y-1">
                    <strong className="text-slate-900 block text-xs font-bold leading-snug font-sans">Buat Akun &amp; Project Supabase Baru</strong>
                    <p className="text-[11px] text-slate-500 leading-normal font-sans font-medium">
                      Buka situs resmi <a href="https://supabase.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 font-bold hover:underline inline-flex items-center gap-0.5">https://supabase.com <ExternalLink className="w-3 h-3" /></a>. Daftar akun gratis dan buat satu Proyek (Project) baru bernama e.g., <code className="bg-slate-150 px-1 py-0.5 rounded font-mono text-[10.5px]">Buku Kas RT 08</code>. Isi password database Anda dengan aman.
                    </p>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="flex gap-2.5">
                  <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">2</span>
                  <div className="space-y-1.5 w-full">
                    <strong className="text-slate-900 block text-xs font-bold leading-snug font-sans font-bold">Jalankan Inisialisasi SQL Schema</strong>
                    <p className="text-[11px] text-slate-500 leading-normal font-sans font-medium">
                      Pindah ke tab <strong className="text-slate-800">"SQL Editor"</strong> pada panel sebelah kiri di Dashboard Supabase Anda. Klik <strong className="text-slate-805">"New Query"</strong>, salin script inisialisasi tabel lengkap di bawah ini, rekatkan, lalu klik tombol <strong className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.5 rounded">Run / Play</strong> untuk membuat struktur tabel dan kebijakan keamanan (RLS Policy) otomatis.
                    </p>

                    <div className="relative border border-slate-200 rounded-xl overflow-hidden mt-3 max-h-56 overflow-y-auto bg-slate-950 p-3.5 text-slate-200">
                      <button
                        type="button"
                        onClick={() => {
                          const sqlCode = `-- 1. Settings Table
CREATE TABLE IF NOT EXISTS public.settings (
    id TEXT PRIMARY KEY DEFAULT 'general',
    kas JSONB,
    blocks_list JSONB,
    years_list JSONB,
    rate_rt NUMERIC,
    rate_rombong NUMERIC,
    rt_title TEXT,
    rt_address TEXT,
    rt_email TEXT,
    app_name TEXT,
    app_logo TEXT,
    label_warga_singular TEXT,
    label_warga_plural TEXT,
    label_rombong_singular TEXT,
    label_rombong_plural TEXT
);

-- 2. App Users Table
CREATE TABLE IF NOT EXISTS public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT,
    pin TEXT,
    role TEXT,
    nama TEXT,
    warga_id TEXT,
    rombong_id TEXT
);

-- 3. Ledger Entries Table
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id TEXT PRIMARY KEY,
    tanggal TEXT,
    deskripsi TEXT,
    jumlah NUMERIC,
    tipe TEXT,
    sumber_kas TEXT,
    kategori TEXT,
    petugas TEXT,
    foto_base64 TEXT,
    foto_nama_file TEXT
);

-- 4. Warga Bills Table
CREATE TABLE IF NOT EXISTS public.warga_bills (
    id TEXT PRIMARY KEY,
    nama TEXT,
    blok TEXT,
    no_rumah TEXT,
    no_wa TEXT,
    is_deleted BOOLEAN DEFAULT false,
    no_ktp TEXT,
    no_kk TEXT,
    alamat_ktp_asal TEXT,
    ktp_base64 TEXT,
    kk_base64 TEXT,
    ktp_nama_file TEXT,
    kk_nama_file TEXT,
    foto_base64 TEXT,
    foto_nama_file TEXT,
    iuran_rt JSONB,
    anggota_keluarga JSONB
);

-- 5. Rombong Bills Table
CREATE TABLE IF NOT EXISTS public.rombong_bills (
    id TEXT PRIMARY KEY,
    nama_pemilik TEXT,
    lokasi TEXT,
    no_lapak TEXT,
    no_wa TEXT,
    is_deleted BOOLEAN DEFAULT false,
    foto_base64 TEXT,
    foto_nama_file TEXT,
    iuran_rombong JSONB
);

-- 6. Official Letters Table
CREATE TABLE IF NOT EXISTS public.official_letters (
    id TEXT PRIMARY KEY,
    nomor_surat TEXT,
    tanggal_surat TEXT,
    jenis_surat TEXT,
    perihal TEXT,
    penerima TEXT,
    keperluan TEXT,
    warga_id TEXT,
    created_at_str TEXT,
    created_by TEXT
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.warga_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rombong_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.official_letters ENABLE ROW LEVEL SECURITY;

-- CREATE ALLOW ALL ANONYMOUS POLICIES (PERMISSIVE ACCESS FOR EASY DEPLOYMENT)
CREATE POLICY "Allow settings select" ON public.settings FOR SELECT USING (true);
CREATE POLICY "Allow settings insert" ON public.settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow settings update" ON public.settings FOR UPDATE USING (true);
CREATE POLICY "Allow settings delete" ON public.settings FOR DELETE USING (true);

CREATE POLICY "Allow users select" ON public.app_users FOR SELECT USING (true);
CREATE POLICY "Allow users insert" ON public.app_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow users update" ON public.app_users FOR UPDATE USING (true);
CREATE POLICY "Allow users delete" ON public.app_users FOR DELETE USING (true);

CREATE POLICY "Allow ledger select" ON public.ledger_entries FOR SELECT USING (true);
CREATE POLICY "Allow ledger insert" ON public.ledger_entries FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow ledger update" ON public.ledger_entries FOR UPDATE USING (true);
CREATE POLICY "Allow ledger delete" ON public.ledger_entries FOR DELETE USING (true);

CREATE POLICY "Allow warga select" ON public.warga_bills FOR SELECT USING (true);
CREATE POLICY "Allow warga insert" ON public.warga_bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow warga update" ON public.warga_bills FOR UPDATE USING (true);
CREATE POLICY "Allow warga delete" ON public.warga_bills FOR DELETE USING (true);

CREATE POLICY "Allow rombong select" ON public.rombong_bills FOR SELECT USING (true);
CREATE POLICY "Allow rombong insert" ON public.rombong_bills FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow rombong update" ON public.rombong_bills FOR UPDATE USING (true);
CREATE POLICY "Allow rombong delete" ON public.rombong_bills FOR DELETE USING (true);

CREATE POLICY "Allow letters select" ON public.official_letters FOR SELECT USING (true);
CREATE POLICY "Allow letters insert" ON public.official_letters FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow letters update" ON public.official_letters FOR UPDATE USING (true);
CREATE POLICY "Allow letters delete" ON public.official_letters FOR DELETE USING (true);`;
                          
                          navigator.clipboard.writeText(sqlCode);
                          setCopiedKey('supabase-sql');
                          setTimeout(() => setCopiedKey(null), 2000);
                        }}
                        className="absolute top-2 right-2 text-white bg-slate-800 hover:bg-slate-700 hover:text-white text-[10px] px-2.5 py-1.5 rounded-lg font-bold border border-slate-750 cursor-pointer transition active:scale-95 flex items-center gap-1 shadow-sm"
                      >
                        {copiedKey === 'supabase-sql' ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Tersalin!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-400" />
                            <span>Salin SQL Instan</span>
                          </>
                        )}
                      </button>
                      <pre className="text-[9.5px] text-slate-350 font-mono select-all">
{`-- SQL PEMBUATAN TABEL RT 08
CREATE TABLE public.settings (
    id TEXT PRIMARY KEY DEFAULT 'general',
    kas JSONB,
    blocks_list JSONB,
    years_list JSONB,
    rate_rt NUMERIC,
    rate_rombong NUMERIC,
    rt_title TEXT,
    rt_address TEXT,
    rt_email TEXT
);

CREATE TABLE public.app_users (
    id TEXT PRIMARY KEY,
    username TEXT,
    pin TEXT,
    role TEXT,
    nama TEXT,
    warga_id TEXT,
    rombong_id TEXT
);

CREATE TABLE public.ledger_entries (
    id TEXT PRIMARY KEY,
    tanggal TEXT,
    deskripsi TEXT,
    jumlah NUMERIC,
    tipe TEXT,
    sumber_kas TEXT,
    kategori TEXT,
    petugas TEXT,
    foto_base64 TEXT,
    foto_nama_file TEXT
);

CREATE TABLE public.warga_bills (
    id TEXT PRIMARY KEY,
    nama TEXT,
    blok TEXT,
    no_rumah TEXT,
    no_wa TEXT,
    is_deleted BOOLEAN,
    no_ktp TEXT,
    no_kk TEXT,
    alamat_ktp_asal TEXT,
    ktp_base64 TEXT,
    kk_base64 TEXT,
    iuran_rt JSONB,
    anggota_keluarga JSONB
);`}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 & Migration Client */}
            <div className="bg-white border border-slate-250 p-5 rounded-2xl flex flex-col justify-between space-y-4">
              <div className="space-y-4">
                <div className="flex gap-2.5">
                  <span className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">3</span>
                  <div className="space-y-1.5 w-full">
                    <strong className="text-slate-900 block text-xs font-bold leading-snug font-sans font-bold">Masukkan Kredensial URL &amp; Anon Key</strong>
                    <p className="text-[11px] text-slate-500 leading-normal font-mono font-medium font-sans">
                      Salin nilai <strong className="text-slate-805">Project URL</strong> dan <strong className="text-slate-805">API Key Anon</strong> dari tab <strong className="text-slate-800 font-semibold">Project Settings &gt; API</strong> di dashboard Supabase Anda. Rekatkan nilai-nilai tersebut ke panel pengaturan rahasia atau file <code className="bg-slate-150 px-1 py-0.5 rounded font-mono text-[10.5px]">.env</code> aplikasi:
                    </p>

                    <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl font-mono text-[10.5px] text-slate-700 leading-relaxed space-y-1.5">
                      <div>
                        <span className="text-slate-400"># Masukkan URL Server Supabase Anda</span>
                        <div className="font-semibold text-slate-800">VITE_SUPABASE_URL="https://[proyek-anda].supabase.co"</div>
                      </div>
                      <div className="border-t border-slate-100 pt-1.5">
                        <span className="text-slate-400"># Masukkan Kunci Rahasia Publik Anon</span>
                        <div className="font-semibold text-slate-800 truncate">VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpX..."</div>
                      </div>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-xs font-black shrink-0">4</span>
                    <strong className="text-slate-900 text-xs font-bold font-sans">Pindahkan Sisa Data/Historis (Migrasi 1-Klik)</strong>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal font-sans font-medium pl-8">
                    Sekali Anda telah mengisi kredensial pada Langkah 3, status sinkronisasi di atas akan berubah menjadi <strong className="text-emerald-700 font-bold">"Terkoneksi"</strong>. Klik tombol pemindah data di bawah ini untuk langsung memindahkan seluruh data warga, transaksi keuangan, dan iuran saat ini dari memori browser lokal langsung ke database cloud Supabase baru Anda.
                  </p>

                  <div className="pl-8 pt-1">
                    {migrationStatus.type === 'loading' ? (
                      <div className="space-y-2.5 border border-slate-150 rounded-xl p-3.5 bg-slate-50">
                        <div className="flex items-center justify-between text-xs font-bold text-sky-850">
                          <span className="flex items-center gap-1.5 font-sans">
                            <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                            {migrationStatus.message}
                          </span>
                          <span className="font-mono">{migrationProgress}%</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            style={{ width: `${migrationProgress}%` }} 
                            className="bg-sky-500 h-full transition-all duration-300"
                          />
                        </div>
                      </div>
                    ) : migrationStatus.type === 'success' ? (
                      <div className="bg-emerald-50 border border-emerald-250 p-4 rounded-xl space-y-2 text-emerald-850 font-sans">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 shrink-0 text-emerald-100/10 text-emerald-600 mt-0.5" />
                          <div className="text-xs font-semibold leading-relaxed">
                            {migrationStatus.message}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => window.location.reload()}
                          className="text-[11px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3 text-white" />
                          <span>Muat Ulang Halaman</span>
                        </button>
                      </div>
                    ) : migrationStatus.type === 'error' ? (
                      <div className="bg-rose-50 border border-rose-250 p-4 rounded-xl space-y-2 text-rose-850 font-sans">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                          <div className="text-xs font-semibold leading-relaxed">
                            {migrationStatus.message}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleMigrateToSupabase}
                          className="text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 px-3.5 py-1.5 rounded-lg shadow-sm transition active:scale-95 cursor-pointer"
                        >
                          Coba Lagi Migrasi
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={!isSupabaseConfigured}
                        onClick={handleMigrateToSupabase}
                        className={`w-full py-3.5 rounded-xl font-extrabold text-xs transition duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2 border active:scale-95 ${
                          isSupabaseConfigured
                            ? 'bg-gradient-to-r from-emerald-500 to-teal-600 border-emerald-450 hover:brightness-110 text-white'
                            : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        <Cloud className="w-4 h-4 shrink-0" />
                        <span>Pindahkan Seluruh Data Lokal Ke Supabase Sekarang</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Panduan Deployment Terpadu */}
          <div className="bg-slate-50 border border-slate-200 p-6 rounded-2xl space-y-6 mt-8">
            <div className="border-b border-slate-200 pb-3">
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base font-sans flex items-center gap-2">
                <span className="p-1.5 bg-gradient-to-r from-sky-500 to-indigo-600 rounded-lg text-white leading-none">
                  <Github className="w-5 h-5 text-white" />
                </span>
                🚀 Panduan Produksi: Jadikan Website Live di Vercel &amp; Hubungkan Supabase Cloud
              </h3>
              <p className="text-[11px] text-slate-500 mt-1 font-sans font-medium">
                Sisa 2 langkah lagi agar aplikasi pengelolaan keuangan dan tagihan RT ini dapat diakses secara resmi dari HP &amp; laptop seluruh pengurus serta warga secara real-time 24/7.
              </p>
            </div>

            <div className="space-y-6 text-xs leading-relaxed text-slate-700">
              {/* Tahap 1: Hubungkan / Ekspor Kode */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shrink-0">1</span>
                  <strong className="text-slate-900 font-bold font-sans">Ekspor Kode ke GitHub</strong>
                </div>
                <div className="pl-7 space-y-2 text-slate-600 font-medium font-sans">
                  <p>
                    Supaya aplikasi ini dapat ditonton online, pertama kodenya harus di-upload ke akun <strong className="text-slate-800">GitHub</strong> Anda:
                  </p>
                  <ul className="list-disc pl-5 mt-1 space-y-1.5 leading-relaxed">
                    <li>
                      <strong className="text-slate-800">Opsi Cepat (Export to GitHub):</strong> Di sudut kiri bawah editor AI Studio ini (atau di menu Settings Workspace), Anda dapat mengklik tombol <strong className="text-slate-800">"Export to GitHub"</strong>. Platform akan memandu Anda login GitHub dan secara otomatis membuatkan satu repositori baru untuk aplikasi kas ini.
                    </li>
                    <li>
                      <strong className="text-slate-800">Opsi Manual (Download ZIP):</strong> Jika ingin manual, buka menu pengaturan di AI Studio lalu klik <strong className="text-slate-800">"Download ZIP"</strong>. Ekstrak file zip tersebut di komputer Anda, lalu unggah repositori tersebut ke GitHub Anda.
                    </li>
                  </ul>
                  
                  <div className="bg-slate-950 p-3.5 rounded-xl text-[10px] sm:text-[10.5px] font-mono text-slate-300 border border-slate-800 mt-2 space-y-1 select-all overflow-x-auto">
                    <div># Perintah setup repositori mandiri (jika pakai download ZIP):</div>
                    <div>git init</div>
                    <div>git add .</div>
                    <div>git commit -m "Inisialisasi aplikasi kas RT 08"</div>
                    <div>git branch -M main</div>
                    <div>git remote add origin https://github.com/USERNAME_ANDA/NAMA_REPOSITORI_BARU.git</div>
                    <div>git push -u origin main</div>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Tahap 2: Hubungkan ke Vercel */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shrink-0">2</span>
                  <strong className="text-slate-900 font-bold font-sans">Deploy Situs Web Secara Gratis di Vercel</strong>
                </div>
                <div className="pl-7 space-y-2 text-slate-600 font-medium font-sans">
                  <p>
                    Vercel adalah platform cloud terbaik dan gratis yang digunakan untuk menayangkan website React modern. Lakukan deployment instan dalam 2 menit:
                  </p>
                  <ol className="list-decimal pl-5 mt-1 space-y-2 font-medium">
                    <li>
                      Buka situs resmi dan masuk di <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-sky-600 hover:underline font-bold inline-flex items-center gap-0.5">vercel.com <ExternalLink className="w-3.5 h-3.5" /></a> (sangat disarankan login menggunakan akun <strong className="text-slate-800">GitHub</strong> Anda).
                    </li>
                    <li>
                      Di halaman beranda Dashboard Vercel Anda, klik tombol <strong className="text-slate-800 bg-slate-200/85 px-1.5 py-0.5 rounded text-[10.5px]">Add New &gt; Project</strong>.
                    </li>
                    <li>
                      Cari nama repositori GitHub aplikasi Kas RT Anda yang telah diunggah di Langkah 1, lalu klik tombol <strong className="text-white bg-slate-900 hover:bg-slate-800 px-3 py-1 rounded-lg font-bold">Import</strong>.
                    </li>
                    <li>
                      Di bagian setelan konfigurasi, biarkan framework terpilih sebagai <strong className="text-slate-800">Vite (React)</strong> secara default.
                    </li>
                    <li>
                      Buka menu lipat <strong className="text-slate-800">"Environment Variables"</strong> untuk memasukkan kunci sinkronisasi database agar aplikasi dapat membaca &amp; menyimpan data real-time milik RT Anda:
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-2 bg-white border border-slate-250 p-4 rounded-xl">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-mono">NAMA KUNCI VARIABEL 1:</span>
                          <code className="text-[10.5px] font-bold text-sky-700 font-mono">VITE_SUPABASE_URL</code>
                          <span className="text-[9.5px] text-slate-500 block leading-relaxed mt-1">Salin nilai URL Supabase Anda yang tertera di Langkah 3 di atas</span>
                        </div>
                        <div className="border-t sm:border-t-0 sm:border-l border-slate-150 pt-2.5 sm:pt-0 sm:pl-3.5">
                          <span className="text-[9px] text-slate-400 block font-mono">NAMA KUNCI VARIABEL 2:</span>
                          <code className="text-[10.5px] font-bold text-sky-700 font-mono">VITE_SUPABASE_ANON_KEY</code>
                          <span className="text-[9.5px] text-slate-500 block leading-relaxed mt-1">Salin nilai API Anon Key Anda yang tertera di Langkah 3 di atas</span>
                        </div>
                      </div>
                    </li>
                    <li className="pt-2">
                      Klik tombol biru/hitam <strong className="text-white bg-sky-600 hover:bg-sky-700 px-4 py-2 rounded-xl font-extrabold shadow-sm transition">Deploy</strong>! Vercel akan otomatis menyusun kode aplikasi ini dalam waktu kurang dari 90 detik.
                    </li>
                  </ol>
                  <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-[11px] text-amber-900 mt-3 flex items-start gap-2">
                    <Info className="w-4 h-4 text-amber-650 shrink-0 mt-0.5" />
                    <p className="font-sans font-medium leading-relaxed">
                      <strong className="font-bold">Info Terpadu Routing:</strong> Kami sudah menyisipkan lembar berkas setelan <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[10px] text-amber-950 font-bold">vercel.json</code> konfigurasi rewrites ke dalam kode sumber aplikasi Anda. Berkas ini berfungsi khusus untuk mengamankan navigasi url (routing SPA), sehingga halaman tidak akan memicu error 404 ketika pengguna melakukan refresh halaman di broswer saat website sudah live.
                    </p>
                  </div>
                </div>
              </div>

              <hr className="border-slate-200" />

              {/* Tahap 3: Publikasikan & Sebarluaskan */}
              <div className="space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-slate-900 text-white rounded-full flex items-center justify-center text-[11px] font-black shrink-0">3</span>
                  <strong className="text-slate-900 font-bold font-sans">Aplikasi Siap Digunakan Bersama (Saling Sinkron)</strong>
                </div>
                <div className="pl-7 space-y-2.5 text-slate-600 font-medium font-sans">
                  <p>
                    Begitu Vercel menyelesaikan deployment, Anda akan mendapatkan alamat link website yang cantik dan profesional (contoh: <code className="bg-slate-150 px-1 py-0.5 rounded font-mono text-[10.5px]">https://buku-kas-rt08.vercel.app</code>):
                  </p>
                  <ul className="list-disc pl-5 space-y-2">
                    <li>
                      <strong className="text-slate-800">Saling Sinkron Otomatis:</strong> Bagikan salah satu link website Vercel tersebut kepada segenap jajaran pengurus RT (Ketua RT, Sekretaris, Bendahara, maupun Kolektor Lapangan). Saat satu pengurus mengisi iuran warga, nilainya akan silih berganti tersimpan dalam database Supabase Cloud dan tampil seketika di semua HP pengurus lain secara instan tanpa tumpang tindih.
                    </li>
                    <li>
                      <strong className="text-slate-800">Aman untuk HP Warga:</strong> Berikan link ini kepada warga agar mereka bisa mengakses data secara mandiri melalui browser HP masing-masing! Warga tinggal login dengan Akun Warga yang sudah didaftarkan untuk memantau buku keuangan kas, download surat resmi, dan melihat tagihannya dengan transparan.
                    </li>
                  </ul>
                  <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-emerald-950 flex items-start gap-2.5 font-sans mt-3">
                    <CheckCircle className="w-5 h-5 text-emerald-650 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-extrabold text-xs">Semuanya 100% Gratis &amp; Sangat Kuat Untuk RT</strong>
                      <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed font-semibold">
                        GitHub, Vercel, dan Supabase memiliki skema paket gratis (Free Tier Level) yang sangat berlimpah untuk skala kepengurusan rukun tetangga. Anda tidak akan dibebani biaya layanan bulanan apa pun selamanya, menjadikannya sarana yang andal dan ramah anggaran bagi modernisasi pelayanan RT Anda!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
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
