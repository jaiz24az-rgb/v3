import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  Copy, 
  Printer, 
  Check, 
  FileText, 
  MessageSquare, 
  Calendar, 
  MapPin, 
  Clock, 
  User, 
  ChevronRight, 
  Share2, 
  FileCheck,
  BookOpen,
  PlusCircle,
  Search,
  Filter,
  Trash2,
  FileSpreadsheet,
  AlertCircle,
  Hash,
  Download,
  CheckCircle2,
  UserPlus,
  Edit2,
  Eye,
  Plus,
  X,
  Trash,
  Upload,
  Home,
  ShieldAlert,
  Users,
  ArrowLeft,
  CheckCircle,
  Settings,
  RotateCcw,
  RefreshCw,
  Store,
  Save,
  Camera
} from 'lucide-react';
import { AppUser, OfficialLetter, WargaBill, LedgerEntry, FamilyMember, RombongBill, Balance } from '../types';
import * as XLSX from 'xlsx';
import { compressImage } from '../utils/fileCompressor';
import { getDefaultRtRate, getDefaultRombongRate } from './TagihanWarga';

interface UndanganProps {
  kas: Balance;
  rtTitle: string;
  rtAddress: string;
  rtEmail: string;
  usersList: AppUser[];
  currentUser: AppUser | null;
  lettersList: OfficialLetter[];
  onUpdateLettersList: (newLetters: OfficialLetter[] | ((prev: OfficialLetter[]) => OfficialLetter[])) => Promise<void> | void;
  wargaList: WargaBill[];
  updateWargaList: (newWarga: WargaBill[] | ((prev: WargaBill[]) => WargaBill[])) => void;
  blocksList: string[];
  updateBlocksList: (blocks: string[]) => void;
  yearsList: number[];
  updateYearsList: (years: number[]) => void;
  rateRT: number;
  updateRateRT: (rate: number) => void;
  rateRombong: number;
  updateRateRombong: (rate: number) => void;
  onTriggerReset: () => void;
  onRestoreSnapshot?: (snapData: { kas: Balance, ledger: LedgerEntry[], wargaList: WargaBill[], rombongList: RombongBill[] }) => void;
  updateLedger?: (newLedger: LedgerEntry[] | ((prev: LedgerEntry[]) => LedgerEntry[])) => void;
  updateRtTitle: (title: string) => void;
  updateRtAddress: (address: string) => void;
  updateRtEmail: (email: string) => void;
  rombongList: RombongBill[];
  updateRombongList?: (newRombong: RombongBill[] | ((prev: RombongBill[]) => RombongBill[])) => void;
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => void;
  appName: string;
  updateAppName: (val: string) => void;
  appLogo: string;
  updateAppLogo: (val: string) => void;
  labelWargaSingular: string;
  updateLabelWargaSingular: (val: string) => void;
  labelWargaPlural: string;
  updateLabelWargaPlural: (val: string) => void;
  labelRombongSingular: string;
  updateLabelRombongSingular: (val: string) => void;
  labelRombongPlural: string;
  updateLabelRombongPlural: (val: string) => void;
}

type InvitationTemplate = 'rapat' | 'kerja_bakti' | '17_agustus' | 'halal_bihalal' | 'custom';

const getRomanMonth = (mString: string): string => {
  const m = parseInt(mString, 10);
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  return roman[m - 1] || 'I';
};

export default function Undangan({
  kas,
  rtTitle,
  rtAddress,
  rtEmail,
  usersList,
  currentUser,
  lettersList,
  onUpdateLettersList,
  wargaList,
  updateWargaList,
  blocksList,
  updateBlocksList,
  yearsList,
  updateYearsList,
  rateRT,
  updateRateRT,
  rateRombong,
  updateRateRombong,
  onTriggerReset,
  onRestoreSnapshot,
  updateLedger,
  updateRtTitle,
  updateRtAddress,
  updateRtEmail,
  rombongList,
  updateRombongList,
  ledger,
  addLedgerEntry,
  appName,
  updateAppName,
  appLogo,
  updateAppLogo,
  labelWargaSingular,
  updateLabelWargaSingular,
  labelWargaPlural,
  updateLabelWargaPlural,
  labelRombongSingular,
  updateLabelRombongSingular,
  labelRombongPlural,
  updateLabelRombongPlural
}: UndanganProps) {
  const printContentViaIframe = (htmlContent: string) => {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // Clean up any existing print containers and temp styles first to prevent duplication
      document.getElementById('mobile-print-container')?.remove();
      document.querySelectorAll('.mobile-temp-print-style').forEach(el => el.remove());
      const oldStyle = document.getElementById('mobile-print-style');
      if (oldStyle) oldStyle.remove();

      // Use DOMParser to parse the HTML string cleanly
      const parser = new DOMParser();
      const parsedDoc = parser.parseFromString(htmlContent, 'text/html');

      // Keep original document title to restore later
      const originalTitle = document.title;
      const printTitle = parsedDoc.querySelector('title')?.textContent;
      if (printTitle) {
        document.title = printTitle;
      }

      // Extract styles and copy them to the main head
      const docStyles = parsedDoc.querySelectorAll('style');
      const tempStyles: HTMLStyleElement[] = [];
      docStyles.forEach((styleEl) => {
        const newStyle = document.createElement('style');
        newStyle.className = 'mobile-temp-print-style';
        newStyle.innerHTML = styleEl.innerHTML;
        document.head.appendChild(newStyle);
        tempStyles.push(newStyle);
      });

      // Extract body content and append to body
      const bodyContent = parsedDoc.body.innerHTML;
      const container = document.createElement('div');
      container.id = 'mobile-print-container';
      container.innerHTML = bodyContent;
      document.body.appendChild(container);

      // Create print-specific hiding styles
      const style = document.createElement('style');
      style.id = 'mobile-print-style';
      style.innerHTML = `
        @media print {
          body > *:not(#mobile-print-container):not(.mobile-temp-print-style) {
            display: none !important;
            visibility: hidden !important;
          }
          #mobile-print-container {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            background: white !important;
            color: black !important;
            display: block !important;
            visibility: visible !important;
          }
        }
      `;
      document.head.appendChild(style);

      // Give browser a short delayed moment to digest the style and DOM before opening print dialog
      setTimeout(() => {
        window.print();
        setTimeout(() => {
          container.remove();
          tempStyles.forEach(el => el.remove());
          style.remove();
          document.title = originalTitle;
        }, 2000);
      }, 600);
    } else {
      const iframe = document.createElement('iframe');
      iframe.className = 'print-iframe-helper';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.style.border = '0';
      iframe.style.zIndex = '-9999';
      iframe.style.opacity = '0.01';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        const cleanedHtml = htmlContent.replace(
          'window.print();',
          'window.print(); try { window.frameElement.remove(); } catch(e) {}'
        ).replace(
          'window.print()',
          'window.print(); try { window.frameElement.remove(); } catch(e) {}'
        ).replace(
          'window.print( )',
          'window.print(); try { window.frameElement.remove(); } catch(e) {}'
        );
        doc.write(cleanedHtml);
        doc.close();
      }
    }
  };

  const handleApplyNewRatesToUnpaid = () => {
    // 1. Confirm with the user
    const confirmUpdate = window.confirm(
      `Apakah Anda yakin ingin menyinkronkan seluruh iuran/tagihan yang berstatus "Belum Lunas" agar disesuaikan dengan besar acuan iuran baru?\n\n` +
      `- Acuan Iuran RT Baru: Rp ${rateRT.toLocaleString('id-ID')}\n` +
      `- Acuan Iuran Rombong Baru: Rp ${rateRombong.toLocaleString('id-ID')}\n\n` +
      `Perubahan ini akan mengubah semua nominal tagihan belum lunas pada buku tagihan seluruh warga dan lapak rombong.`
    );
    if (!confirmUpdate) return;

    // 2. Update wargaList
    const updatedWargaList = wargaList.map(w => {
      const updatedIuranRT = w.iuranRT.map(b => {
        if (!b.lunas) {
          return {
            ...b,
            nominal: getDefaultRtRate(b.tahun || 2026, b.bulan, rateRT)
          };
        }
        return b;
      });
      return {
        ...w,
        iuranRT: updatedIuranRT
      };
    });

    // 3. Update rombongList
    const updatedRombongList = rombongList.map(r => {
      const updatedIuranRombong = r.iuranRombong.map(b => {
        if (!b.lunas) {
          return {
            ...b,
            nominal: getDefaultRombongRate(b.tahun || 2026, b.bulan, rateRombong)
          };
        }
        return b;
      });
      return {
        ...r,
        iuranRombong: updatedIuranRombong
      };
    });

    // 4. Update states & database
    updateWargaList(updatedWargaList);
    if (updateRombongList) {
      updateRombongList(updatedRombongList);
    }

    alert('Berhasil! Seluruh tagihan yang belum lunas di buku tagihan warga & lapak rombong telah diperbarui sesuai acuan besaran iuran baru.');
  };

  // Main Tab control
  const [activeTab, setActiveTab] = useState<'buku' | 'undangan' | 'registrasi'>('registrasi');

  // Local state for Section 4 and 5 settings to avoid cursor jumping and race conditions
  const [localAppLogo, setLocalAppLogo] = useState(appLogo);
  const [localAppName, setLocalAppName] = useState(appName);
  const [localRtTitle, setLocalRtTitle] = useState(rtTitle);
  const [localRtAddress, setLocalRtAddress] = useState(rtAddress);
  const [localRtEmail, setLocalRtEmail] = useState(rtEmail);
  const [localLabelWargaSingular, setLocalLabelWargaSingular] = useState(labelWargaSingular);
  const [localLabelWargaPlural, setLocalLabelWargaPlural] = useState(labelWargaPlural);
  const [localLabelRombongSingular, setLocalLabelRombongSingular] = useState(labelRombongSingular);
  const [localLabelRombongPlural, setLocalLabelRombongPlural] = useState(labelRombongPlural);

  useEffect(() => { setLocalAppLogo(appLogo); }, [appLogo]);
  useEffect(() => { setLocalAppName(appName); }, [appName]);
  useEffect(() => { setLocalRtTitle(rtTitle); }, [rtTitle]);
  useEffect(() => { setLocalRtAddress(rtAddress); }, [rtAddress]);
  useEffect(() => { setLocalRtEmail(rtEmail); }, [rtEmail]);
  useEffect(() => { setLocalLabelWargaSingular(labelWargaSingular); }, [labelWargaSingular]);
  useEffect(() => { setLocalLabelWargaPlural(labelWargaPlural); }, [labelWargaPlural]);
  useEffect(() => { setLocalLabelRombongSingular(labelRombongSingular); }, [labelRombongSingular]);
  useEffect(() => { setLocalLabelRombongPlural(labelRombongPlural); }, [labelRombongPlural]);

  const handleSaveIdentitasNomenklatur = () => {
    updateAppLogo(localAppLogo);
    updateAppName(localAppName);
    updateRtTitle(localRtTitle);
    updateRtAddress(localRtAddress);
    updateRtEmail(localRtEmail);
    updateLabelWargaSingular(localLabelWargaSingular);
    updateLabelWargaPlural(localLabelWargaPlural);
    updateLabelRombongSingular(localLabelRombongSingular);
    updateLabelRombongPlural(localLabelRombongPlural);
    showToast('Identitas KOP Surat & Pengaturan Nomenklatur berhasil disimpan!');
  };

  const [newBlockInput, setNewBlockInput] = useState('');
  const [newYearInput, setNewYearInput] = useState('');
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [manualSnapLabel, setManualSnapLabel] = useState('');

  // Load snapshots from localStorage when Admin settings modal is opened
  useEffect(() => {
    if (showSettingsModal) {
      try {
        const saved = localStorage.getItem('perumtas_rt08_snapshots');
        if (saved) {
          setSnapshots(JSON.parse(saved));
        } else {
          setSnapshots([]);
        }
      } catch (e) {
        console.warn('Gagal memuat snaps:', e);
      }
    }
  }, [showSettingsModal]);

  const [showAddRombongModal, setShowAddRombongModal] = useState(false);
  const [newRombong, setNewRombong] = useState({
    namaPemilik: '',
    lokasi: '',
    noLapak: '',
    noWa: '',
    fotoBase64: '',
    fotoNamaFile: '',
  });

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper function to trigger toast
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- ADMINISTRATOR SNAPSHOT & UNDO FUNCTIONS ---
  const handleCreateManualSnapshot = () => {
    const label = manualSnapLabel.trim();
    if (!label) {
      alert('Harap masukkan nama/label snapshot!');
      return;
    }
    try {
      const now = Date.now();
      const timeStr = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(new Date());

      const newSnap = {
        id: `snap-${now}`,
        timestamp: new Date().toISOString(),
        dateString: timeStr,
        label: label,
        type: 'manual',
        kas,
        ledger,
        wargaList,
        rombongList
      };

      const updated = [newSnap, ...snapshots].slice(0, 20); // Keep last 20
      setSnapshots(updated);
      localStorage.setItem('perumtas_rt08_snapshots', JSON.stringify(updated));
      setManualSnapLabel('');
      showToast(`Snapshot "${label}" berhasil disimpan!`);
    } catch (e) {
      alert('Gagal membuat snapshot: ' + String(e));
    }
  };

  const handleUndoOneDay = () => {
    if (snapshots.length === 0) {
      alert('Tidak ada data backup/snapshot yang tersedia untuk digulirkan kembali!');
      return;
    }
    
    const now = Date.now();
    const TWELVE_HOURS = 12 * 60 * 60 * 1000;
    
    // Look for any backup that is older than 12 hours (could be auto or manual)
    const olderSnaps = snapshots.filter(s => {
      const snapTime = Number(s.id.split('-')[1]);
      return (now - snapTime) > TWELVE_HOURS;
    });
    
    let targetSnap = null;
    if (olderSnaps.length > 0) {
      // Take the newest of the older backups (i.e. first element of the already sorted olderSnaps)
      targetSnap = olderSnaps[0];
    } else {
      // If none is older than 12 hours, take the oldest available backup (e.g. initial backup of this session)
      targetSnap = snapshots[snapshots.length - 1];
    }

    if (!targetSnap) {
      alert('Tidak menemukan titik backup yang sesuai!');
      return;
    }

    const confirmRestore = window.confirm(
      `Apakah Anda yakin ingin memulihkan pembukuan ke keadaan: "${targetSnap.label}" (${targetSnap.dateString})?\n\n` +
      `Tindakan ini akan membatalkan semua perubahan data warga, lapak rombong, kas, dan buku catatan keuangan sesudah waktu tersebut.`
    );

    if (!confirmRestore) return;

    if (onRestoreSnapshot) {
      onRestoreSnapshot({
        kas: targetSnap.kas,
        ledger: targetSnap.ledger,
        wargaList: targetSnap.wargaList,
        rombongList: targetSnap.rombongList
      });
      showToast(`Sistem berhasil di-undo ke titik: ${targetSnap.label}`);
      setShowSettingsModal(false);
    }
  };

  const handleRestoreSpecific = (snap: any) => {
    const confirmRestore = window.confirm(
      `Apakah Anda yakin ingin MEMULIHKAN SYSTEM ke snapshot: "${snap.label}"?\n\n` +
      `Waktu Pembuatan: ${snap.dateString}\n\n` +
      `Semua data Warga, Rombong, Kas, dan Kas Buku akan digantikan dengan data snapshot ini secara saksama.`
    );
    if (!confirmRestore) return;

    if (onRestoreSnapshot) {
      onRestoreSnapshot({
        kas: snap.kas,
        ledger: snap.ledger,
        wargaList: snap.wargaList,
        rombongList: snap.rombongList
      });
      showToast(`Sistem sukses dipulihkan ke: ${snap.label}`);
      setShowSettingsModal(false);
    }
  };

  const handleDeleteSnapshot = (id: string, label: string) => {
    if (!confirm(`Hapus snapshot "${label}" dari daftar backup?`)) return;
    const updated = snapshots.filter(s => s.id !== id);
    setSnapshots(updated);
    localStorage.setItem('perumtas_rt08_snapshots', JSON.stringify(updated));
    showToast(`Snapshot "${label}" dihapus.`);
  };

  const handleExportPhysicalBackup = () => {
    try {
      const payload = {
        rt08_backup_ver: "1.0",
        timestamp: new Date().toISOString(),
        dateString: new Intl.DateTimeFormat('id-ID', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }).format(new Date()),
        kas,
        ledger,
        wargaList,
        rombongList
      };

      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(payload, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `BACKUP_KAS_RT08_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Ekspor berkas backup JSON sukses diunduh.");
    } catch (e) {
      alert("Gagal mengekspor data: " + String(e));
    }
  };

  const handleImportPhysicalBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Verify basic structure of RT08 backup
        if (!parsed.kas || !parsed.ledger || !parsed.wargaList || !parsed.rombongList) {
          alert("Format berkas backup JSON tidak valid! Pastikan berkas berasal dari ekspor sistem Kas RT08.");
          return;
        }

        const infoStr = parsed.dateString ? `(Dibuat pada: ${parsed.dateString})` : '';
        const confirmImport = window.confirm(
          `Apakah Anda yakin ingin memulihkan pembukuan dari berkas backup eksternal ini?\n${infoStr}\n\n` +
          `⚠️ PERINGATAN: Semua data warga, rombong, mutasi kas, dan kuitansi saat ini akan diganti sepenuhnya.`
        );

        if (!confirmImport) return;

        if (onRestoreSnapshot) {
          onRestoreSnapshot({
            kas: parsed.kas,
            ledger: parsed.ledger,
            wargaList: parsed.wargaList,
            rombongList: parsed.rombongList
          });
          showToast("Pembukuan & database warga sukses dipulihkan dari berkas JSON!");
          setShowSettingsModal(false);
        }
      } catch (err) {
        alert("Gagal membaca berkas: format JSON rusak atau tidak valid.");
      }
    };
    reader.readAsText(file);
  };

  // -----------------------------------------------------
  // TAB 3: REGISTRASI & DATA WARGA STATES & HANDLERS
  // -----------------------------------------------------
  const [searchWarga, setSearchWarga] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua');
  const [editingWarga, setEditingWarga] = useState<WargaBill | null>(null);
  const [activeDropdownWarga, setActiveDropdownWarga] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdownWarga(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const [showAddWargaModal, setShowAddWargaModal] = useState(false);
  const [selectedWargaHistory, setSelectedWargaHistory] = useState<WargaBill | null>(null);
  
  // New Warga structure
  const [newWarga, setNewWarga] = useState({
    nama: '',
    blok: 'A4',
    noRumah: '',
    noWa: '',
    noKtp: '',
    noKk: '',
    alamatKtpAsal: '',
    ktpBase64: '',
    kkBase64: '',
    ktpNamaFile: '',
    kkNamaFile: '',
    fotoBase64: '',
    fotoNamaFile: '',
    isWargaBaru: false,
    mulaiBulan: 'Januari',
    mulaiTahun: 2026,
    anggotaKeluarga: [] as FamilyMember[],
  });

  // Temporary family member state for Forms (Add & Edit)
  const [tempMember, setTempMember] = useState({
    nama: '',
    hubungan: 'Istri',
    nik: '',
    noHape: ''
  });

  const fullMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const getDefaultRtRate = (tahun: number, bulan: string, baseRate: number): number => {
    return baseRate || 110000;
  };

  const addFamilyMemberToList = () => {
    if (!tempMember.nama.trim()) return;
    const item: FamilyMember = {
      id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nama: tempMember.nama.trim(),
      hubungan: tempMember.hubungan as any,
      nik: tempMember.nik.trim() || undefined,
      noHape: tempMember.noHape.trim() || undefined
    };

    if (editingWarga) {
      const existingMembers = editingWarga.anggotaKeluarga || [];
      setEditingWarga({
        ...editingWarga,
        anggotaKeluarga: [...existingMembers, item]
      });
    } else {
      const existingMembers = newWarga.anggotaKeluarga || [];
      setNewWarga({
        ...newWarga,
        anggotaKeluarga: [...existingMembers, item]
      });
    }

    setTempMember({
      nama: '',
      hubungan: 'Istri',
      nik: '',
      noHape: ''
    });
  };

  const removeFamilyMember = (memberId: string) => {
    if (editingWarga) {
      const existingMembers = editingWarga.anggotaKeluarga || [];
      setEditingWarga({
        ...editingWarga,
        anggotaKeluarga: existingMembers.filter(m => m.id !== memberId)
      });
    } else {
      const existingMembers = newWarga.anggotaKeluarga || [];
      setNewWarga({
        ...newWarga,
        anggotaKeluarga: existingMembers.filter(m => m.id !== memberId)
      });
    }
  };

  const handleAddWarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarga.nama || !newWarga.noRumah) {
      alert('Nama dan Nomor Rumah wajib diisi!');
      return;
    }

    const months = fullMonths;
    const monthsOrder = fullMonths.map(m => m.toLowerCase());
    const iuranRT: any[] = [];
    
    const yearsToUse = yearsList || [2024, 2025, 2026, 2027, 2028];
    yearsToUse.forEach(yr => {
      months.forEach(m => {
        let isLunas = false;
        let tglBayar: string | undefined = undefined;
        let jmBayar: string | undefined = undefined;
        
        if (newWarga.isWargaBaru) {
          const isBeforeYear = yr < newWarga.mulaiTahun;
          const isSameYearBeforeMonth = (yr === newWarga.mulaiTahun) && 
            (monthsOrder.indexOf(m.toLowerCase()) < monthsOrder.indexOf(newWarga.mulaiBulan.toLowerCase()));
            
          if (isBeforeYear || isSameYearBeforeMonth) {
            isLunas = true;
            tglBayar = 'Bebas (Warga Baru)';
            jmBayar = 'Sistem';
          }
        }
        
        iuranRT.push({
          bulan: m,
          lunas: isLunas,
          nominal: getDefaultRtRate(yr, m, rateRT),
          tahun: yr,
          tanggalBayar: tglBayar,
          jamBayar: jmBayar
        });
      });
    });

    const created: WargaBill = {
      id: `warga-${Date.now()}`,
      nama: newWarga.nama,
      blok: newWarga.blok,
      noRumah: newWarga.noRumah,
      noWa: newWarga.noWa.trim(),
      noKtp: newWarga.noKtp.trim() || undefined,
      noKk: newWarga.noKk.trim() || undefined,
      alamatKtpAsal: newWarga.alamatKtpAsal.trim() || undefined,
      ktpBase64: newWarga.ktpBase64 || undefined,
      kkBase64: newWarga.kkBase64 || undefined,
      ktpNamaFile: newWarga.ktpNamaFile || undefined,
      kkNamaFile: newWarga.kkNamaFile || undefined,
      fotoBase64: newWarga.fotoBase64 || undefined,
      fotoNamaFile: newWarga.fotoNamaFile || undefined,
      iuranRT: iuranRT,
      anggotaKeluarga: newWarga.anggotaKeluarga || [],
    };

    updateWargaList([...wargaList, created]);
    setShowAddWargaModal(false);
    setNewWarga({ 
      nama: '', 
      blok: 'A4', 
      noRumah: '', 
      noWa: '', 
      noKtp: '', 
      noKk: '', 
      alamatKtpAsal: '',
      ktpBase64: '', 
      kkBase64: '', 
      ktpNamaFile: '', 
      kkNamaFile: '',
      fotoBase64: '',
      fotoNamaFile: '',
      isWargaBaru: false,
      mulaiBulan: 'Januari',
      mulaiTahun: 2026,
      anggotaKeluarga: [],
    });

    // Log addition to ledger
    addLedgerEntry({
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: `Pendaftaran Warga Baru: ${created.nama} (Blok ${created.blok}-${created.noRumah})`,
      jumlah: 0,
      tipe: 'pemasukan',
      sumberKas: 'rtPettyCash',
      kategori: 'Administrasi Warga',
      petugas: currentUser?.nama.split(' ')[0] || 'Admin'
    });

    showToast(`Sukses mendaftarkan warga baru: ${created.nama}`);
  };

  const handleAddRombong = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRombong.namaPemilik || !newRombong.noLapak) return;

    const months = ['Maret', 'April', 'Mei'];
    const created: RombongBill = {
      id: `rombong-${Date.now()}`,
      namaPemilik: newRombong.namaPemilik,
      lokasi: newRombong.lokasi || 'Samping Lapangan',
      noLapak: newRombong.noLapak,
      noWa: newRombong.noWa.trim(),
      fotoBase64: newRombong.fotoBase64 || undefined,
      fotoNamaFile: newRombong.fotoNamaFile || undefined,
      iuranRombong: months.map(m => ({
        bulan: m,
        lunas: false,
        nominal: getDefaultRombongRate(new Date().getFullYear(), m, rateRombong),
        tahun: new Date().getFullYear(),
      })),
    };

    if (updateRombongList) {
      updateRombongList([...rombongList, created]);
    }
    setShowAddRombongModal(false);
    setNewRombong({ namaPemilik: '', lokasi: '', noLapak: '', noWa: '', fotoBase64: '', fotoNamaFile: '' });

    // Log addition to ledger
    addLedgerEntry({
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: `Pendaftaran Rombong Baru: ${created.namaPemilik} (${created.noLapak})`,
      jumlah: 0,
      tipe: 'pemasukan',
      sumberKas: 'rtPettyCash',
      kategori: 'Administrasi Warga',
      petugas: currentUser?.nama.split(' ')[0] || 'Admin'
    });

    showToast(`Sukses mendaftarkan rombong baru: ${created.namaPemilik}`);
  };

  const handleEditWargaSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingWarga) return;

    const updated = wargaList.map(w => {
      if (w.id === editingWarga.id) {
        return {
          ...w,
          nama: editingWarga.nama,
          blok: editingWarga.blok,
          noRumah: editingWarga.noRumah,
          noWa: editingWarga.noWa?.trim(),
          noKtp: editingWarga.noKtp?.trim() || undefined,
          noKk: editingWarga.noKk?.trim() || undefined,
          alamatKtpAsal: editingWarga.alamatKtpAsal?.trim() || undefined,
          ktpBase64: editingWarga.ktpBase64 || undefined,
          kkBase64: editingWarga.kkBase64 || undefined,
          ktpNamaFile: editingWarga.ktpNamaFile || undefined,
          kkNamaFile: editingWarga.kkNamaFile || undefined,
          fotoBase64: editingWarga.fotoBase64 || undefined,
          fotoNamaFile: editingWarga.fotoNamaFile || undefined,
          anggotaKeluarga: editingWarga.anggotaKeluarga || []
        };
      }
      return w;
    });

    updateWargaList(updated);
    setEditingWarga(null);
    showToast(`Sukses memperbarui data warga: ${editingWarga.nama}`);
  };

  const handleDeleteWarga = (id: string, nama: string) => {
    if (!window.confirm(`PERINGATAN: Apakah Anda yakin ingin menghapus warga "${nama}" dari sistem secara permanen? Seluruh riwayat transaksi & iuran lunas warga ini akan terhapus!`)) return;
    updateWargaList(wargaList.filter(w => w.id !== id));
    showToast(`Sukses menghapus warga: ${nama}`);
  };

  // Excel Import for Warga
  const importWargaFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: "" });

        if (rawRows.length === 0) {
          alert('File Excel kosong atau tidak terbaca!');
          return;
        }

        const yearsToUse = yearsList || [2024, 2025, 2026, 2027, 2028];
        const updatedWargaMap = new Map<string, WargaBill>();
        
        // Initialize with existing warga to allow updating
        wargaList.forEach(w => {
          updatedWargaMap.set(w.id, { 
            ...w, 
            anggotaKeluarga: [...(w.anggotaKeluarga || [])] 
          });
        });

        let currentWargaId: string | null = null;
        let importedCount = 0;

        rawRows.forEach((row: any, idx) => {
          // Identify columns based on original or exported names
          const rowId = String(row["Kode / ID (Jangan Diubah)"] || row["ID"] || row["id"] || "").trim();
          const nameVal = String(row["Nama Kepala Keluarga"] || row["NAMA"] || row["Nama"] || row["Nama Anggota / Warga"] || "").trim();
          const nameOfMember = String(row["Nama Anggota / Warga"] || row["Nama Kepala Keluarga"] || row["NAMA"] || row["Nama"] || "").trim();
          const relationshipVal = String(row["Anggota Keluarga (Status/Hubungan)"] || row["Anggota Keluarga"] || row["Hubungan"] || "").trim();
          const ktpVal = String(row["Nomor KTP (NIK)"] || row["No KTP"] || row["NIK"] || row["KTP"] || "").trim();
          const kkVal = String(row["Nomor KK"] || row["No KK"] || row["KK"] || "").trim();
          const addressVal = String(row["Alamat Asal KTP"] || row["Alamat"] || "").trim();
          const blockVal = String(row["Blok Rumah"] || row["BLOK"] || row["Blok"] || "A4").trim();
          const houseNoVal = String(row["Nomor Rumah"] || row["NO_RUMAH"] || row["No Rumah"] || row["NOMOR"] || "").trim();
          let phoneVal = String(row["No WhatsApp"] || row["NO_WA"] || row["No WA"] || row["TELP"] || "").trim();

          if (!nameVal) return; // Skip row if name is totally empty

          // If the row is a Family Member (i.e. 'relationshipVal' is not empty and is not "Kepala Keluarga")
          const isFamilyMember = relationshipVal && relationshipVal.toLowerCase() !== 'kepala keluarga';

          if (isFamilyMember) {
            // Find current active warga to attach family member
            if (currentWargaId && updatedWargaMap.has(currentWargaId)) {
              const activeWarga = updatedWargaMap.get(currentWargaId)!;
              
              if (phoneVal.startsWith("WA: ")) {
                phoneVal = phoneVal.replace("WA: ", "");
              }

              // Check if member already exists to prevent duplicate addition
              const existingMemberIndex = activeWarga.anggotaKeluarga?.findIndex(m => m.nik === ktpVal && ktpVal !== "") ?? -1;
              const newMember: FamilyMember = {
                id: `family-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`,
                nama: nameOfMember,
                hubungan: relationshipVal,
                nik: ktpVal || undefined,
                noHape: phoneVal || undefined
              };

              if (existingMemberIndex >= 0) {
                activeWarga.anggotaKeluarga![existingMemberIndex] = {
                  ...activeWarga.anggotaKeluarga![existingMemberIndex],
                  nama: nameOfMember,
                  hubungan: relationshipVal,
                  nik: ktpVal || undefined,
                  noHape: phoneVal || undefined
                };
              } else {
                activeWarga.anggotaKeluarga = [...(activeWarga.anggotaKeluarga || []), newMember];
              }
            }
          } else {
            // This is a Hauptperson (Kepala Keluarga)
            // If rowId exists and matches an existing citizen, we update. Otherwise, we create a new citizen.
            let targetId = rowId;
            let isNew = false;

            if (!targetId || !updatedWargaMap.has(targetId)) {
              // Check if name + block + noRumah matches an existing citizen as fallback to prevent duplicates
              const matchedWarga = wargaList.find(w => 
                w.nama.toLowerCase() === nameVal.toLowerCase() && 
                w.blok.toLowerCase() === blockVal.toLowerCase() && 
                w.noRumah.toLowerCase() === houseNoVal.toLowerCase()
              );
              if (matchedWarga) {
                targetId = matchedWarga.id;
              } else {
                targetId = `warga-excel-${Date.now()}-${idx}`;
                isNew = true;
              }
            }

            currentWargaId = targetId;

            if (isNew) {
              const iuranRT: any[] = [];
              yearsToUse.forEach(yr => {
                fullMonths.forEach(m => {
                  iuranRT.push({
                    bulan: m,
                    lunas: false,
                    nominal: getDefaultRtRate(yr, m, rateRT),
                    tahun: yr
                  });
                });
              });

              updatedWargaMap.set(targetId, {
                id: targetId,
                nama: nameVal,
                blok: blockVal,
                noRumah: houseNoVal,
                noWa: phoneVal,
                noKtp: ktpVal || undefined,
                noKk: kkVal || undefined,
                alamatKtpAsal: addressVal || undefined,
                iuranRT,
                anggotaKeluarga: []
              });
              importedCount++;
            } else {
              const existingWarga = updatedWargaMap.get(targetId)!;
              updatedWargaMap.set(targetId, {
                ...existingWarga,
                nama: nameVal,
                blok: blockVal || existingWarga.blok,
                noRumah: houseNoVal || existingWarga.noRumah,
                noWa: phoneVal || existingWarga.noWa,
                noKtp: ktpVal || existingWarga.noKtp,
                noKk: kkVal || existingWarga.noKk,
                alamatKtpAsal: addressVal || existingWarga.alamatKtpAsal,
              });
              importedCount++;
            }
          }
        });

        const finalWargaList = Array.from(updatedWargaMap.values());
        updateWargaList(finalWargaList);
        showToast(`Sukses sinkronisasi/impor ${importedCount} data warga & anggota keluarga dari Excel.`);
      } catch (err) {
        console.error(err);
        alert('Gagal membaca dokumen Excel. Pastikan header sesuai format.');
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input target
  };

  // Excel Export for Warga
  const exportWargaToExcel = () => {
    try {
      const rows: any[] = [];
      wargaList.filter(w => !w.isDeleted).forEach(w => {
        // Primary citizen (Kepala Keluarga)
        rows.push({
          'Kode / ID (Jangan Diubah)': w.id,
          'Nama Kepala Keluarga': w.nama,
          'Nama Anggota / Warga': w.nama,
          'Anggota Keluarga (Status/Hubungan)': 'Kepala Keluarga',
          'Nomor KTP (NIK)': w.noKtp || '',
          'Nomor KK': w.noKk || '',
          'Alamat Asal KTP': w.alamatKtpAsal || '',
          'Blok Rumah': w.blok || '',
          'Nomor Rumah': w.noRumah || '',
          'No WhatsApp': w.noWa || '',
        });

        // Family members rows
        if (w.anggotaKeluarga && w.anggotaKeluarga.length > 0) {
          w.anggotaKeluarga.forEach(m => {
            rows.push({
              'Kode / ID (Jangan Diubah)': '', // Empty for family member row
              'Nama Kepala Keluarga': w.nama, // Keep parent name so sorted rows stay associated!
              'Nama Anggota / Warga': m.nama, // Name of child/wife
              'Anggota Keluarga (Status/Hubungan)': m.hubungan || 'Lainnya', // 'Istri', 'Anak', etc.
              'Nomor KTP (NIK)': m.nik || '',
              'Nomor KK': w.noKk || '', // Propagate KK number
              'Alamat Asal KTP': w.alamatKtpAsal || '', // Propagate address
              'Blok Rumah': w.blok || '', // Propagate block
              'Nomor Rumah': w.noRumah || '', // Propagate house number
              'No WhatsApp': m.noHape ? `WA: ${m.noHape}` : '',
            });
          });
        }
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Warga RT08');

      // Auto-fit columns
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 3, 12)
      }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, "Master_Database_Warga_RT08.xlsx");
      showToast("Unduhan format Excel database warga berhasil diinisiasi.");
    } catch (e) {
      console.error(e);
      alert("Gagal melakukan ekspor excel.");
    }
  };

  // PDF Printing for warga list
  const exportAllWargaList = (listToPrint: WargaBill[]) => {
    const printDoc = {
      write: (htmlContent: string) => {
        printContentViaIframe(htmlContent);
      },
      close: () => {}
    };

    const adminUser = usersList.find(u => u.role === 'admin');

    const tableRows = listToPrint.map((w, idx) => {
      const kkCount = w.anggotaKeluarga?.length || 0;
      return `
        <tr style="border-bottom: 1px solid #e2e8f0; font-family: sans-serif; font-size: 11px;">
          <td style="padding: 10px; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; font-weight: bold; color: #1e293b;">${w.nama}</td>
          <td style="padding: 10px; text-align: center;">Blok ${w.blok} No. ${w.noRumah}</td>
          <td style="padding: 10px; text-align: center; font-family: monospace;">${w.noWa || '-'}</td>
          <td style="padding: 10px; text-align: center;">${kkCount > 0 ? kkCount + ' Jiwa' : 'Hanya KK'}</td>
          <td style="padding: 10px; text-align: center; color: ${w.noKtp ? '#16a34a' : '#ef4444'}; font-weight: bold;">${w.noKtp ? '✓ Terdaftar' : '✗ Belum'}</td>
          <td style="padding: 10px; text-align: center; color: ${w.noKk ? '#16a34a' : '#ef4444'}; font-weight: bold;">${w.noKk ? '✓ Terdaftar' : '✗ Belum'}</td>
        </tr>
      `;
    }).join('');

    printDoc.write(`
      <html>
        <head>
          <title>Buku Registry & Data Warga Terupdate - RT 08 Perumtas 3</title>
          <style>
            @media print {
              body { margin: 15mm; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body style="font-family: sans-serif; padding: 20px; color: #334155;">
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="width: 70px; text-align: center;">
                <div style="width: 55px; height: 55px; background-color: #0284c7; border-radius: 12px; display: inline-block; color: white; text-align: center; line-height: 55px; font-weight: bold; font-size: 24px;">RT</div>
              </td>
              <td style="padding-left: 15px;">
                <div style="font-size: 14px; font-weight: 900; letter-spacing: 0.5px; color: #0f172a; text-transform: uppercase;">${rtTitle}</div>
                <div style="font-size: 11px; font-weight: bold; margin-top: 3px; color: #0284c7; text-transform: uppercase; font-family: monospace;">SISTEM ADMINISTRASI REGISTER BUKU WARGA DIGITAL</div>
                <div style="font-size: 9px; color: #64748b; margin-top: 5px; font-family: sans-serif;">Alamat: ${rtAddress} ${rtEmail ? ' • Email: ' + rtEmail : ''}</div>
              </td>
            </tr>
          </table>
          <hr style="border: none; border-top: 2px solid #0f172a; margin-bottom: 20px;" />
          
          <div style="text-align: center; margin-bottom: 25px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 850; text-transform: uppercase; color: #0f172a;">DAFTAR BUKU REGISTRY &amp; PENDATAAN WARGA TERUPDATE</h3>
            <p style="margin: 5px 0 0 0; font-size: 10px; color: #64748b;">Dicetak secara sistematis per tanggal ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
            <thead>
              <tr style="background-color: #f8fafc; border-bottom: 2px solid #cbd5e1; font-family: sans-serif; font-size: 11px; text-transform: uppercase; font-weight: bold; color: #475569;">
                <th style="padding: 10px; width: 40px; text-align: center;">No</th>
                <th style="padding: 10px; text-align: left;">Nama Lengkap (KK)</th>
                <th style="padding: 10px; text-align: center; width: 140px;">No. Rumah</th>
                <th style="padding: 10px; text-align: center; width: 120px;">No. WA</th>
                <th style="padding: 10px; text-align: center; width: 105px;">Anggota KK</th>
                <th style="padding: 10px; text-align: center; width: 100px;">KTP File</th>
                <th style="padding: 10px; text-align: center; width: 100px;">KK File</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <table style="width: 100%; margin-top: 50px; font-family: sans-serif; font-size: 11px;">
            <tr>
              <td style="width: 65%;"></td>
              <td style="text-align: center; width: 35%;">
                <div style="font-weight: 650; color: #334155;">Sidoarjo, ${new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</div>
                <div style="font-weight: bold; color: #0f172a; margin-top: 5px; margin-bottom: 45px;">Ketua RT 08 RW 04</div>
                <div style="font-weight: 800; color: #0f172a; text-decoration: underline;">${adminUser ? 'Bpk. ' + cleanSignatureName(adminUser.nama) : 'Bpk. Ketua RT'}</div>
              </td>
            </tr>
          </table>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printDoc.close();
  };

  // -----------------------------------------------------
  // TAB 1: BUKU URUTAN NOMOR SURAT DINAS STATES & HANDLERS
  // -----------------------------------------------------
  const [searchLetter, setSearchLetter] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Log Form states
  const [newLetterNo, setNewLetterNo] = useState('');
  const [newLetterDate, setNewLetterDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [newLetterType, setNewLetterType] = useState<OfficialLetter['jenisSurat']>('undangan_rapat');
  const [newLetterSubject, setNewLetterSubject] = useState('');
  const [newLetterRecipient, setNewLetterRecipient] = useState('');
  const [newLetterPurpose, setNewLetterPurpose] = useState('');
  const [selectedWargaId, setSelectedWargaId] = useState('');

  // Clean signature names helper
  const cleanSignatureName = (nama: string) => {
    return nama.replace(/\s*\(.*\)\s*/g, '').trim();
  };

  // Get village name
  const getDesaName = (address: string) => {
    const match = address.match(/(?:desa|ds\.?|kel\.?|kelurahan)\s+([A-Z0-9]+)/i);
    if (match && match[1]) {
      return match[1].toUpperCase();
    }
    if (/popoh/i.test(address)) return 'POPOH';
    if (/grabagan/i.test(address)) return 'GRABAGAN';
    return 'POPOH';
  };

  const getRtNumber = (title: string) => {
    const match = title.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i);
    return match ? `RT ${match[1]}` : 'RT 008';
  };

  // Auto formulate the next suggested sequence letter number
  useEffect(() => {
    if (!newLetterDate) return;
    const dateObj = new Date(newLetterDate);
    const year = dateObj.getFullYear() || 2026;
    const month = dateObj.getMonth() + 1;
    const roman = getRomanMonth(String(month));

    const village = getDesaName(rtAddress);
    const rtMatch = rtTitle.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i);
    const rtCode = rtMatch ? `RT-${parseInt(rtMatch[1], 10)}` : 'RT-08';

    // Count max index for this year
    const yearLetters = lettersList.filter(l => {
      const lYear = new Date(l.tanggalSurat).getFullYear();
      return lYear === year;
    });

    let nextIdx = 1;
    const numbers = yearLetters.map(l => {
      const parts = l.nomorSurat.split('/');
      const numPart = parts[0];
      const parsed = parseInt(numPart, 10);
      return isNaN(parsed) ? 0 : parsed;
    });

    if (numbers.length > 0) {
      nextIdx = Math.max(...numbers) + 1;
    }

    const paddedIdx = String(nextIdx).padStart(3, '0');
    setNewLetterNo(`${paddedIdx}/${rtCode}/${village}/${roman}/${year}`);
  }, [newLetterDate, lettersList, rtTitle, rtAddress, newLetterType]);

  // Adjust default perihal (subject) based on letter type selected
  useEffect(() => {
    switch(newLetterType) {
      case 'undangan_rapat':
        setNewLetterSubject('Undangan Rapat Koordinasi Rutin & Evaluasi Pembukuan');
        setNewLetterRecipient('Seluruh Warga ' + getRtNumber(rtTitle));
        break;
      case 'undangan_kerja_bakti':
        setNewLetterSubject('Undangan Kerja Bakti Pembersihan Lingkungan Massal');
        setNewLetterRecipient('Seluruh Warga ' + getRtNumber(rtTitle));
        break;
      case 'undangan_khusus':
        setNewLetterSubject('Undangan Acara Peringatan HUT RI & Perlombaan Warga');
        setNewLetterRecipient('Seluruh Pengurus & Warga RT');
        break;
      case 'pengantar_rt':
        setNewLetterSubject('Surat Keterangan Pengantar RT');
        // keep recipient blank or let citizen selector handle it
        break;
      case 'custom':
        setNewLetterSubject('');
        setNewLetterRecipient('');
        break;
    }
  }, [newLetterType]);

  // If citizen drop down changes in the form, assign citizen's name
  const handleWargaSelectChange = (wId: string) => {
    setSelectedWargaId(wId);
    if (!wId) {
      if (newLetterType === 'pengantar_rt') {
        setNewLetterRecipient('');
      }
      return;
    }

    const picked = wargaList.find(w => w.id === wId);
    if (picked) {
      setNewLetterRecipient(picked.nama);
      if (newLetterType === 'pengantar_rt') {
        setNewLetterSubject(`Surat Keterangan Pengantar RT - An. ${picked.nama}`);
        setNewLetterPurpose('Pengurusan Kartu Tanda Penduduk (KTP) / Kartu Keluarga (KK)');
      }
    }
  };

  // Handle register letters number form submit
  const handleRegisterLetter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLetterNo.trim() || !newLetterSubject.trim() || !newLetterRecipient.trim()) {
      alert('Harap isi semua kolom wajib!');
      return;
    }

    // Check key collision
    const exists = lettersList.some(l => l.nomorSurat.toLowerCase() === newLetterNo.trim().toLowerCase());
    if (exists) {
      const confirmSave = window.confirm('Nomor surat ini sudah terdaftar sebelumnya. Tetap simpan?');
      if (!confirmSave) return;
    }

    const nextLetter: OfficialLetter = {
      id: `let-${Date.now()}`,
      nomorSurat: newLetterNo,
      tanggalSurat: newLetterDate,
      jenisSurat: newLetterType,
      perihal: newLetterSubject,
      penerima: newLetterRecipient,
      keperluan: newLetterPurpose || undefined,
      wargaId: selectedWargaId || undefined,
      createdAt: new Date().toISOString(),
      createdBy: currentUser ? currentUser.nama : 'Sekretaris'
    };

    await onUpdateLettersList((prev) => [nextLetter, ...prev]);
    showToast(`Sukses mendaftarkan nomor surat: ${newLetterNo}`);
    
    // Clear form & close
    setNewLetterSubject('');
    setNewLetterRecipient('');
    setNewLetterPurpose('');
    setSelectedWargaId('');
    setShowAddForm(false);
  };

  const handleDeleteLetter = async (id: string, code: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus pencatatan nomor surat "${code}"?`)) return;
    await onUpdateLettersList((prev) => prev.filter(l => l.id !== id));
    showToast(`Sukses menghapus pendaftaran nomor: ${code}`);
  };

  // Search filter
  const filteredLetters = lettersList.filter(l => {
    const queryMatch = 
      l.nomorSurat.toLowerCase().includes(searchLetter.toLowerCase()) ||
      l.perihal.toLowerCase().includes(searchLetter.toLowerCase()) ||
      l.penerima.toLowerCase().includes(searchLetter.toLowerCase()) ||
      (l.keperluan || '').toLowerCase().includes(searchLetter.toLowerCase());

    if (filterType === 'all') return queryMatch;
    if (filterType === 'undangan') return queryMatch && l.jenisSurat.startsWith('undangan');
    if (filterType === 'custom') return queryMatch && l.jenisSurat === 'custom';
    return queryMatch;
  });

  // Copy number to clipboard
  const handleCopyNo = (num: string) => {
    navigator.clipboard.writeText(num);
    showToast(`Nomor surat "${num}" dipasang di papan klip.`);
  };

  // -----------------------------------------------------
  // TAB 2: PEMBUAT UNDANGAN RESMI STATES & HANDLERS
  // -----------------------------------------------------
  const [template, setTemplate] = useState<InvitationTemplate>('rapat');
  const [recipient, setRecipient] = useState('Seluruh Bapak/Ibu Warga RT 08 RW 04');
  const [eventTitle, setEventTitle] = useState('Rapat Pleno Koordinasi Pengurus & Warga RT');
  const [dayDate, setDayDate] = useState('');
  const [time, setTime] = useState('19:30 WIB - Selesai');
  const [location, setLocation] = useState('Balai Pertemuan Larangan / Halaman Rumah Ketua RT 08');
  const [agenda, setAgenda] = useState('1. Pembahasan Laporan Keuangan Tengah Tahun\n2. Sosialisasi Program Iuran Terpadu Rombong Kuliner\n3. Pembahasan Keamanan Lingkungan & Rencana Kerja Bakti');
  const [notes, setNotes] = useState('Kehadiran Bapak/Ibu sangat diharapkan demi kelancaran pembangunan serta kerukunan paguyuban rukun tetangga.');
  
  const [letterNumber, setLetterNumber] = useState('012/RT-08/V/2026');
  const [letterSubject, setLetterSubject] = useState('Undangan Rapat Koordinasi Rutin & Evaluasi Pembukuan');
  const [attachments, setAttachments] = useState('1 (Satu) Berkas Brosur / Lembaran Kas');

  const [activeFormatTab, setActiveFormatTab] = useState<'wa' | 'kop'>('wa');

  // Auto template details
  useEffect(() => {
    const today = new Date();
    const nextWeekDate = new Date(today.getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    if (!dayDate) {
      setDayDate(nextWeekDate);
    }

    switch(template) {
      case 'rapat':
        setEventTitle('Rapat Pleno Koordinasi Pengurus & Warga RT');
        setLetterSubject('Undangan Rapat Koordinasi Rutin & Evaluasi Pembukuan');
        setAgenda('1. Pembahasan Laporan Keuangan Tengah Tahun\n2. Sosialisasi Program Iuran Terpadu Rombong Kuliner\n3. Pembahasan Keamanan Lingkungan & Kamtibmas');
        setNotes('Mengingat pentingnya acara ini, kehadiran Bapak/Ibu tepat waktu sangat kami harapkan. Terima kasih atas pengertian dan partisipasinya.');
        break;
      case 'kerja_bakti':
        setEventTitle('Kegiatan Kerja Bakti Lingkungan Massal');
        setLetterSubject('Undangan Kerja Bakti Pembersihan Saluran Air & Fogging');
        setAgenda('1. Pembersihan rumput liar dan selokan Blok A s/d C\n2. Perbaikan fasilitas umum / pos ronda warga\n3. Fogging mandiri pencegahaan penyakit Demam Berdarah (DBD)');
        setNotes('Dimohon seluruh KK mengirimkan minimal 1 perwakilan pria dan membawa alat kebersihan (cangkul, sabit, sekop, atau sapu lidi) dari rumah masing-masing.');
        break;
      case '17_agustus':
        setEventTitle('Pertemuan HUT RI & Pembentukan Karang Taruna');
        setLetterSubject('Undangan Pembentukan Panitia Semarak HUT Kemerdekaan RI');
        setAgenda('1. Pembentukan Struktur Ketua Panitia HUT RI\n2. Anggaran & penggalangan dana sukarela warga\n3. Perencanaan daftar lomba anak-anak dan jalan sehat keluarga');
        setNotes('Mari bersama-sama kita meriahkan hari kemerdekaan bangsa kita dengan menyumbangkan ide, gagasan, serta gotong royong yang solid.');
        break;
      case 'halal_bihalal':
        setEventTitle('Silaturahmi & Halal Bihalal Akbar Warga RT 08');
        setLetterSubject('Undangan Silaturahmi & Halal Bihalal Idul Fitri');
        setAgenda('1. Pembukaan dan Doa Bersama untuk Keselamatan Paguyuban RT\n2. Ramah Tamah & Sesi Saling Memaafkan Antar Tetangga\n3. Makan bersama (sistem potluck / iuran prasmanan konsumsi)');
        setNotes('Mohon membawa serta anggota keluarga di rumah untuk mempererat ukhuwah serta menyambung silaturahmi yang harmonis.');
        break;
      case 'custom':
        break;
    }
  }, [template]);

  // Compose WA Text for invitation
  const generatedWhatsAppText = `*${rtTitle}*
*${rtAddress}*
*E-mail:* ${rtEmail}
_______________________________

*UNDANGAN DIGITAL / PEMBERITAHUAN*

*Yth. Penerima:*
${recipient}

Mengharap kehadiran Bapak/Ibu/Warga sekalian dalam agenda yang akan diselenggarakan pada:

📅 *Hari / Tanggal:* ${dayDate}
⏰ *Waktu:* ${time}
📍 *Tempat:* ${location}
📝 *Agenda Kegiatan:*
${agenda}

*Catatan Penting:*
_"${notes}"_

Demikian undangan ini disampaikan. Kehadiran dan kesediaan bapak/ibu warga sekalian merupakan wujud kepedulian nyata demi kemajuan rukun tetangga kita.

*Mengetahui,*
*Sekretaris RT:* ${usersList.find(u => u.role === 'sekretaris')?.nama || 'Sekretaris RT'}
*Ketua RT:* ${usersList.find(u => u.role === 'admin')?.nama || 'Bpk. Ketua RT'}
_Pesan Whatsapp ini dikirim secara resmi melalui Sistem Informasi Administrasi RT 08_`;

  const handleSendWhatsApp = () => {
    const encodedText = encodeURIComponent(generatedWhatsAppText);
    const waUrl = `https://api.whatsapp.com/send?text=${encodedText}`;
    window.open(waUrl, '_blank');
  };

  const handleCopyWAInvitation = () => {
    navigator.clipboard.writeText(generatedWhatsAppText);
    showToast('Teks Undangan digital disalin ke papan klip.');
  };

  // Signatures variables
  const adminUser = usersList.find(u => u.role === 'admin');
  const sekretarisUser = usersList.find(u => u.role === 'sekretaris');

  // Trigger print invitation with elegant administrative look style
  const handlePrintOfficialLetter = (overrideNo?: string, overrideSubject?: string, overrideRecipient?: string) => {
    const num = overrideNo || letterNumber;
    const subj = overrideSubject || letterSubject;
    const rec = overrideRecipient || recipient;

    const printDoc = {
      write: (htmlContent: string) => {
        printContentViaIframe(htmlContent);
      },
      close: () => {}
    };

    const todayString = new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    const villageName = getDesaName(rtAddress);
    const rtNum = getRtNumber(rtTitle);

    printDoc.write(`
      <html>
        <head>
          <title>Cetak Surat Undangan Resmi ${rtNum}</title>
          <style>
            @media print {
              * {
                visibility: visible !important;
              }
              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              body { margin: 1.5cm; }
            }
            body {
              font-family: 'Times New Roman', Times, serif;
              color: #000;
              line-height: 1.6;
              font-size: 11pt;
              margin: 2.5cm;
            }
            .kop-container {
              border-bottom: 4px double #000;
              padding-bottom: 5px;
              margin-bottom: 25px;
              text-align: center;
              position: relative;
            }
            .kop-org {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              margin: 0 0 5px 0;
              letter-spacing: 0.5px;
            }
            .kop-address {
              font-size: 10pt;
              font-style: italic;
              margin: 0 0 3px 0;
            }
            .kop-email {
              font-size: 9pt;
              margin: 0;
              font-family: Arial, sans-serif;
            }
            .letter-meta {
              display: flex;
              justify-content: space-between;
              margin-bottom: 25px;
            }
            .meta-left table {
              border-collapse: collapse;
            }
            .meta-left td {
              padding: 1px 5px 1px 0;
              vertical-align: top;
            }
            .recipient-block {
              margin-bottom: 25px;
              margin-left: 5px;
            }
            .recipient-block .yth {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .recipient-block .name {
              font-weight: bold;
              text-decoration: underline;
            }
            .opening-text {
              text-align: justify;
              text-indent: 1.25cm;
              margin-bottom: 15px;
            }
            .details-table {
              margin-left: 1.25cm;
              margin-bottom: 15px;
              border-collapse: collapse;
              width: 85%;
            }
            .details-table td {
              padding: 4px 6px;
              vertical-align: top;
            }
            .agenda-block {
              padding-left: 1.25cm;
              margin-bottom: 20px;
              text-align: justify;
            }
            .agenda-title {
              font-weight: bold;
              margin-bottom: 5px;
            }
            .closing-text {
              text-align: justify;
              text-indent: 1.25cm;
              margin-bottom: 35px;
            }
            .signatures-official {
              display: grid;
              grid-template-cols: 1fr 1fr;
              text-align: center;
              margin-top: 40px;
              page-break-inside: avoid;
            }
            .sig-title {
              font-weight: bold;
              margin-bottom: 70px;
              text-transform: uppercase;
            }
            .sig-name {
              font-weight: bold;
              text-decoration: underline;
              text-transform: uppercase;
            }
            .sig-nip {
              font-size: 9pt;
              font-family: monospace;
              color: #444;
              margin-top: 2px;
            }
            .btn-print {
              background-color: #0284c7;
              color: white;
              padding: 10px 20px;
              border: none;
              border-radius: 8px;
              font-weight: bold;
              font-size: 11pt;
              cursor: pointer;
              margin-bottom: 20px;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
            }
            .btn-container {
              display: flex;
              justify-content: center;
              margin-bottom: 30px;
            }
          </style>
        </head>
        <body>
          <div class="no-print btn-container">
            <button class="btn-print" onclick="window.print()">Cetak Surat Kop Resmi / Simpan PDF</button>
          </div>
          
          <div class="kop-container">
            <h1 class="kop-org">${rtTitle}</h1>
            <p class="kop-address">${rtAddress}</p>
            <p class="kop-email">E-mail: ${rtEmail} | Sidoarjo, Jawa Timur</p>
          </div>

          <div class="letter-meta">
            <div class="meta-left">
              <table>
                <tr>
                  <td>Nomor</td>
                  <td>:</td>
                  <td>${num}</td>
                </tr>
                <tr>
                  <td>Sifat</td>
                  <td>:</td>
                  <td>Penting / Segera</td>
                </tr>
                <tr>
                  <td>Lampiran</td>
                  <td>:</td>
                  <td>${attachments || '-'}</td>
                </tr>
                <tr>
                  <td>Perihal</td>
                  <td>:</td>
                  <td style="font-weight: bold;">${subj}</td>
                </tr>
              </table>
            </div>
            <div class="meta-right">
              Sidoarjo, ${todayString}
            </div>
          </div>

          <div class="recipient-block">
            <p class="yth">Kepada Yth.</p>
            <p class="name">${rec}</p>
            <p>Di tempat.</p>
          </div>

          <p class="opening-text">
            Dengan hormat, sehubungan dengan adanya beberapa program kemasyarakatan serta evaluasi administrasi dinas secara berkala, kami selaku Pengurus Rukun Tetangga mengharap dengan hormat kehadiran Bapak/Ibu/Saudara dalam pertemuan warga yang akan diselenggarakan besok pada:
          </p>

          <table class="details-table">
            <tr>
              <td style="width: 25%; font-weight: bold;">Hari / Tanggal</td>
              <td style="width: 3%;">:</td>
              <td>${dayDate}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Waktu</td>
              <td>:</td>
              <td>${time}</td>
            </tr>
            <tr>
              <td style="font-weight: bold;">Tempat</td>
              <td>:</td>
              <td>${location}</td>
            </tr>
          </table>

          <div class="agenda-block">
            <p class="agenda-title">Adapun Susunan Acara / Agenda Pembahasan:</p>
            <div style="white-space: pre-line; line-height: 1.6;">${agenda}</div>
          </div>

          <p class="closing-text">
            ${notes} Demikian surat undangan ini kami sampaikan, mengingat krusialnya agenda musyawarah mufakat ini maka perwakilan kehadiran sangat kami harapkan. Atas perhatian, dukungan, serta kerja sama bapak/ibu sekalian, kami sampaikan limpah terima kasih.
          </p>

          <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 40px; page-break-inside: avoid;">
            <tr>
              <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <p class="sig-title" style="font-family: sans-serif; font-size: 11px; margin-bottom: 50px;">Mengetahui,<br/>Sekretaris ${rtNum}</p>
                <p class="sig-name" style="font-family: sans-serif; font-size: 12px; font-weight: bold; text-decoration: underline;">${sekretarisUser ? cleanSignatureName(sekretarisUser.nama) : '..........................................'}</p>
                <p class="sig-nip" style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 2px;">NIP. 24.08.004.${rtNum.replace(/\D/g, '') || '008'}.03</p>
              </td>
              <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <p class="sig-title" style="font-family: sans-serif; font-size: 11px; margin-bottom: 50px;">Mengesahkan,<br/>Ketua ${rtNum} ${villageName}</p>
                <p class="sig-name" style="font-family: sans-serif; font-size: 12px; font-weight: bold; text-decoration: underline;">${adminUser ? cleanSignatureName(adminUser.nama) : '..........................................'}</p>
                <p class="sig-nip" style="font-family: monospace; font-size: 10px; color: #64748b; margin-top: 2px;">NIP. 24.08.004.${rtNum.replace(/\D/g, '') || '008'}.01</p>
              </td>
            </tr>
          </table>

        </body>
      </html>
    `);
    printDoc.close();
  };

  // TAB 3: PEMBUAT SURAT PENGANTAR RT ON BEHALF OF RESIDENTS REMOVED

  // Shortcut to switch tab and prepopulate parameters
  const openWriteInWorkflow = (letObj: OfficialLetter) => {
    setActiveTab('undangan');
    setLetterNumber(letObj.nomorSurat);
    setLetterSubject(letObj.perihal);
    setRecipient(letObj.penerima);
    if (letObj.jenisSurat === 'undangan_rapat') setTemplate('rapat');
    else if (letObj.jenisSurat === 'undangan_kerja_bakti') setTemplate('kerja_bakti');
    else if (letObj.jenisSurat === 'undangan_khusus') setTemplate('17_agustus');
    showToast(`Data log nomor "${letObj.nomorSurat}" dimuat ke formulir.`);
  };

  return (
    <div className="space-y-6">
      
      {/* Dynamic Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-[999] bg-slate-900 border border-slate-700 text-emerald-400 p-4 rounded-xl shadow-2xl flex items-center gap-3 max-w-sm animate-bounce text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Banner introducing Secretary task */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-white shadow-xl">
        <div className="space-y-1 bg-transparent">
          <div className="flex items-center gap-1.5 text-xs font-bold text-sky-450 font-mono uppercase tracking-widest bg-transparent">
            <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
            <span>Fasilitas Administrasi Persuratan &amp; Undangan Resmi</span>
          </div>
          <h2 className="text-md sm:text-lg font-black text-white bg-transparent">
            Buku Nomor Surat &amp; Undangan Resmi
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl bg-transparent font-medium">
            Kelola urutan nomor surat keluar secara konsekutif dinamis dan susun draf serta cetak undangan digital koordinasi warga rukun tetangga.
          </p>
        </div>
        
        <div className="flex items-center gap-2 p-2 px-3.5 bg-sky-500/15 border border-sky-400/30 rounded-xl text-sky-300 text-xs shrink-0 self-start md:self-center font-mono">
          <User className="w-3.5 h-3.5 text-sky-400" />
          <span>Operator: {currentUser?.role === 'sekretaris' ? 'Sekretaris (Aktif)' : 'Administrator'}</span>
        </div>
      </div>

      {/* Multi Tab Pills */}
      <div className="flex border-b border-slate-200 pb-px gap-1 bg-transparent overflow-x-auto scrollbar-none">
        <button
          onClick={() => setActiveTab('registrasi')}
          className={`px-4 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'registrasi'
              ? 'border-sky-600 text-sky-600 bg-sky-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Registrasi &amp; Data Warga</span>
        </button>
        <button
          onClick={() => setActiveTab('buku')}
          className={`px-4 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'buku'
              ? 'border-sky-600 text-sky-600 bg-sky-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Buku Nomor Surat Dinas</span>
        </button>
        <button
          onClick={() => setActiveTab('undangan')}
          className={`px-4 py-3 rounded-t-xl text-xs font-bold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
            activeTab === 'undangan'
              ? 'border-sky-600 text-sky-600 bg-sky-50/20'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <Mail className="w-4 h-4" />
          <span>Buat &amp; Draf Undangan</span>
        </button>

      </div>

      {/* TAB CONTENTS */}
      {activeTab === 'registrasi' && (
        <div className="space-y-6">
          {/* Stats board for warga */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs text-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Total Warga Terdaftar</p>
                <p className="text-lg font-black text-slate-900 mt-1">{wargaList.length} Kepala Keluarga</p>
              </div>
              <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                <Home className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs text-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Terdaftar KTP &amp; KK</p>
                <p className="text-lg font-black text-emerald-600 mt-1">
                  {wargaList.filter(w => w.noKtp && w.noKk).length} Warga
                </p>
              </div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>

            <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center justify-between shadow-xs text-slate-800">
              <div>
                <p className="text-[10px] text-slate-400 font-extrabold uppercase font-mono tracking-wider">Total Anggota Keluarga</p>
                <p className="text-lg font-black text-indigo-600 mt-1">
                  {wargaList.reduce((acc, w) => acc + (w.anggotaKeluarga?.length || 0), 0)} Jiwa
                </p>
              </div>
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </div>

          {/* Search bar and button actions */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs text-slate-800">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="flex flex-col md:flex-row gap-3 w-full lg:flex-1">
                {/* Search input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Cari warga berdasarkan nama atau nomor rumah..."
                    value={searchWarga}
                    onChange={(e) => setSearchWarga(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400"
                  />
                </div>

                {/* Block Filter */}
                <div className="relative w-full md:w-56 shrink-0">
                  <select
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    <option value="Semua">Blok: Semua</option>
                    {blocksList.map(b => (
                      <option key={b} value={b}>Blok {b}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Action buttons (Pdf/Excel + Add Warga Baru) */}
              <div className="w-full lg:w-auto flex flex-col md:flex-row items-center gap-2">
                <button
                  type="button"
                  onClick={() => exportAllWargaList(wargaList)}
                  className="bg-white hover:bg-sky-50/50 text-slate-750 hover:text-sky-600 text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 transition duration-150 cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1 w-full md:w-auto font-sans"
                >
                  <Printer className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                  Cetak / PDF
                </button>

                <button
                  type="button"
                  onClick={exportWargaToExcel}
                  className="bg-white hover:bg-emerald-50/40 text-slate-755 hover:text-emerald-700 text-xs font-bold px-3.5 py-3 rounded-xl border border-slate-200 transition duration-150 cursor-pointer shadow-xs whitespace-nowrap flex items-center justify-center gap-1 w-full md:w-auto font-sans"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  Ekspor Excel
                </button>

                {(currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
                  <>
                    <div className="relative w-full md:w-auto">
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={importWargaFromExcel}
                        className="hidden"
                        id="excel-import-file-warga"
                      />
                      <label
                        htmlFor="excel-import-file-warga"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3.5 py-3 rounded-xl transition duration-150 text-xs whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 shadow-xs w-full active:scale-95 text-center cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        Impor Excel
                      </label>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddWargaModal(true)}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-4 py-3 rounded-xl transition duration-150 text-xs whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 shadow-xs w-full md:w-auto active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      Tambah Warga Baru
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowAddRombongModal(true)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-3 rounded-xl transition duration-150 text-xs whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 shadow-xs w-full md:w-auto active:scale-95"
                    >
                      <Store className="w-3.5 h-3.5" />
                      Tambah Rombong Baru
                    </button>
                  </>
                )}

                {(currentUser?.role === 'admin' || currentUser?.role === 'sekretaris' || currentUser?.role === 'bendahara') && (
                  <button
                    type="button"
                    onClick={() => setShowSettingsModal(true)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-extrabold p-3.5 rounded-xl transition duration-150 text-xs cursor-pointer flex items-center justify-center shadow-xs w-full md:w-auto active:scale-95"
                    title="Pengaturan Parameter RT"
                  >
                    <Settings className="w-4 h-4 text-slate-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Citizen register view database table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs text-slate-800">
            {(() => {
              const filtered = wargaList.filter(w => {
                const q = searchWarga.toLowerCase();
                const matchesSearch = w.nama.toLowerCase().includes(q) || w.noRumah.toLowerCase().includes(q) || (w.noWa || '').includes(q);
                const matchesBlock = selectedBlock === 'Semua' || w.blok === selectedBlock;
                return matchesSearch && matchesBlock;
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-12 text-center bg-white">
                    <Search className="w-8 h-8 text-slate-305 mx-auto mb-2" />
                    <p className="text-slate-500 font-bold text-sm">Buku registry warga kosong atau hasil cari tidak ditemukan</p>
                    <p className="text-slate-400 text-xs mt-0.5">Silakan gunakan kata pencarian lain.</p>
                  </div>
                );
              }

              return (
                <div>
                  <div className="block md:hidden bg-sky-50 text-sky-700 border-b border-sky-100/55 px-4 py-2.5 text-[10px] sm:text-xs font-semibold">
                    💡 Geser tabel ke kanan untuk melihat rincian kolom (Nama Warga, KTP/KK, Keluarga, Aksi)
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[780px] text-left border-collapse table-auto text-xs">
                      <thead>
                        <tr className="bg-slate-50 text-slate-600 text-[10px] font-extrabold font-mono border-b border-slate-150 uppercase tracking-wider relative">
                          <th className="p-4 min-w-[175px] sm:min-w-[230px] w-[175px] sm:w-[230px] sticky left-0 bg-slate-50 z-10 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Nama Warga &amp; Rumah</th>
                          <th className="p-4 text-center">Registrasi KTP / KK</th>
                          <th className="p-4 text-center">Anggota Keluarga</th>
                          <th className="p-4 text-center">Aksi Pengurus</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {filtered.map((w) => (
                          <tr key={w.id} className="group hover:bg-slate-50/40 transition duration-100">
                            <td className="p-4 min-w-[175px] sm:min-w-[230px] w-[175px] sm:w-[230px] sticky left-0 z-5 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] bg-white group-hover:bg-slate-50 transition duration-100">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedWargaHistory(w);
                              }}
                              className="font-extrabold text-slate-900 hover:text-sky-600 transition hover:underline cursor-pointer text-left focus:outline-none"
                              title="Klik untuk cek detail berkas & keluarga"
                            >
                              {w.nama}
                            </button>
                            <div className="text-slate-450 text-[11px] font-mono mt-0.5 flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <Home className="w-3 h-3 text-sky-500 shrink-0" />
                                <span>Blok {w.blok} No. {w.noRumah}</span>
                              </div>
                              {w.noWa && (
                                <div className="pl-0.5">
                                  <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1 border border-emerald-100/50 w-fit select-all">
                                    <span className="text-emerald-500 font-bold shrink-0">📞 WA:</span> {w.noWa}
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center align-middle text-[10px] font-mono">
                            <div className="flex flex-col items-center justify-center gap-0.5">
                              {w.noKtp ? (
                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50/70 px-1.5 py-0.2 rounded border border-emerald-100">
                                  KTP: {w.noKtp}
                                </span>
                              ) : (
                                <span className="text-[9px] text-rose-500 font-bold bg-rose-50/70 px-1.5 py-0.2 rounded border border-rose-100">
                                  KTP Belum Teregistrasi
                                </span>
                              )}
                              {w.noKk ? (
                                <span className="text-[9px] text-indigo-600 font-bold bg-indigo-50/70 px-1.5 py-0.2 rounded border border-indigo-100">
                                  KK: {w.noKk}
                                </span>
                              ) : (
                                <span className="text-[9px] text-rose-500 font-bold bg-rose-50/70 px-1.5 py-0.2 rounded border border-rose-100">
                                  KK Belum Teregistrasi
                                </span>
                              )}
                            </div>
                          </td>

                          <td className="p-4 text-center align-middle">
                            {w.anggotaKeluarga && w.anggotaKeluarga.length > 0 ? (
                              <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-700 font-extrabold px-2 py-0.5 rounded-full text-[10px]">
                                <Users className="w-3 h-3" />
                                {w.anggotaKeluarga.length} Anggota
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400 italic">Hanya Kepala Keluarga</span>
                            )}
                          </td>

                          <td className="p-4 text-center align-middle relative">
                            <div className="relative inline-block text-left">
                              <button
                                type="button"
                                id={`adm-warga-actions-${w.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveDropdownWarga(activeDropdownWarga === w.id ? null : w.id);
                                }}
                                className="p-1.5 text-slate-500 hover:text-slate-850 hover:bg-slate-100 rounded-lg transition cursor-pointer border border-slate-200 bg-white shadow-3xs"
                                title="Aksi Pengurus"
                              >
                                <Settings className="w-4 h-4" />
                              </button>

                              {activeDropdownWarga === w.id && (
                                <div className="absolute right-0 mt-1 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedWargaHistory(w);
                                      setActiveDropdownWarga(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-705 hover:bg-slate-50 transition text-left font-semibold cursor-pointer"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span>Lihat Detail</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingWarga(w);
                                      setActiveDropdownWarga(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition border-t border-slate-100 text-left font-semibold cursor-pointer"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                    <span>Edit Warga</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteWarga(w.id, w.nama);
                                      setActiveDropdownWarga(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition border-t border-slate-100 text-left font-semibold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Hapus Warga</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* TAB CONTENTS */}
      {activeTab === 'buku' && (
        <div className="space-y-6">
          
          {/* Stats card banner */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-transparent">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Total Surat Tercatat</span>
              <span className="text-xl font-black text-slate-900 block">{lettersList.length}</span>
              <span className="text-[9px] text-slate-500 block">Surat keluar disetujui</span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Surat Undangan</span>
              <span className="text-xl font-black text-emerald-600 block">{lettersList.filter(l => l.jenisSurat.startsWith('undangan')).length}</span>
              <span className="text-[9px] text-slate-500 block">Koordinasi warga</span>
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Nomor Urut Berikutnya</span>
              <span className="text-sm font-bold text-slate-700 block truncate font-mono">
                {lettersList.length > 0 ? String(Math.max(...lettersList.map(l => {
                  const num = parseInt(l.nomorSurat, 10);
                  return isNaN(num) ? 0 : num;
                })) + 1).padStart(3, '0') : '001'}
              </span>
              <span className="text-[9px] text-emerald-500 block">Konsekutif Terjaga</span>
            </div>
          </div>

          {/* Quick toggle register button */}
          <div className="flex justify-between items-center bg-transparent gap-4">
            <h3 className="font-extrabold text-slate-800 text-sm font-sans flex items-center gap-2 bg-transparent">
              <Hash className="w-4 h-4 text-sky-600" />
              Buku Registrasi Berbagi Nomor Surat Resmi
            </h3>
            
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="py-2 px-4 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm flex items-center gap-1.5 cursor-pointer transition shrink-0"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{showAddForm ? 'Sembunyikan Form' : 'Register Nomor Baru'}</span>
            </button>
          </div>

          {/* Register New Form Section */}
          {showAddForm && (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl space-y-4 animate-fadeIn">
              <div className="border-b border-slate-200 pb-2 bg-transparent">
                <span className="font-extrabold text-slate-800 text-xs block font-mono">Form Registrasi Nomor Surat Keluar Baru</span>
                <span className="text-[10px] text-slate-500 block mt-0.5">Urutan nomor otomatis berdasarkan kalender tahun surat</span>
              </div>

              <form onSubmit={handleRegisterLetter} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                
                {/* Date */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono">Tanggal Surat dibuat</label>
                  <input 
                    type="date"
                    value={newLetterDate}
                    onChange={(e) => setNewLetterDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                    required
                  />
                </div>

                {/* Jenis Surat Selector */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono">Jenis Surat Dinas</label>
                  <select
                    value={newLetterType}
                    onChange={(e) => setNewLetterType(e.target.value as OfficialLetter['jenisSurat'])}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  >
                    <option value="undangan_rapat">Undangan Rapat</option>
                    <option value="undangan_kerja_bakti">Undangan Kerja Bakti</option>
                    <option value="undangan_khusus">Undangan Khusus</option>
                    <option value="custom">Surat Sifat Kustom</option>
                  </select>
                </div>

                {/* Suggested formualted number */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono">Nomor Urut Surat (Sistem &amp; Suku)</label>
                  <input 
                    type="text"
                    value={newLetterNo}
                    onChange={(e) => setNewLetterNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                    placeholder="Contoh: 013/RT-08/POPOH/VI/2026"
                    required
                  />
                </div>

                {/* Linked citizen selector */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono flex items-center gap-1">
                    <span>Hubungkan dengan Warga</span>
                    <span className="text-[9px] text-slate-400 font-normal">(Opsional)</span>
                  </label>
                  <select
                    value={selectedWargaId}
                    onChange={(e) => handleWargaSelectChange(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Bebas / Bukan Warga Individu --</option>
                    {wargaList.map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nama} - Blok {w.blok} No.{w.noRumah}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Recipient */}
                <div className="space-y-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono">Penerima Surat (Nama / Warga)</label>
                  <input 
                    type="text"
                    value={newLetterRecipient}
                    onChange={(e) => setNewLetterRecipient(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Contoh: Seluruh Warga RT 08"
                    required
                  />
                </div>

                {/* Perihal / Judul */}
                <div className="space-y-1 md:col-span-1">
                  <label className="block text-[11px] font-bold text-slate-600 font-mono">Sifat Surat / Perihal</label>
                  <input 
                    type="text"
                    value={newLetterSubject}
                    onChange={(e) => setNewLetterSubject(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    placeholder="Perihal surat"
                    required
                  />
                </div>



                {/* Submit */}
                <div className="md:col-span-3 pt-2 flex justify-end gap-2 bg-transparent">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="py-2 px-4 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-150 cursor-pointer transition border border-slate-200"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="py-2 px-5 rounded-xl text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 shadow-sm cursor-pointer transition"
                  >
                    Daftarkan Nomor Surat
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Letters Logs List */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            
            {/* Header controls */}
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
              <div className="relative flex-1 bg-transparent max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                <input
                  type="text"
                  value={searchLetter}
                  onChange={(e) => setSearchLetter(e.target.value)}
                  placeholder="Cari nomor, perihal, atau penerima surat..."
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-800"
                />
              </div>

              {/* Filters */}
              <div className="flex items-center gap-2 bg-transparent">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-[11px] font-bold text-slate-500 font-mono uppercase shrink-0">Filter:</span>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden bg-white">
                  {[
                    { id: 'all', label: 'Semua' },
                    { id: 'undangan', label: 'Undangan' },
                    { id: 'custom', label: 'Kustom' }
                  ].map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setFilterType(f.id)}
                      className={`px-3 py-1.5 text-xs font-bold border-r last:border-0 transition text-center cursor-pointer ${
                        filterType === f.id
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* List Table */}
            {filteredLetters.length === 0 ? (
              <div className="p-12 text-center bg-transparent text-slate-400 space-y-2">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <span className="block text-sm font-bold">Tidak ada surat dinas yang ditemukan</span>
                <span className="block text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Harap periksa kata pencarian atau silakan daftarkan rincian nomor surat keluar RT baru di atas.
                </span>
              </div>
            ) : (
              <div>
                <div className="block md:hidden bg-sky-50 text-sky-700 border-b border-sky-100/55 px-4 py-2.5 text-[10px] sm:text-xs font-semibold">
                  💡 Geser tabel ke kanan untuk melihat kolom No. Surat, Penerima, Petugas, dan Aksi secara utuh
                </div>
                <div className="overflow-x-auto bg-transparent">
                  <table className="w-full min-w-[850px] text-left border-collapse bg-transparent font-sans">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 text-[10px] uppercase font-bold tracking-wider font-mono">
                    <tr>
                      <th className="p-3.5 pl-6 text-center w-12">No</th>
                      <th className="p-3.5">Tanggal</th>
                      <th className="p-3.5">No. Surat Dinas</th>
                      <th className="p-3.5">Jenis / Perihal</th>
                      <th className="p-3.5">Penerima</th>
                      <th className="p-3.5">Petugas</th>
                      <th className="p-3.5 pr-6 text-center w-28">Aksi Terintegrasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700 text-xs font-medium">
                    {filteredLetters.map((l, index) => {
                      const dateFormatted = new Date(l.tanggalSurat).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      });
                      
                      let badgeColor = 'bg-slate-100 text-slate-600';
                      if (l.jenisSurat.startsWith('undangan')) badgeColor = 'bg-emerald-50 text-emerald-600 border border-emerald-100';

                      return (
                        <tr key={l.id} className="hover:bg-slate-50 transition">
                          <td className="p-3.5 text-center text-slate-400 font-mono">{index + 1}</td>
                          <td className="p-3.5 text-slate-500 font-mono">{dateFormatted}</td>
                          <td className="p-3.5">
                            <div className="flex items-center gap-1.5 bg-transparent">
                              <span className="font-mono font-extrabold text-slate-950 text-xs">{l.nomorSurat}</span>
                              <button 
                                onClick={() => handleCopyNo(l.nomorSurat)}
                                title="Salin nomor"
                                className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-sky-600 transition cursor-pointer"
                              >
                                <Copy className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="p-3.5 space-y-1">
                            <span className={`inline-block py-0.5 px-2 rounded-full text-[9px] font-black uppercase ${badgeColor}`}>
                              {l.jenisSurat.startsWith('undangan') ? 'Undangan' : 'Kustom'}
                            </span>
                            <span className="block font-semibold text-slate-800 text-[11px] leading-relaxed max-w-xs truncate">{l.perihal}</span>
                          </td>
                          <td className="p-3.5 font-bold text-slate-800 shrink-0 max-w-xxs truncate">{l.penerima}</td>
                          <td className="p-3.5 text-slate-450 text-[11px] font-mono">{l.createdBy}</td>
                          <td className="p-3.5 pr-6 bg-transparent text-center">
                            <div className="flex justify-center items-center gap-1 bg-transparent">
                              
                              {/* Open in editor workflows */}
                              <button
                                onClick={() => openWriteInWorkflow(l)}
                                title="Muat di Editor Surat"
                                className="p-1 px-1.5 hover:bg-sky-50 border border-transparent hover:border-sky-100 rounded-lg text-slate-400 hover:text-sky-600 font-bold transition text-[10px] py-1 cursor-pointer"
                              >
                                Layout
                              </button>

                              {/* Direct print */}
                              <button
                                onClick={() => {
                                  handlePrintOfficialLetter(l.nomorSurat, l.perihal, l.penerima);
                                }}
                                title="Cetak Surat Fisik"
                                className="p-1.5 hover:bg-sky-100 text-slate-400 hover:text-sky-600 rounded-lg transition cursor-pointer"
                              >
                                <Printer className="w-3.5 h-3.5" />
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDeleteLetter(l.id, l.nomorSurat)}
                                title="Hapus registrasi"
                                className="p-1.5 hover:bg-rose-50 text-slate-300 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                id={`del-letter-${l.id}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>

                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'undangan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Editor Form Panel (6 Columns) */}
          <div className="lg:col-span-6 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-5">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center bg-transparent">
              <h3 className="font-extrabold text-slate-900 text-sm font-sans flex items-center gap-2 bg-transparent">
                <FileText className="w-4 h-4 text-sky-600" />
                Pembuat Draf Undangan Warga
              </h3>
              
              <div className="text-slate-400 text-[10px] font-mono leading-none">
                RT 08 Larangan
              </div>
            </div>

            {/* Selector Template */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">
                Pilih Kategori / Templat Rapat
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-1.5">
                {[
                  { id: 'rapat', label: 'Rapat RT' },
                  { id: 'kerja_bakti', label: 'Kerja Bakti' },
                  { id: '17_agustus', label: '17 Agustus' },
                  { id: 'halal_bihalal', label: 'Halal Bihalal' },
                  { id: 'custom', label: 'Custom' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTemplate(t.id as InvitationTemplate)}
                    className={`py-2 px-1 rounded-xl text-[10px] font-black text-center transition cursor-pointer border ${
                      template === t.id
                        ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Picks from register or manual */}
              <div className="md:col-span-2 p-3 bg-sky-500/5 rounded-xl border border-sky-500/10 space-y-1.5">
                <label className="block text-[10px] font-black text-sky-800 uppercase tracking-wide font-mono">
                  Gunakan No. Surat dari Buku Registrasi?
                </label>
                <select
                  value={letterNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setLetterNumber(val);
                    const matched = lettersList.find(l => l.nomorSurat === val);
                    if (matched) {
                      setLetterSubject(matched.perihal);
                      setRecipient(matched.penerima);
                    }
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                >
                  <option value="">-- Ketik Bebas / Custom --</option>
                  {lettersList.filter(l => l.jenisSurat.startsWith('undangan')).map(l => (
                    <option key={l.id} value={l.nomorSurat}>
                      [{l.tanggalSurat}] - {l.nomorSurat} ({l.penerima})
                    </option>
                  ))}
                </select>
                <p className="text-[9px] text-slate-400 font-semibold leading-relaxed">
                  Sangat disarankan mendaftarkan nomor terlebih dahulu di tab "Buku Nomor Surat" agar urutan selalu terjaga otomatis.
                </p>
              </div>

              {/* Letter number */}
              <div className="space-y-1.5 col-span-1">
                <label className="block text-xs font-semibold text-slate-700 font-mono">Nomor Lampiran Surat</label>
                <input
                  type="text"
                  value={letterNumber}
                  onChange={(e) => setLetterNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                  placeholder="Kop No. Surat"
                />
              </div>

              {/* Subject */}
              <div className="space-y-1.5 col-span-1">
                <label className="block text-xs font-semibold text-slate-700 font-mono">Perihal Lampiran</label>
                <input
                  type="text"
                  value={letterSubject}
                  onChange={(e) => setLetterSubject(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                  placeholder="Subject surat dinas"
                />
              </div>

              {/* Recipient */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono font-sans">Kepada Yth. (Penerima)</label>
                <input
                  type="text"
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold"
                  placeholder="cth. Seluruh Warga RT 08"
                />
              </div>

              {/* Nama Agenda / Judul Kegiatan */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono">Judul Kegiatan Pertemuan</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              {/* Hari / Tanggal */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Hari / Tanggal Kegiatan</span>
                </label>
                <input
                  type="text"
                  value={dayDate}
                  onChange={(e) => setDayDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium font-sans"
                  placeholder="Sunday / Date"
                />
              </div>

              {/* Jam / Waktu */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>Jam Pelaksanaan</span>
                </label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium font-sans"
                />
              </div>

              {/* Tempat */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>Tempat Pertemuan</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              {/* Agenda List detail */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono">Agenda Rapat (Angka baris baru)</label>
                <textarea
                  rows={4}
                  value={agenda}
                  onChange={(e) => setAgenda(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans leading-relaxed"
                  placeholder="Detail agenda"
                />
              </div>

              {/* Catatan Tambahan */}
              <div className="md:col-span-2 space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700 font-mono">Pesan Catatan Kaki / Penutup</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 leading-relaxed"
                />
              </div>

            </div>
          </div>

          {/* Preview Panel (6 Columns) */}
          <div className="lg:col-span-6 space-y-4">
            <div className="bg-slate-900 rounded-2xl p-5 border border-slate-800 text-white shadow-md">
              <div className="flex border-b border-slate-800 pb-3 justify-between items-center bg-transparent">
                <span className="text-xs font-bold text-sky-450 uppercase font-mono tracking-wider flex items-center gap-2 bg-transparent">
                  <MessageSquare className="w-4 h-4 text-sky-400" />
                  Output Generator &amp; Format
                </span>
                
                {/* Format selection */}
                <div className="flex rounded-lg bg-slate-800 border border-slate-700 p-0.5 select-none shrink-0">
                  <button
                    onClick={() => setActiveFormatTab('wa')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                      activeFormatTab === 'wa' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Format WA
                  </button>
                  <button
                    onClick={() => setActiveFormatTab('kop')}
                    className={`px-3 py-1 text-[10px] font-bold rounded-md transition cursor-pointer ${
                      activeFormatTab === 'kop' ? 'bg-sky-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Format Kop Cetak
                  </button>
                </div>
              </div>

              <div className="mt-4 bg-transparent">
                {activeFormatTab === 'wa' ? (
                  <div className="space-y-4 bg-transparent">
                    <div className="p-3 bg-slate-950 rounded-xl border border-slate-850 font-mono text-slate-300 text-[11px] whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                      {generatedWhatsAppText}
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 bg-transparent pt-2">
                      <button
                        onClick={handleCopyWAInvitation}
                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 flex items-center justify-center gap-2 transition shadow-sm cursor-pointer"
                      >
                        <Copy className="w-4 h-4" />
                        <span>Salin Teks Undangan</span>
                      </button>
                      
                      <button
                        onClick={handleSendWhatsApp}
                        className="flex-1 py-3 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 transition shadow-sm cursor-pointer border border-emerald-550"
                      >
                        <Send className="w-4 h-4" />
                        <span>Kirim ke WhatsApp</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 bg-transparent text-slate-800">
                    <div className="p-5 bg-white border border-slate-200 rounded-xl space-y-4 text-[10px] shadow-sm max-h-96 overflow-y-auto font-serif">
                      
                      {/* Kop surat mockup */}
                      <div className="border-b-2 border-black pb-2 text-center text-black">
                        <span className="font-extrabold text-sm block tracking-wide">{rtTitle}</span>
                        <span className="text-[9px] block italic font-sans">{rtAddress}</span>
                        <span className="text-[8px] block font-sans">E-mail: {rtEmail} | Sidoarjo, Jawa Timur</span>
                      </div>

                      <div className="flex justify-between bg-transparent text-black text-[9px]">
                        <div>
                          <br />Nomor &nbsp; : {letterNumber}
                          <br />Perihal : <strong>{letterSubject}</strong>
                        </div>
                        <div>
                          Sidoarjo, {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                        </div>
                      </div>

                      <div className="text-black text-[9px]">
                        <strong>Kepada Yth.</strong><br />
                        <u>{recipient}</u><br />
                        Di tempat.
                      </div>

                      <p className="text-justify text-black leading-relaxed">
                        Dengan hormat, mengharap kehadiran bapak/ibu sekalian untuk mengikuti program acara rapat <strong>{eventTitle}</strong> pada hari <strong>{dayDate}</strong> bertempat di {location}.
                      </p>

                      {/* Print button */}
                      <div className="pt-4 flex justify-center bg-transparent">
                        <button
                          onClick={() => handlePrintOfficialLetter()}
                          className="py-2.5 px-6 rounded-xl text-xs font-extrabold text-white bg-sky-600 hover:bg-sky-700 flex items-center gap-2 cursor-pointer shadow-sm transition"
                        >
                          <Printer className="w-4 h-4" />
                          <span>Mulai Cetak / Simpan PDF</span>
                        </button>
                      </div>

                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}



      {/* Add Rombong Form Modal Overlay */}
      {showAddRombongModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-w-lg w-full">
            <button 
              type="button"
              onClick={() => setShowAddRombongModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Store className="w-5 h-5 text-emerald-600" />
              Pendaftaran Lapak Rombong Baru RT 08
            </h4>
            <form onSubmit={handleAddRombong} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nama Pemilik / Usaha</label>
                <input 
                  required
                  type="text"
                  placeholder="cth: Suryono (Martabak Bangka)"
                  value={newRombong.namaPemilik}
                  onChange={e => setNewRombong({...newRombong, namaPemilik: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor Lapak</label>
                <input 
                  required
                  type="text"
                  placeholder="cth: Lapak-05, Stand-02"
                  value={newRombong.noLapak}
                  onChange={e => setNewRombong({...newRombong, noLapak: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Lokasi Rombong</label>
                <input 
                  type="text"
                  placeholder="cth: Samping Gapura Perumahan"
                  value={newRombong.lokasi}
                  onChange={e => setNewRombong({...newRombong, lokasi: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor WhatsApp (Penagihan)</label>
                <input 
                  type="text"
                  placeholder="cth: 08123456789"
                  value={newRombong.noWa}
                  onChange={e => setNewRombong({...newRombong, noWa: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                />
              </div>

              {/* Unggah Foto Rombong */}
              <div className="bg-slate-50 border border-dashed border-slate-250 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 text-center w-full">Foto Rombong / Gerobak Dagang (Opsional)</label>
                {newRombong.fotoBase64 ? (
                  <div className="relative group w-32 h-32 border rounded-xl overflow-hidden shadow-xs bg-white">
                    <img src={newRombong.fotoBase64} alt="Rombong Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setNewRombong({...newRombong, fotoBase64: '', fotoNamaFile: ''});
                      }}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                      title="Hapus Bukti"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <Camera className="w-8 h-8 mb-1 text-slate-350 pointer-events-none" />
                    <span className="text-[10px] text-slate-500 font-semibold mb-1 text-center max-w-[280px]">Unggah foto rombong jualan, gerobak, atau depot usaha pedagang</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setNewRombong({
                              ...newRombong,
                              fotoBase64: compressed,
                              fotoNamaFile: file.name
                            });
                          } catch (err) {
                            console.error(err);
                            alert('Gagal mengompres gambar.');
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer hidden"
                      id="upload-foto-rombong-baru"
                    />
                    <label
                      htmlFor="upload-foto-rombong-baru"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-705 border border-slate-205 hover:border-slate-305 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm transition animate-none"
                    >
                      Pilih Foto Rombong
                    </label>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddRombongModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-850 text-sm transition cursor-pointer font-semibold"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-emerald-600/10 cursor-pointer"
                >
                  Simpan Rombong
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Warga Modal Overlay */}
      {showAddWargaModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-w-3xl w-full max-h-[92vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setShowAddWargaModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-sky-600" />
              Pendaftaran Keluarga Warga Baru RT 08
            </h4>
            <form onSubmit={handleAddWarga} className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nama Lengkap Kepala Keluarga</label>
                <input 
                  required
                  type="text"
                  placeholder="cth: Bambang Utomo"
                  value={newWarga.nama}
                  onChange={e => setNewWarga({...newWarga, nama: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Blok Rumah</label>
                <select
                  value={newWarga.blok}
                  onChange={e => setNewWarga({...newWarga, blok: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
                >
                  {blocksList.map(b => (
                    <option key={b} value={b}>Blok {b}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor Rumah</label>
                <input 
                  required
                  type="text"
                  placeholder="cth: 24, 02A"
                  value={newWarga.noRumah}
                  onChange={e => setNewWarga({...newWarga, noRumah: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor WhatsApp (Penagihan)</label>
                <input 
                  type="text"
                  placeholder="cth: 08123456789"
                  value={newWarga.noWa}
                  onChange={e => setNewWarga({...newWarga, noWa: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor KTP (16 Digit - Opsional)</label>
                <input 
                  type="text"
                  maxLength={16}
                  placeholder="cth: 3515XXXXXXXXXXXX"
                  value={newWarga.noKtp || ''}
                  onChange={e => setNewWarga({...newWarga, noKtp: e.target.value.replace(/\D/g, '')})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono placeholder-slate-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor KK (16 Digit - Opsional)</label>
                <input 
                  type="text"
                  maxLength={16}
                  placeholder="cth: 3515XXXXXXXXXXXX"
                  value={newWarga.noKk || ''}
                  onChange={e => setNewWarga({...newWarga, noKk: e.target.value.replace(/\D/g, '')})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono placeholder-slate-400"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Alamat Lengkap Asal KTP (Opsional - Cek KTP Asli/Luar Daerah)</label>
                <textarea 
                  placeholder="cth: Jl. Gajah Mada No. 45, RT 01 RW 02, Kec. Jetis, Sidoarjo (Sesuai KTP Asal)"
                  value={newWarga.alamatKtpAsal || ''}
                  onChange={e => setNewWarga({...newWarga, alamatKtpAsal: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans placeholder-slate-400"
                  rows={2}
                />
              </div>

              {/* Unggah KTP */}
              <div className="md:col-span-1.5 bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5 font-mono">FC / Foto Scan KTP</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setNewWarga({
                              ...newWarga,
                              ktpBase64: base64,
                              ktpNamaFile: file.name
                            });
                          } catch (err) {
                            alert('Gagal memproses berkas KTP.');
                          }
                        }
                      }}
                      className="hidden"
                      id="add-new-ktp-file"
                    />
                    <label htmlFor="add-new-ktp-file" className="bg-sky-50 hover:bg-sky-100/70 text-sky-700 cursor-pointer text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-sky-200/50 transition whitespace-nowrap">
                      {newWarga.ktpBase64 ? 'Ganti' : 'Pilih Foto'}
                    </label>
                    <span className="text-[10px] text-slate-450 truncate max-w-[130px]" title={newWarga.ktpNamaFile}>
                      {newWarga.ktpNamaFile || (newWarga.ktpBase64 ? 'Foto_KTP.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {newWarga.ktpBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 shrink-0">
                    <div className="w-10 h-7 bg-slate-100 rounded border overflow-hidden">
                      <img src={newWarga.ktpBase64} alt="KTP Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setNewWarga({...newWarga, ktpBase64: '', ktpNamaFile: ''})}
                      className="text-red-500 hover:text-red-700 text-[10px] font-bold transition"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                )}
              </div>

              {/* Unggah KK */}
              <div className="md:col-span-1.5 bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5 font-mono">FC / Foto Scan KK</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setNewWarga({
                              ...newWarga,
                              kkBase64: base64,
                              kkNamaFile: file.name
                            });
                          } catch (err) {
                            alert('Gagal memproses berkas KK.');
                          }
                        }
                      }}
                      className="hidden"
                      id="add-new-kk-file"
                    />
                    <label htmlFor="add-new-kk-file" className="bg-emerald-50 hover:bg-emerald-100/70 text-emerald-700 cursor-pointer text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-emerald-200/50 transition whitespace-nowrap">
                      {newWarga.kkBase64 ? 'Ganti' : 'Pilih Foto'}
                    </label>
                    <span className="text-[10px] text-slate-450 truncate max-w-[130px]" title={newWarga.kkNamaFile}>
                      {newWarga.kkNamaFile || (newWarga.kkBase64 ? 'Foto_KK.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {newWarga.kkBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 shrink-0">
                    <div className="w-10 h-7 bg-slate-100 rounded border overflow-hidden">
                      <img src={newWarga.kkBase64} alt="KK Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setNewWarga({...newWarga, kkBase64: '', kkNamaFile: ''})}
                      className="text-red-500 hover:text-red-700 text-[10px] font-bold transition"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                )}
              </div>

              {/* Unggah Foto Profil Warga */}
              <div className="md:col-span-3 bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5 font-mono">Foto Profil Warga / Rombong Rumah (Opsional)</label>
                  <div className="flex items-center gap-2">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setNewWarga({
                              ...newWarga,
                              fotoBase64: base64,
                              fotoNamaFile: file.name
                            });
                          } catch (err) {
                            alert('Gagal memproses foto profil warga.');
                          }
                        }
                      }}
                      className="hidden"
                      id="add-new-photo-file"
                    />
                    <label htmlFor="add-new-photo-file" className="bg-amber-50 hover:bg-amber-100/70 text-amber-700 cursor-pointer text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-amber-200/50 transition whitespace-nowrap">
                      {newWarga.fotoBase64 ? 'Ganti Foto' : 'Pilih Foto'}
                    </label>
                    <span className="text-[10px] text-slate-450 truncate max-w-[200px]" title={newWarga.fotoNamaFile}>
                      {newWarga.fotoNamaFile || (newWarga.fotoBase64 ? 'Foto_Profil.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {newWarga.fotoBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 shrink-0">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border shadow-xs">
                      <img src={newWarga.fotoBase64} alt="Foto Profil Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setNewWarga({...newWarga, fotoBase64: '', fotoNamaFile: ''})}
                      className="text-red-500 hover:text-red-700 text-[10px] font-bold transition"
                    >
                      Hapus Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Fitur Warga Baru (Bebas Iuran Sebelum Menempati) */}
              <div className="md:col-span-3 bg-sky-50/50 border border-sky-100 rounded-xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-2">
                  <input 
                    type="checkbox"
                    id="checkbox-warga-baru-undangan"
                    checked={newWarga.isWargaBaru}
                    onChange={e => setNewWarga({...newWarga, isWargaBaru: e.target.checked})}
                    className="mt-1 w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 focus:outline-none cursor-pointer"
                  />
                  <div>
                    <label htmlFor="checkbox-warga-baru-undangan" className="block text-xs font-bold text-slate-800 cursor-pointer font-sans select-none">
                      Tandai Sebagai "Warga Baru" (Baru Pindah/Menempati)
                    </label>
                    <p className="text-[10px] text-slate-450 mt-0.5">
                      Bebaskan tagihan bulanan secara otomatis pada masa sebelum warga menempati rumah ini.
                    </p>
                  </div>
                </div>

                {newWarga.isWargaBaru && (
                  <div className="flex flex-wrap items-center gap-1 bg-white border border-sky-100 p-1.5 rounded-lg shrink-0">
                    <span className="text-[11px] font-bold text-slate-600">Simulasi Tagihan Mulai:</span>
                    
                    <select
                      value={newWarga.mulaiBulan}
                      onChange={e => setNewWarga({...newWarga, mulaiBulan: e.target.value})}
                      className="bg-slate-50 border border-slate-200 rounded-md py-1 px-1.5 text-xs text-slate-800 focus:outline-none font-semibold cursor-pointer"
                    >
                      {fullMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={newWarga.mulaiTahun}
                      onChange={e => setNewWarga({...newWarga, mulaiTahun: Number(e.target.value)})}
                      className="bg-slate-50 border border-slate-200 rounded-md py-1 px-1.5 text-xs text-slate-800 focus:outline-none font-semibold cursor-pointer"
                    >
                      {(yearsList || [2024, 2025, 2026, 2027, 2028]).map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Anggota Keluarga */}
              <div className="md:col-span-3 border-t border-slate-100 pt-4 mt-1">
                <h5 className="text-xs font-bold text-slate-705 font-sans uppercase mb-3 flex items-center gap-1">
                  <Users className="w-4 h-4 text-sky-600" />
                  Anggota Keluarga Serumah ({newWarga.anggotaKeluarga?.length || 0})
                </h5>
                
                {/* List of currently added members */}
                <div className="space-y-1.5 mb-3">
                  {(!newWarga.anggotaKeluarga || newWarga.anggotaKeluarga.length === 0) ? (
                    <p className="text-[10px] text-slate-450 italic bg-slate-50 p-3 rounded-xl border border-slate-150">
                      Belum ada anggota keluarga serumah yang dimasukkan.
                    </p>
                  ) : (
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                      {newWarga.anggotaKeluarga.map((member, i) => (
                        <div key={member.id || i} className="bg-slate-50 border border-slate-150 rounded-xl p-2 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-extrabold text-slate-800">{member.nama}</div>
                            <div className="flex flex-wrap gap-2 text-[9px] text-slate-500 font-bold mt-0.5">
                              <span>Hubungan: <span className="text-slate-755">{member.hubungan}</span></span>
                              {member.nik && <span>• NIK: <span className="font-mono text-slate-600">{member.nik}</span></span>}
                              {member.noHape && <span>• Tlpn: <span className="font-mono text-emerald-600">{member.noHape}</span></span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(member.id)}
                            className="p-1 px-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded border border-rose-200 cursor-pointer text-xs"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form inline to add a member */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1 font-mono">
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Anggota Keluarga Baru
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 col-span-1 mb-1">Nama Lengkap</label>
                      <input
                        type="text"
                        placeholder="Nama"
                        value={tempMember.nama}
                        onChange={e => setTempMember({...tempMember, nama: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Hubungan</label>
                      <select
                        value={tempMember.hubungan}
                        onChange={e => setTempMember({...tempMember, hubungan: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
                      >
                        {['Istri', 'Anak', 'Orang Tua', 'Mertua', 'Kerabat', 'Asisten Rumah Tangga', 'Lainnya'].map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">NIK (16 Digit - Opsional)</label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="3515XXXXXXXXXXXX"
                        value={tempMember.nik}
                        onChange={e => setTempMember({...tempMember, nik: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">No. WhatsApp (Opsional)</label>
                      <input
                        type="text"
                        placeholder="08XXXXXXXXXX"
                        value={tempMember.noHape}
                        onChange={e => setTempMember({...tempMember, noHape: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!tempMember.nama.trim()}
                      onClick={addFamilyMemberToList}
                      className="px-3 py-1.5 bg-sky-50 border border-sky-150 text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pasangkan Anggota KK
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setShowAddWargaModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs transition font-bold"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md shadow-sky-600/10 cursor-pointer active:scale-95 transition"
                >
                  Daftarkan &amp; Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Edit Warga Modal Overlay */}
      {editingWarga && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white border border-slate-205 rounded-2xl max-w-xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setEditingWarga(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-850 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-sky-600" />
              Edit Informasi Kepala Keluarga (Warga)
            </h4>
            <form onSubmit={handleEditWargaSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nama Lengkap</label>
                <input 
                  required
                  type="text"
                  value={editingWarga.nama}
                  onChange={e => setEditingWarga({...editingWarga, nama: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Blok Rumah</label>
                  <select
                    value={editingWarga.blok}
                    onChange={e => setEditingWarga({...editingWarga, blok: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
                  >
                    {blocksList.map(b => (
                      <option key={b} value={b}>Blok {b}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor Rumah</label>
                  <input 
                    required
                    type="text"
                    value={editingWarga.noRumah}
                    onChange={e => setEditingWarga({...editingWarga, noRumah: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor WhatsApp (Penagihan)</label>
                <input 
                  type="text"
                  value={editingWarga.noWa || ''}
                  placeholder="Format: 08123456789"
                  onChange={e => setEditingWarga({...editingWarga, noWa: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor KTP (16 Digit - Opsional)</label>
                  <input 
                    type="text"
                    maxLength={16}
                    placeholder="Masukkan 16 digit KTP"
                    value={editingWarga.noKtp || ''}
                    onChange={e => setEditingWarga({...editingWarga, noKtp: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor KK (16 Digit - Opsional)</label>
                  <input 
                    type="text"
                    maxLength={16}
                    placeholder="Masukkan 16 digit KK"
                    value={editingWarga.noKk || ''}
                    onChange={e => setEditingWarga({...editingWarga, noKk: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Alamat Lengkap Asal KTP (Opsional - Cek KTP Asli/Luar Daerah)</label>
                <textarea 
                  placeholder="Masukkan alamat lengkap asal sesuai KTP"
                  value={editingWarga.alamatKtpAsal || ''}
                  onChange={e => setEditingWarga({...editingWarga, alamatKtpAsal: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans"
                  rows={2}
                />
              </div>

              {/* Edit Uploader KTP */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5 font-mono">FC / Foto Scan KTP</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setEditingWarga({
                              ...editingWarga,
                              ktpBase64: base64,
                              ktpNamaFile: file.name
                            });
                          } catch (err) {
                            alert('Gagal memproses berkas KTP.');
                          }
                        }
                      }}
                      className="hidden"
                      id="edit-ktp-file-input"
                    />
                    <label htmlFor="edit-ktp-file-input" className="bg-sky-50 hover:bg-sky-100 text-sky-750 cursor-pointer text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-sky-200/50 transition">
                      {editingWarga.ktpBase64 ? 'Ganti Foto' : 'Unggah Foto'}
                    </label>
                    <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={editingWarga.ktpNamaFile}>
                      {editingWarga.ktpNamaFile || (editingWarga.ktpBase64 ? 'Foto_KTP.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {editingWarga.ktpBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 pb-0.5">
                    <div className="w-10 h-7 bg-slate-100 rounded border overflow-hidden">
                      <img src={editingWarga.ktpBase64} alt="KTP Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setEditingWarga({...editingWarga, ktpBase64: undefined, ktpNamaFile: undefined})}
                      className="text-red-500 hover:text-red-700 text-xs font-bold transition"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Uploader KK */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5 font-mono">FC / Foto Scan KK</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setEditingWarga({
                              ...editingWarga,
                              kkBase64: base64,
                              kkNamaFile: file.name
                            });
                          } catch (err) {
                            alert('Gagal memproses berkas KK.');
                          }
                        }
                      }}
                      className="hidden"
                      id="edit-kk-file-input"
                    />
                    <label htmlFor="edit-kk-file-input" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-755 cursor-pointer text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-emerald-200/50 transition">
                      {editingWarga.kkBase64 ? 'Ganti Foto' : 'Unggah Foto'}
                    </label>
                    <span className="text-[10px] text-slate-550 truncate max-w-[150px]" title={editingWarga.kkNamaFile}>
                      {editingWarga.kkNamaFile || (editingWarga.kkBase64 ? 'Foto_KK.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {editingWarga.kkBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 pb-0.5">
                    <div className="w-10 h-7 bg-slate-100 rounded border overflow-hidden">
                      <img src={editingWarga.kkBase64} alt="KK Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setEditingWarga({...editingWarga, kkBase64: undefined, kkNamaFile: undefined})}
                      className="text-red-500 hover:text-red-700 text-xs font-bold transition"
                    >
                      Hapus Berkas
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Uploader Foto Profil */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-705 mb-1.5 font-mono">Foto Profil Warga / Rombong Rumah</label>
                  <div className="flex items-center gap-3">
                    <input 
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const base64 = await compressImage(file);
                            setEditingWarga({
                              ...editingWarga,
                              fotoBase64: base64,
                              fotoNamaFile: file.name
                            });
                          } catch (err) {
                            alert('Gagal memproses foto profil.');
                          }
                        }
                      }}
                      className="hidden"
                      id="edit-profile-photo-input"
                    />
                    <label htmlFor="edit-profile-photo-input" className="bg-amber-50 hover:bg-amber-100 text-amber-705 cursor-pointer text-[10px] font-extrabold px-3 py-1.5 rounded-lg border border-amber-200/50 transition">
                      {editingWarga.fotoBase64 ? 'Ganti Foto' : 'Unggah Foto'}
                    </label>
                    <span className="text-[10px] text-slate-500 truncate max-w-[150px]" title={editingWarga.fotoNamaFile}>
                      {editingWarga.fotoNamaFile || (editingWarga.fotoBase64 ? 'Foto_Profil.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {editingWarga.fotoBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-200/60 pt-2 pb-0.5">
                    <div className="w-10 h-10 bg-slate-100 rounded-xl overflow-hidden border shadow-xs">
                      <img src={editingWarga.fotoBase64} alt="Foto Profil Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <button 
                      type="button" 
                      onClick={() => setEditingWarga({...editingWarga, fotoBase64: undefined, fotoNamaFile: undefined})}
                      className="text-red-500 hover:text-red-700 text-xs font-bold transition"
                    >
                      Hapus Foto
                    </button>
                  </div>
                )}
              </div>

              {/* Bagian Anggota Keluarga */}
              <div className="border-t border-slate-100 pt-3">
                <h5 className="text-xs font-bold text-slate-705 font-sans uppercase mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600" />
                  Anggota Keluarga Serumah ({editingWarga.anggotaKeluarga?.length || 0})
                </h5>
                
                {/* List of currently added members */}
                <div className="space-y-1.5 mb-3">
                  {(!editingWarga.anggotaKeluarga || editingWarga.anggotaKeluarga.length === 0) ? (
                    <p className="text-[10px] text-slate-450 italic bg-slate-50 p-3 rounded-xl border border-slate-150">
                      Belum ada anggota keluarga serumah yang terdaftar.
                    </p>
                  ) : (
                    <div className="max-h-[150px] overflow-y-auto space-y-1.5 pr-1">
                      {editingWarga.anggotaKeluarga.map((member, i) => (
                        <div key={member.id || i} className="bg-slate-50 border border-slate-155 rounded-xl p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-extrabold text-slate-800">{member.nama}</div>
                            <div className="flex flex-wrap gap-2 text-[9px] text-slate-500 font-bold mt-0.5">
                              <span>Hubungan: <span className="text-slate-700">{member.hubungan}</span></span>
                              {member.nik && <span>• NIK: <span className="font-mono text-slate-600">{member.nik}</span></span>}
                              {member.noHape && <span>• Tlpn: <span className="font-mono text-emerald-600">{member.noHape}</span></span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(member.id)}
                            className="p-1 px-1.5 bg-rose-50 border border-rose-200 text-rose-600 rounded-lg cursor-pointer transition text-[10px] hover:bg-rose-100"
                            title="Hapus anggota keluarga"
                          >
                            <Trash className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form inline to add a member */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-[10px] font-extrabold text-slate-500 tracking-wider uppercase flex items-center gap-1 font-mono">
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Anggota Keluarga
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Anggota</label>
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={tempMember.nama}
                        onChange={e => setTempMember({...tempMember, nama: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Hubungan</label>
                      <select
                        value={tempMember.hubungan}
                        onChange={e => setTempMember({...tempMember, hubungan: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
                      >
                        {['Istri', 'Anak', 'Orang Tua', 'Mertua', 'Kerabat', 'Asisten Rumah Tangga', 'Lainnya'].map(role => (
                          <option key={role} value={role}>{role}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">NIK (16 Digit - Opsional)</label>
                      <input
                        type="text"
                        maxLength={16}
                        placeholder="3515XXXXXXXXXXXX"
                        value={tempMember.nik}
                        onChange={e => setTempMember({...tempMember, nik: e.target.value.replace(/\D/g, '')})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono placeholder-slate-400"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">WhatsApp (Opsional)</label>
                      <input
                        type="text"
                        placeholder="08XXXXXXXXXX"
                        value={tempMember.noHape}
                        onChange={e => setTempMember({...tempMember, noHape: e.target.value})}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!tempMember.nama.trim()}
                      onClick={addFamilyMemberToList}
                      className="px-3 py-1.5 bg-sky-50 border border-sky-150 text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Sematkan Anggota
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setEditingWarga(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs transition cursor-pointer font-bold"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs shadow-md cursor-pointer active:scale-95 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* Detail Warga & Berkas Dialog Overlay */}
      {selectedWargaHistory && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-850">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-h-[92vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setSelectedWargaHistory(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-4">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm">Profil Detail &amp; Berkas Registrasi</h4>
                <p className="text-xs text-slate-500 font-medium">Blok {selectedWargaHistory.blok} No. {selectedWargaHistory.noRumah} — {rtTitle}</p>
              </div>
            </div>

            <div className="space-y-6">
              {/* Kepala Keluarga Info block */}
              <div className="bg-slate-50/55 border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-sans">
                <div>
                  <span className="text-slate-450 font-bold block mb-0.5">Nama Lengkap Kepala Keluarga:</span>
                  <span className="text-slate-800 font-black text-sm">{selectedWargaHistory.nama}</span>
                </div>
                <div>
                  <span className="text-slate-450 font-bold block mb-0.5">Nomor WhatsApp:</span>
                  <span className="text-slate-800 font-bold text-xs">{selectedWargaHistory.noWa || 'Belum diisi'}</span>
                </div>
                <div>
                  <span className="text-slate-450 font-bold block mb-0.5">Nomor KTP (NIK KK):</span>
                  <span className="text-slate-800 font-mono font-bold text-xs">{selectedWargaHistory.noKtp || 'Belum registrasi'}</span>
                </div>
                <div>
                  <span className="text-slate-450 font-bold block mb-0.5">Nomor Kartu Keluarga:</span>
                  <span className="text-slate-800 font-mono font-bold text-xs">{selectedWargaHistory.noKk || 'Belum registrasi'}</span>
                </div>
                <div className="md:col-span-2 border-t border-slate-200/50 pt-2.5">
                  <span className="text-slate-455 font-bold block mb-0.5">Alamat Lengkap Asal (KTP):</span>
                  <span className="text-slate-700 font-medium leading-relaxed">{selectedWargaHistory.alamatKtpAsal || 'Sesuai domisili RT 08'}</span>
                </div>
              </div>

              {/* Anggota Keluarga block */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 font-sans uppercase mb-2 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-sky-600" />
                  Anggota Keluarga Terdaftar ({selectedWargaHistory.anggotaKeluarga?.length || 0})
                </h5>
                <div className="space-y-1.5">
                  {!selectedWargaHistory.anggotaKeluarga || selectedWargaHistory.anggotaKeluarga.length === 0 ? (
                    <p className="text-[10px] text-slate-450 italic bg-slate-50 p-3 rounded-xl border border-slate-150">
                      Hanya Kepala Keluarga (Belum ada anggota keluarga serumah yang terdaftar).
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedWargaHistory.anggotaKeluarga.map((member, i) => (
                        <div key={member.id || i} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 flex flex-col justify-center text-xs">
                          <span className="font-extrabold text-slate-800 block text-xs">{member.nama}</span>
                          <div className="text-[10px] text-slate-500 font-bold mt-1 flex flex-col gap-0.5 font-mono">
                            <span>Hubungan: <span className="text-slate-700">{member.hubungan}</span></span>
                            {member.nik && <span>NIK: {member.nik}</span>}
                            {member.noHape && <span>WA: {member.noHape}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Berkas Scan/Foto (KK/KTP) Preview Block */}
              <div>
                <h5 className="text-xs font-bold text-slate-700 font-sans uppercase mb-2 flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-sky-600" />
                  Berkas KTP &amp; KK Terupload
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* KTP Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center min-h-[140px] text-center">
                    {selectedWargaHistory.ktpBase64 ? (
                      <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="w-full h-24 bg-slate-100 rounded-lg border overflow-hidden">
                          <img src={selectedWargaHistory.ktpBase64} alt="KTP Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <a 
                          href={selectedWargaHistory.ktpBase64}
                          download={`KTP_${selectedWargaHistory.nama}.jpg`}
                          className="text-[10px] font-black text-sky-600 hover:text-sky-700 font-sans flex items-center gap-0.5"
                        >
                          <Download className="w-3 h-3" /> Unduh Foto KTP
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[10px] font-sans">
                        <ShieldAlert className="w-6 h-6 mx-auto mb-1 text-slate-300 animate-bounce" />
                        Foto KTP Belum diunggah.
                      </div>
                    )}
                  </div>

                  {/* KK Card */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex flex-col items-center justify-center min-h-[140px] text-center">
                    {selectedWargaHistory.kkBase64 ? (
                      <div className="w-full flex flex-col items-center gap-1.5">
                        <div className="w-full h-24 bg-slate-100 rounded-lg border overflow-hidden">
                          <img src={selectedWargaHistory.kkBase64} alt="KK Preview" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <a 
                          href={selectedWargaHistory.kkBase64}
                          download={`KK_${selectedWargaHistory.nama}.jpg`}
                          className="text-[10px] font-black text-sky-600 hover:text-sky-700 font-sans flex items-center gap-0.5"
                        >
                          <Download className="w-3 h-3" /> Unduh Foto KK
                        </a>
                      </div>
                    ) : (
                      <div className="text-slate-400 text-[10px] font-sans">
                        <ShieldAlert className="w-6 h-6 mx-auto mb-1 text-slate-300 animate-bounce" />
                        Foto KK Belum diunggah.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 mt-4 border-t border-slate-100">
              <button 
                type="button"
                onClick={() => setSelectedWargaHistory(null)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
              >
                Tutup Detail
              </button>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 text-slate-800">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 max-w-4xl w-full max-h-[92vh] overflow-y-auto">
            <button 
              type="button"
              onClick={() => setShowSettingsModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5 bg-transparent">
            <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
              <Settings className="w-5 h-5" />
            </div>
            <div className="bg-transparent">
              <h3 className="font-extrabold text-slate-900 text-sm md:text-base bg-transparent">Pengaturan Batasan &amp; Parameter RT 08</h3>
              <p className="text-xs text-slate-500 bg-transparent">Kelola daftar wilayah Blok rumah, daftar Anggaran Tahun aktif, iuran referensi, serta identitas surat dinas.</p>
            </div>
          </div>

          <div className="space-y-6 bg-transparent">
            {/* Split layout: Blok & Tahun */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100 bg-transparent">
              
              {/* Left Column: Blocks management */}
              <div className="space-y-4 pb-4 md:pb-0 bg-transparent">
                <h4 className="text-xs font-black text-sky-700 uppercase tracking-wider bg-transparent">1. Wilayah Blok Rumah</h4>
                
                {/* List of current blocks */}
                <div className="space-y-2.5 font-mono bg-transparent">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 bg-transparent">Daftar Blok Tersimpan</label>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {blocksList.map(b => (
                      <div key={b} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold text-slate-800 shadow-3xs">
                        <span>Blok {b}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const inUse = wargaList.some(w => w.blok === b);
                            if (inUse) {
                              alert(`Blok ${b} tidak bisa dihapus karena masih digunakan oleh warga!`);
                              return;
                            }
                            if (confirm(`Apakah Anda yakin ingin menghapus Blok ${b}?`)) {
                              if (updateBlocksList) {
                                updateBlocksList(blocksList.filter(item => item !== b));
                                showToast(`Blok ${b} berhasil dihapus.`);
                              }
                            }
                          }}
                          className="text-slate-400 hover:text-rose-600 p-0.5 rounded cursor-pointer transition ml-0.5"
                          title={`Hapus Blok ${b}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Input Form box to add new block */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const trimmed = newBlockInput.trim().toUpperCase();
                    if (!trimmed) return;
                    
                    if (blocksList.includes(trimmed)) {
                      alert(`Blok "${trimmed}" sudah ada!`);
                      return;
                    }

                    if (updateBlocksList) {
                      updateBlocksList([...blocksList, trimmed]);
                      setNewBlockInput('');
                      showToast(`Blok "${trimmed}" ditambahkan.`);
                    }
                  }}
                  className="space-y-2 bg-transparent"
                >
                  <div className="bg-transparent">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans bg-transparent">Sandi/Huruf Blok Baru</label>
                    <div className="flex gap-2 bg-transparent">
                      <input
                        type="text"
                        required
                        value={newBlockInput}
                        onChange={(e) => setNewBlockInput(e.target.value)}
                        placeholder="Contoh: B2, D1, E3"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold uppercase font-sans focus:bg-white transition"
                      />
                      <button
                        type="submit"
                        className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-2 rounded-xl text-xs transition cursor-pointer shrink-0"
                      >
                        + Tambah Blok
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              {/* Right Column: Years management */}
              <div className="space-y-4 pt-4 md:pt-0 md:pl-6 bg-transparent">
                <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider bg-transparent">2. Tahun Buku / Anggaran</h4>
                
                {/* List of current years */}
                <div className="space-y-2.5 font-mono bg-transparent">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1 bg-transparent">Daftar Tahun Aktif</label>
                  <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                    {yearsList.map(yr => {
                      const hasWargaMatch = wargaList.some(w => w.iuranRT.some(b => b.tahun === yr));
                      const hasRombongMatch = rombongList.some(r => r.iuranRombong.some(b => b.tahun === yr));
                      const dateYearMatch = ledger.some(l => {
                        const dateYear = l.tanggal ? Number(l.tanggal.split('-')[0]) : 0;
                        return dateYear === yr || l.deskripsi?.includes(String(yr));
                      });
                      const inUse = hasWargaMatch || hasRombongMatch || dateYearMatch;
                      const isLastYear = yearsList.length <= 1;
                      const deletable = !inUse && !isLastYear;

                      return (
                        <div key={yr} className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-lg text-[10px] sm:text-[11px] font-bold text-slate-800 shadow-3xs">
                          <span>Tahun {yr}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (!deletable) {
                                alert(`Tahun ${yr} tidak dapat dihapus karena masih digunakan dalam catatan keuangan / tagihan, atau ini merupakan satu-satunya tahun yang tersisa.`);
                                return;
                              }
                              if (confirm(`Apakah Anda yakin ingin menghapus Tahun Anggaran ${yr}?`)) {
                                if (updateYearsList) {
                                  updateYearsList(yearsList.filter(item => item !== yr));
                                  showToast(`Tahun ${yr} berhasil dihapus.`);
                                }
                              }
                            }}
                            className={`p-0.5 rounded transition ml-0.5 cursor-pointer ${deletable ? 'text-slate-400 hover:text-rose-600' : 'text-slate-205 hover:text-slate-300'}`}
                            title={deletable ? `Hapus Tahun ${yr}` : 'Tahun sedang digunakan & terkunci dari penghapusan'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Input Form box to add new year */}
                <form 
                  onSubmit={(e) => {
                    e.preventDefault();
                    const value = parseInt(newYearInput.trim());
                    if (isNaN(value) || value < 2000 || value > 2100) {
                      alert('Mohon masukkan tahun masehi yang valid (contoh: 2028, 2029)!');
                      return;
                    }
                    
                    if (yearsList.includes(value)) {
                      alert(`Tahun "${value}" sudah tercapai atau didaftarkan!`);
                      return;
                    }

                    if (updateYearsList) {
                      const updated = [...yearsList, value].sort((a, b) => a - b);
                      updateYearsList(updated);
                      setNewYearInput('');
                      showToast(`Tahun ${value} berhasil ditambahkan.`);
                    }
                  }}
                  className="space-y-2 bg-transparent"
                >
                  <div className="bg-transparent">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans bg-transparent">Masukan Tahun Masehi Baru</label>
                    <div className="flex gap-2 bg-transparent">
                      <input
                        type="number"
                        min="2000"
                        max="2100"
                        required
                        value={newYearInput}
                        onChange={(e) => setNewYearInput(e.target.value)}
                        placeholder="Contoh: 2028"
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono focus:bg-white transition"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2 rounded-xl text-xs transition cursor-pointer shrink-0"
                      >
                        + Tambah Tahun
                      </button>
                    </div>
                  </div>
                </form>
              </div>

            </div>

            {/* Section 3: Besaran Acuan Iuran RT & Rombong */}
            <div className="border-t border-slate-150 pt-5 bg-transparent">
              <h4 className="text-xs font-black text-sky-700 uppercase tracking-wider mb-3 bg-transparent">3. Besaran Acuan Iuran Bulanan</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent animate-in slide-in-from-bottom-2 duration-150">
                <div className="bg-transparent">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 bg-transparent font-sans">Acuan Iuran RT (Sistem Standard) (Rp)</label>
                  <input
                    type="number"
                    disabled={currentUser?.role !== 'admin'}
                    value={rateRT}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateRateRT(val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 font-bold focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 bg-transparent">Diterapkan secara otomatis saat mendaftarkan warga baru / menghitung tunggakan RT.</p>
                </div>

                <div className="bg-transparent">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 bg-transparent font-sans">Acuan Iuran Rombong (Sewa Lahan) (Rp)</label>
                  <input
                    type="number"
                    disabled={currentUser?.role !== 'admin'}
                    value={rateRombong}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateRateRombong(val);
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 font-bold focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 bg-transparent">Diterapkan secara otomatis saat mendaftarkan rombong baru / menghitung sewa rombong.</p>
                </div>

                <div className="md:col-span-2 mt-2 bg-emerald-50 border border-emerald-250 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-sans text-slate-800">
                  <div className="space-y-1">
                    <strong className="text-xs text-emerald-950 font-black flex items-center gap-1.5">
                      💾 Terapkan Perubahan Acuan ke Semua Buku Tagihan?
                    </strong>
                    <p className="text-[10.5px] text-emerald-850 leading-relaxed font-semibold">
                      Jika Anda telah mengubah acuan iuran di atas, klik tombol <span className="text-emerald-950 font-black font-sans">"Selesai &amp; Sinkronkan Tagihan"</span> untuk memperbarui seluruh tagihan warga dan lapak rombong yang berstatus <span className="text-emerald-900 font-extrabold font-sans">"Belum Lunas"</span> di buku tagihan agar langsung menyelaraskan diri ke acuan baru yang Anda setel.
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={currentUser?.role !== 'admin'}
                    onClick={handleApplyNewRatesToUnpaid}
                    className="shrink-0 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-extrabold text-[11px] px-4 py-2.5 rounded-xl cursor-pointer shadow-md active:scale-95 transition-all text-center"
                  >
                    Selesai &amp; Sinkronkan Tagihan
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: Identitas KOP Surat & Buku Penagihan */}
            <div className="border-t border-slate-150 pt-5 bg-transparent">
              <h4 className="text-xs font-black text-sky-700 uppercase tracking-wider mb-3 bg-transparent">4. Identitas KOP Surat &amp; Buku Penagihan</h4>
              
              <div className="space-y-3.5 bg-transparent">
                {/* Logo Instansi */}
                <div className="bg-transparent mb-3">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans bg-transparent">Kustomisasi Logo Aplikasi / Instansi</label>
                  <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="w-16 h-16 rounded-2xl bg-slate-950 p-1 flex items-center justify-center border border-sky-400/20 shadow-inner shrink-0 relative overflow-hidden">
                      <img 
                        src={localAppLogo || '/favicon.png'} 
                        alt="Logo Preview" 
                        className="w-full h-full object-cover rounded-xl" 
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-1 space-y-1.5 w-full">
                      <div className="flex flex-wrap gap-2">
                        <label className={`bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-xs active:scale-95 transition ${currentUser?.role !== 'admin' ? 'opacity-50 pointer-events-none' : ''}`}>
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pilih Foto/Logo</span>
                          <input
                            type="file"
                            accept="image/*"
                            disabled={currentUser?.role !== 'admin'}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                try {
                                  // Limit logo dimensions to 400x400 pixels at 0.7 quality
                                  const base64 = await compressImage(file, 400, 400, 0.7);
                                  setLocalAppLogo(base64);
                                } catch (err) {
                                  alert('Gagal memuat atau memampatkan gambar logo.');
                                }
                              }
                            }}
                            className="hidden"
                          />
                        </label>
                        {localAppLogo && (
                          <button
                            type="button"
                            disabled={currentUser?.role !== 'admin'}
                            onClick={() => {
                              setLocalAppLogo('');
                            }}
                            className="bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 font-extrabold px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer active:scale-95"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Gunakan Default</span>
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400 font-medium">Bisa unggah file format PNG/JPG/WebP. Logo ini akan mengganti logo default di seluruh halaman aplikasi.</p>
                    </div>
                  </div>
                </div>

                {/* Judul Tab / Nama Aplikasi Utama */}
                <div className="bg-transparent">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans bg-transparent">Kustomisasi Judul / Nama Aplikasi Utama</label>
                  <input
                    type="text"
                    disabled={currentUser?.role !== 'admin'}
                    value={localAppName}
                    onChange={(e) => setLocalAppName(e.target.value)}
                    placeholder="Contoh: Kas Perumtas 3 RT 08"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 bg-transparent">Menentukan tajuk utama di logo header atas &amp; halaman muka login.</p>
                </div>

                <div className="bg-transparent">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans bg-transparent">Judul KOP Utama (Nama Rukun Tetangga / Kas)</label>
                  <input
                    type="text"
                    disabled={currentUser?.role !== 'admin'}
                    value={localRtTitle}
                    onChange={(e) => setLocalRtTitle(e.target.value)}
                    placeholder="Contoh: PENGURUS RUKUN TETANGGA 008 RUKUN WARGA 004"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition"
                  />
                  <p className="text-[10px] text-slate-400 mt-1 bg-transparent">Muncul sebagai tajuk paling utama (baris ke-1) di lembaran KOP laporan cetak.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent">
                  <div className="bg-transparent">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans bg-transparent">Alamat Lengkap RT (KOP)</label>
                    <textarea
                      rows={2}
                      disabled={currentUser?.role !== 'admin'}
                      value={localRtAddress}
                      onChange={(e) => setLocalRtAddress(e.target.value)}
                      placeholder="Contoh: PERUMTAS 3 RT.008 RW.004 DESA POPOH KEC WONOAYU KABUPATEN SIDOARJO 61261"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition resize-none leading-relaxed"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 bg-transparent">Muncul sebagai alamat fisik (baris ke-2) di lembaran KOP laporan cetak.</p>
                  </div>

                  <div className="bg-transparent">
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans bg-transparent">Alamat Email Resmi RT (KOP)</label>
                    <input
                      type="text"
                      disabled={currentUser?.role !== 'admin'}
                      value={localRtEmail}
                      onChange={(e) => setLocalRtEmail(e.target.value)}
                      placeholder="Contoh: tas3.rt.08@gmail.com"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1 bg-transparent">Muncul sebagai sarana kontak surat resmi (baris ke-3) di lembaran KOP laporan cetak.</p>
                  </div>
                </div>

                {/* Custom Labels / Nomenclature */}
                <div className="bg-transparent border-t border-slate-200 pt-4 mt-3">
                  <h5 className="text-[11px] font-black text-sky-700 uppercase tracking-widest mb-2">5. Pengaturan Nomenklatur Data Instansi</h5>
                  <p className="text-[10px] text-slate-500 leading-relaxed mb-3">Supaya aplikasi ini bisa dipakai instansi lain (seperti Sekolah, Guru, Masjid, Paguyuban), Anda bisa mengganti sebutan instrumen nama default untuk Warga dan Lapak Rombong di bawah ini:</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-transparent text-left">
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                        <Users className="w-4 h-4 text-sky-600" />
                        <span>Kategori 1 (Default: Warga)</span>
                      </div>
                      
                      <div className="bg-transparent">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">Sebutan Tunggal (Contoh: Siswa, Anggota, Kepala Keluarga)</label>
                        <input
                          type="text"
                          disabled={currentUser?.role !== 'admin'}
                          value={localLabelWargaSingular}
                          onChange={(e) => setLocalLabelWargaSingular(e.target.value)}
                          placeholder="Warga"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        />
                      </div>
                      
                      <div className="bg-transparent">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">Sebutan Jamak (Contoh: Data Siswa, Daftar Anggota)</label>
                        <input
                          type="text"
                          disabled={currentUser?.role !== 'admin'}
                          value={localLabelWargaPlural}
                          onChange={(e) => setLocalLabelWargaPlural(e.target.value)}
                          placeholder="Warga"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-sky-500 transition"
                        />
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-3">
                      <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1 flex items-center gap-1.5">
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span>Kategori 2 (Default: Lapak Rombong)</span>
                      </div>
                      
                      <div className="bg-transparent">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">Sebutan Tunggal (Contoh: Guru, Tenant, Unit Bisnis)</label>
                        <input
                          type="text"
                          disabled={currentUser?.role !== 'admin'}
                          value={localLabelRombongSingular}
                          onChange={(e) => setLocalLabelRombongSingular(e.target.value)}
                          placeholder="Rombong"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        />
                      </div>
                      
                      <div className="bg-transparent">
                        <label className="block text-[10px] font-bold text-slate-500 mb-1 font-sans">Sebutan Jamak (Contoh: Data Guru, Toko Tenant, Lapak Rombong)</label>
                        <input
                          type="text"
                          disabled={currentUser?.role !== 'admin'}
                          value={localLabelRombongPlural}
                          onChange={(e) => setLocalLabelRombongPlural(e.target.value)}
                          placeholder="Lapak Rombong"
                          className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Changes button for Identity and Nomenclature */}
                {currentUser?.role === 'admin' && (
                  <div className="flex justify-end pt-4 bg-transparent">
                    <button
                      type="button"
                      onClick={handleSaveIdentitasNomenklatur}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-6 py-3 rounded-2xl text-xs flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer font-sans"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Perubahan Identitas &amp; Nomenklatur</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Segarkan Cache Aplikasi (Hanya memperbarui sisa memori browser, tidak menghapus data) */}
            <div className="border-t border-slate-150 pt-5 bg-transparent">
              <div className="border border-sky-100 bg-sky-50/20 p-4 rounded-2xl">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent">
                  <div className="space-y-1 bg-transparent">
                    <div className="flex items-center gap-1.5 text-sky-700 font-extrabold text-xs uppercase tracking-wider bg-transparent">
                      <RefreshCw className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>Segarkan Memori Sela (Clear Cache)</span>
                    </div>
                    <p className="text-[11px] text-slate-505 leading-relaxed max-w-sm sm:max-w-md font-medium bg-transparent font-sans">
                      Menyegarkan memori sementara penjelajah (gawai HP/Laptop) guna memuat ulang skrip web paling mutakhir jika Anda baru saja memperbaharui setelan server. <strong className="text-sky-650">Tidak menghapus basis iuran offline Anda</strong>.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const isConfirmed = window.confirm(
                        "Apakah Anda ingin menyegarkan cache aplikasi di penjelajah perangkat ini?\n\nSegarkan Cache akan memuat ulang (reload) halaman secara penuh untuk memperbarui sisa memori sela serta memastikan skrip berjalan pada versi paling baru tanpa menghapus data iuran lokal gawai Anda."
                      );
                      if (isConfirmed) {
                        window.location.reload();
                      }
                    }}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-4.5 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition shrink-0 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Segarkan Cache Browser</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 5: Pusat Pengosongan Data Keuangan (Admin Only) */}
            {currentUser?.role === 'admin' && (
              <div className="border border-rose-105 bg-rose-50/40 p-4 rounded-2xl border-t border-rose-100">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-transparent">
                  <div className="space-y-1 bg-transparent">
                    <div className="flex items-center gap-1.5 text-rose-700 font-black text-xs uppercase tracking-wider bg-transparent">
                      <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>5. Tindakan Berbahaya &amp; Reset Data</span>
                    </div>
                    <p className="text-[11px] text-slate-505 leading-relaxed max-w-sm sm:max-w-md font-medium bg-transparent">
                      Menghapus seluruh mutasi kas, iuran warga, iuran rombong, dan mengosongkan pembukuan kembali ke awal default.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm("Apakah Anda benar-benar yakin ingin MENGOSONGKAN SELURUH DATA SISTEM? Tindakan ini tidak dapat dibatalkan, semua mutasi kas dan status iuran akan dikembalikan ke nol!")) {
                        if (onTriggerReset) {
                          onTriggerReset();
                          showToast("Seluruh data sistem berhasil dikosongkan.");
                        }
                      }
                    }}
                    className="bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition active:scale-95 duration-150 shrink-0 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Kosongkan Seluruh Data</span>
                  </button>
                </div>
              </div>
            )}

            {/* Section 6: Sistem Backup & Gulirkan Kembali / Undo (Admin Only) */}
            {currentUser?.role === 'admin' && (
              <div className="border border-slate-200 bg-slate-50/50 p-5 rounded-3xl mt-5 space-y-5">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-sky-700 font-extrabold text-xs uppercase tracking-wider">
                    <RotateCcw className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>6. Sistem Backup &amp; Undo Pemulihan</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">
                    Fungsi pemulihan pembukuan tanpa harus mengedit mutasi kas atau data warga satu per satu. Menggunakan data titik backup (Snapshot) di gawai ataupun dari berkas eksternal.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left sub-panel: Undo 1-Day & Manual Backup */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-4">
                    <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                      Prosedur Undo &amp; Snapshot Baru
                    </h5>
                    
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={handleUndoOneDay}
                        className="w-full bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-black px-4 py-3 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-md shadow-amber-500/10 cursor-pointer transition duration-150"
                      >
                        <RotateCcw className="w-4 h-4" />
                        <span>Gulirkan Mundur Data / Undo Sehari</span>
                      </button>
                      <p className="text-[10px] text-slate-400 italic leading-relaxed text-center font-sans font-medium">
                        Mencari backup harian terdekat (&gt;12 jam) untuk digulirkan mundur secara otomatis.
                      </p>
                    </div>

                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none font-sans">Simpan Snapshot Manual</label>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={manualSnapLabel}
                          onChange={(e) => setManualSnapLabel(e.target.value)}
                          placeholder="Contoh: Sebelum Tarik Kas Juni / Migrasi"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-medium text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400 font-sans"
                        />
                        <button
                          type="button"
                          onClick={handleCreateManualSnapshot}
                          className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-2 rounded-xl text-[11px] whitespace-nowrap cursor-pointer transition active:scale-95"
                        >
                          Simpan
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Right sub-panel: JSON Physical Backup File */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-150 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Arsip Eksternal Fisik (JSON)
                      </h5>
                      <p className="text-[10px] text-slate-400 leading-relaxed font-sans mt-1">
                        Disarankan mengunduh berkas backup fisik secara periodik agar memori iuran RT 08 Anda 100% aman tersimpan di arsip laptop/HP Anda.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={handleExportPhysicalBackup}
                        className="bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Unduh File .json</span>
                      </button>

                      <div className="relative">
                        <input
                          type="file"
                          id="import-backup-json"
                          accept=".json"
                          onChange={handleImportPhysicalBackup}
                          className="hidden"
                        />
                        <label
                          htmlFor="import-backup-json"
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-3 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer transition active:scale-95 text-center"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Pulihkan File .json</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sub-panel Bottom: Snaps list history */}
                <div className="bg-white p-4 rounded-2xl border border-slate-150 space-y-3 font-sans">
                  <h5 className="text-[11px] font-black text-slate-700 uppercase tracking-wider flex items-center justify-between">
                    <span>Daftar Riwayat Titik Backup Gawai (Lokal)</span>
                    <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-lg text-[9px] font-mono lowercase">
                      Maks. 20 Slot
                    </span>
                  </h5>

                  {snapshots.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 italic text-[11px] bg-slate-50 border border-dashed border-slate-200 rounded-xl">
                      Belum terdapat titik backup otomatis ataupun kustom yang tersimpan di memori perangkat ini.
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-48 divide-y divide-slate-100 pr-1 select-none">
                      {snapshots.map((snap: any) => (
                        <div key={snap.id} className="flex items-center justify-between py-2.5 gap-4">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                snap.type === 'auto'
                                  ? 'bg-sky-50 border border-sky-100/55 text-sky-700'
                                  : 'bg-indigo-50 border border-indigo-100/55 text-indigo-700'
                              }`}>
                                {snap.type === 'auto' ? 'Otomatis' : 'Kustom'}
                              </span>
                              <span className="text-[11px] font-extrabold text-slate-800 tracking-tight leading-tight shrink-0 font-sans">
                                {snap.dateString}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 mt-1 truncate font-medium font-sans">
                              {snap.label}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={() => handleRestoreSpecific(snap)}
                              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 font-extrabold px-2.5 py-1.5 rounded-lg text-[10px] cursor-pointer transition active:scale-95 font-sans"
                            >
                              Pulihkan
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteSnapshot(snap.id, snap.label)}
                              className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg transition shrink-0 cursor-pointer"
                              title="Hapus"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {currentUser?.role !== 'admin' && (
              <div className="border border-slate-100 bg-rose-50/50 p-3 rounded-xl border-t border-slate-150 font-semibold text-[11px] text-rose-600 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-550 shrink-0 mt-0.5" />
                <span>Hak Akses Terbatas: Pengaturan iuran acuan, perubahan naskah KOP surat (Judul, Alamat, Email), serta Pengosongan sistem data hanya diperbolehkan untuk pengguna dengan peran Admin (Ketua RT).</span>
              </div>
            )}
          </div>
        </div>
      </div>
  )}


    </div>
  );
}
