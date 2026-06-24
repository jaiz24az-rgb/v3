import React, { useState, useEffect } from 'react';
import { WargaBill, Balance, LedgerEntry, RombongBill, AppUser } from '../types';
import { compressImage } from '../utils/fileCompressor';
import { getBase64SizeInBytes, formatFileSize } from '../utils/fileSizeUtils';
import * as XLSX from 'xlsx';
import { 
  Search, 
  UserPlus, 
  User,
  CheckCircle, 
  Clock, 
  CreditCard, 
  Home, 
  Filter, 
  Coins, 
  Trash2,
  X,
  Check,
  MessageSquare,
  Send,
  ExternalLink,
  Edit2,
  Store,
  Users,
  BookOpen,
  Calendar,
  Settings,
  Printer,
  Copy,
  RotateCcw,
  ShieldAlert,
  Eye,
  FileText,
  Download,
  FileSpreadsheet,
  Upload,
  Plus,
  Camera,
  Receipt
} from 'lucide-react';

export const getDefaultRtRate = (tahun: number, bulan: string, baseRate: number): number => {
  if (tahun < 2026) return 35000;
  if (tahun === 2026) {
    const isEarly2026 = ['januari', 'februari', 'maret', 'april', 'mei', 'jan', 'feb', 'mar', 'apr', 'mei'].includes(bulan.toLowerCase());
    if (isEarly2026) return 35000;
  }
  return baseRate;
};

export const getDefaultRombongRate = (tahun: number, bulan: string, baseRate: number): number => {
  if (tahun < 2026) return 50000;
  if (tahun === 2026) {
    const isEarly2026 = ['januari', 'februari', 'maret', 'april', 'mei', 'jan', 'feb', 'mar', 'apr', 'mei'].includes(bulan.toLowerCase());
    if (isEarly2026) return 50000;
  }
  return baseRate;
};

interface TagihanWargaProps {
  wargaList: WargaBill[];
  updateWargaList: (newList: WargaBill[]) => void;
  rombongList: RombongBill[];
  updateRombongList: (newList: RombongBill[]) => void;
  kas: Balance;
  updateKas: (newKas: Balance) => void;
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => void;
  isLoggedIn: boolean;
  ledger?: LedgerEntry[];
  currentUser?: AppUser | null;
  usersList?: AppUser[];
  blocksList?: string[];
  updateBlocksList?: (newBlocks: string[]) => void;
  yearsList?: number[];
  updateYearsList?: (newYears: number[]) => void;
  rateRT: number;
  updateRateRT: (newVal: number) => void;
  rateRombong: number;
  updateRateRombong: (newVal: number) => void;
  onTriggerReset?: () => void;
  rtTitle?: string;
  updateRtTitle?: (newVal: string) => void;
  rtAddress?: string;
  updateRtAddress?: (newVal: string) => void;
  rtEmail?: string;
  updateRtEmail?: (newVal: string) => void;
  appName?: string;
  appLogo?: string;
  labelWargaSingular?: string;
  labelWargaPlural?: string;
  labelRombongSingular?: string;
  labelRombongPlural?: string;
  bankNama?: string;
  updateBankNama?: (newVal: string) => void;
  bankNoRek?: string;
  updateBankNoRek?: (newVal: string) => void;
  bankPenerima?: string;
  updateBankPenerima?: (newVal: string) => void;
  bankCatatanVendor?: string;
  updateBankCatatanVendor?: (newVal: string) => void;
  meetingNotulen?: string;
  updateMeetingNotulen?: (newVal: string) => void;
}

export default function TagihanWarga({ 
  wargaList, 
  updateWargaList, 
  rombongList,
  updateRombongList,
  kas, 
  updateKas, 
  addLedgerEntry, 
  isLoggedIn,
  ledger = [],
  currentUser = null,
  usersList = [],
  blocksList = ['A4', 'A3', 'C5', 'C3'],
  updateBlocksList,
  yearsList = [2024, 2025, 2026, 2027],
  updateYearsList,
  rateRT,
  updateRateRT,
  rateRombong,
  updateRateRombong,
  onTriggerReset = () => {},
  rtTitle = 'PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04',
  updateRtTitle = () => {},
  rtAddress = 'PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.',
  updateRtAddress = () => {},
  rtEmail = '',
  updateRtEmail = () => {},
  appName = 'Kas Perumtas 3 RT 08',
  appLogo = '',
  labelWargaSingular = 'Warga',
  labelWargaPlural = 'Warga',
  labelRombongSingular = 'Rombong',
  labelRombongPlural = 'Lapak Rombong',
  bankNama = 'Bank Mandiri',
  updateBankNama = () => {},
  bankNoRek = '',
  updateBankNoRek = () => {},
  bankPenerima = '',
  updateBankPenerima = () => {},
  bankCatatanVendor = '',
  updateBankCatatanVendor = () => {},
  meetingNotulen = '',
  updateMeetingNotulen = () => {}
}: TagihanWargaProps) {
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

  // Helpers for dynamic greetings/signatures
  const cleanSignatureName = (nama: string) => {
    return nama.replace(/\s*\(.*\)\s*/g, '').trim();
  };

  const formatGreetingName = (name: string, defaultSalutation = 'Bapak') => {
    if (/^(bapak|bp\.|ibu|mas|mbak|pak|bu)\s/i.test(name)) {
      return name;
    }
    return `${defaultSalutation} ${name}`;
  };

  const adminUser = usersList.find(u => u.role === 'admin');
  const bendaharaUser = usersList.find(u => u.role === 'bendahara');

  const adminNameFormatted = adminUser ? formatGreetingName(cleanSignatureName(adminUser.nama), 'Bapak') : 'Bapak Sutriadi';
  const bendaharaNameFormatted = bendaharaUser ? formatGreetingName(cleanSignatureName(bendaharaUser.nama), 'Bapak') : 'Bapak Heri';

  const getFallbackPetugasName = () => {
    return adminUser ? cleanSignatureName(adminUser.nama) : 'Sutriadi (Admin)';
  };

  const isKolektor2 = isLoggedIn && currentUser && (
    currentUser.username.toLowerCase().includes('kolektor2') || 
    currentUser.nama.toLowerCase().includes('kolektor2')
  );

  // Sub-tab selection: 'warga' (resident) or 'rombong' (food stalls)
  const [activeSubTab, setActiveSubTab] = useState<'warga' | 'rombong'>('warga');

  React.useEffect(() => {
    if (currentUser?.role === 'rombong' || isKolektor2) {
      setActiveSubTab('rombong');
    } else if (currentUser?.role === 'warga') {
      setActiveSubTab('warga');
    }
  }, [currentUser, isKolektor2]);

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
    updateRombongList(updatedRombongList);

    alert('Berhasil! Seluruh tagihan yang belum lunas di buku tagihan warga & lapak rombong telah diperbarui sesuai acuan besaran iuran baru.');
  };

  // Filters & search state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBlock, setSelectedBlock] = useState('Semua');
  const [selectedStatus, setSelectedStatus] = useState('Semua'); // Semua, Lunas, Belum Lunas
  const [selectedBillingYear, setSelectedBillingYear] = useState<number>(2026);
  const [selectedKeaktifan, setSelectedKeaktifan] = useState<'aktif' | 'nonaktif' | 'pindah_sementara' | 'semua'>('aktif');

  // WhatsApp Message Content Settings (Current month vs. prior arrears)
  const [waIncludeCurrent, setWaIncludeCurrent] = useState<boolean>(true);
  const [waIncludeArrears, setWaIncludeArrears] = useState<boolean>(true);

  // Block management state
  const [showBlockManageModal, setShowBlockManageModal] = useState(false);
  const [showPrintBillingModal, setShowPrintBillingModal] = useState(false);
  const [printFormatType, setPrintFormatType] = useState<'table' | 'whatsapp'>('table');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<{ url: string; title: string } | null>(null);
  const [newBlockInput, setNewBlockInput] = useState('');
  const [newYearInput, setNewYearInput] = useState('');

  // Warga Form states
  const [showAddModal, setShowAddModal] = useState(false);
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
    statusRumah: 'milik_sendiri' as 'milik_sendiri' | 'sewa_kontrak' | 'lainnya',
    tglAwalSewa: '',
    tglAkhirSewa: '',
    isWargaBaru: false,
    mulaiBulan: 'Maret',
    mulaiTahun: 2026,
    anggotaKeluarga: [] as { id: string; nama: string; hubungan: string; nik?: string; noHape?: string }[],
  });

  const [tempMember, setTempMember] = useState({
    nama: '',
    hubungan: 'Istri',
    nik: '',
    noHape: ''
  });

  // Rombong Form states
  const [showAddRombongModal, setShowAddRombongModal] = useState(false);
  const [newRombong, setNewRombong] = useState({
    namaPemilik: '',
    lokasi: '',
    noLapak: '',
    noWa: '',
  });

  // Edit states for admins
  const [editingWarga, setEditingWarga] = useState<WargaBill | null>(null);
  const [editingRombong, setEditingRombong] = useState<RombongBill | null>(null);
  const [wargaToDelete, setWargaToDelete] = useState<{ id: string, nama: string } | null>(null);
  const [rombongToDelete, setRombongToDelete] = useState<{ id: string, nama: string } | null>(null);
  const [deleteChoiceWarga, setDeleteChoiceWarga] = useState<'aktif' | 'permanen' | 'nonaktif' | 'pindah_sementara'>('nonaktif');
  const [deleteChoiceRombong, setDeleteChoiceRombong] = useState<'aktif' | 'permanen' | 'nonaktif' | 'pindah_sementara'>('nonaktif');

  // Warga Payment confirmation state (with year)
  const [payingInfo, setPayingInfo] = useState<{
    warga: WargaBill;
    category: 'Iuran RT';
    bulan: string;
    nominal: number;
    billingType: 'iuranRT';
    tahun: number;
  } | null>(null);

  // Rombong Payment confirmation state (with year)
  const [payingRombongInfo, setPayingRombongInfo] = useState<{
    rombong: RombongBill;
    category: 'Iuran Rombong';
    bulan: string;
    nominal: number;
    billingType: 'iuranRombong';
    tahun: number;
  } | null>(null);

  // States for custom Rombong payment with admin approval
  const [customRombongPayNominal, setCustomRombongPayNominal] = useState<number>(0);
  const [isRombongCustomActive, setIsRombongCustomActive] = useState<boolean>(false);
  const [adminApprovalPin, setAdminApprovalPin] = useState<string>('');

  const [paymentTargetKas, setPaymentTargetKas] = useState<keyof Balance>('rtTunai');
  
  // Sukses Pembayaran State untuk Modal Notifikasi WhatsApp & Google Workspace Sync
  const [receiptSuccessInfo, setReceiptSuccessInfo] = useState<{
    id: string;
    nama: string;
    tipe: 'warga' | 'rombong';
    blok?: string;
    noRumah?: string;
    noLapak?: string;
    noWa: string;
    category: string;
    bulan: string;
    tahun: number;
    nominal: number;
    tanggalBayar: string;
    jamBayar: string;
    kasPenerima: string;
    petugas: string;
    catatan?: string;
  } | null>(null);

  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState<string>(() => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  });
  const [paymentReceiptBase64, setPaymentReceiptBase64] = useState<string>('');
  const [paymentReceiptNamaFile, setPaymentReceiptNamaFile] = useState<string>('');

  const [corrPaymentDate, setCorrPaymentDate] = useState<string>('');
  const [corrPaymentTime, setCorrPaymentTime] = useState<string>('');

  // Warga Correction Modal states
  const [correctionWargaInfo, setCorrectionWargaInfo] = useState<{
    warga: WargaBill;
    billingType: 'iuranRT';
    bulan: string;
    nominal: number;
    tahun: number;
  } | null>(null);

  const [corrStatusLunas, setCorrStatusLunas] = useState<boolean>(true);
  const [corrNominal, setCorrNominal] = useState<number>(rateRT);
  const [corrTahun, setCorrTahun] = useState<number>(2026);
  const [corrTransferTargetWargaId, setCorrTransferTargetWargaId] = useState<string>('');
  const [corrTargetKas, setCorrTargetKas] = useState<keyof Balance>('rtTunai');
  const [corrNoCashFlow, setCorrNoCashFlow] = useState<boolean>(true);
  const [corrCatatan, setCorrCatatan] = useState<string>('');

  useEffect(() => {
    setCorrNominal(rateRT);
  }, [rateRT]);

  // Rombong Correction Modal states
  const [correctionRombongInfo, setCorrectionRombongInfo] = useState<{
    rombong: RombongBill;
    billingType: 'iuranRombong';
    bulan: string;
    nominal: number;
    tahun: number;
  } | null>(null);

  const [corrRombongStatusLunas, setCorrRombongStatusLunas] = useState<boolean>(true);
  const [corrRombongNominal, setCorrRombongNominal] = useState<number>(rateRombong);
  const [corrRombongTahun, setCorrRombongTahun] = useState<number>(2026);
  const [corrTransferTargetRombongId, setCorrTransferTargetRombongId] = useState<string>('');
  const [corrRombongTargetKas, setCorrRombongTargetKas] = useState<keyof Balance>('rombongTunai');
  const [corrRombongNoCashFlow, setCorrRombongNoCashFlow] = useState<boolean>(true);
  const [corrRombongCatatan, setCorrRombongCatatan] = useState<string>('');

  useEffect(() => {
    setCorrRombongNominal(rateRombong);
  }, [rateRombong]);

  // WhatsApp Billing popup state
  const [selectedWargaForWhatsApp, setSelectedWargaForWhatsApp] = useState<WargaBill | null>(null);
  const [selectedRombongForWhatsApp, setSelectedRombongForWhatsApp] = useState<RombongBill | null>(null);
  const [targetPhone, setTargetPhone] = useState('');

  // Annual Registry check states
  const [selectedWargaHistory, setSelectedWargaHistory] = useState<WargaBill | null>(null);
  const [selectedRombongHistory, setSelectedRombongHistory] = useState<RombongBill | null>(null);
  const [historyYear, setHistoryYear] = useState<number>(2026);
  const isWargaInactive = !!(selectedWargaHistory?.statusKeaktifan && selectedWargaHistory.statusKeaktifan !== 'aktif');
  const isRombongInactive = !!(selectedRombongHistory?.statusKeaktifan && selectedRombongHistory.statusKeaktifan !== 'aktif');
  const [previewOnlyCurrentMonth, setPreviewOnlyCurrentMonth] = useState<boolean>(false);
  const [isBatchEdit, setIsBatchEdit] = useState<boolean>(false);
  const [batchMonthsPaidStatus, setBatchMonthsPaidStatus] = useState<{[key: string]: boolean}>({});
  const [showCurrentMonthOnly, setShowCurrentMonthOnly] = useState<boolean>(true);

  // Dropdown states for managing Edit/Delete actions in citizens and stalls
  const [activeDropdownWarga, setActiveDropdownWarga] = useState<string | null>(null);
  const [activeDropdownRombong, setActiveDropdownRombong] = useState<string | null>(null);

  useEffect(() => {
    const handleGlobalClick = () => {
      setActiveDropdownWarga(null);
      setActiveDropdownRombong(null);
    };
    window.addEventListener('click', handleGlobalClick);
    return () => window.removeEventListener('click', handleGlobalClick);
  }, []);

  const fullMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const isMonthDue = (monthName: string, year: number) => {
    const currentYearNum = new Date().getFullYear();
    const currentMonthIdx = new Date().getMonth(); // Dynamic based on current month (June = 5)

    if (year < currentYearNum) return true; // past years: all months are due
    if (year > currentYearNum) return false; // future years: no months are due yet

    // for current year, find the index of this month
    const monthIdx = fullMonths.findIndex(
      m => m.toLowerCase() === monthName.toLowerCase() || 
           m.slice(0, 3).toLowerCase() === monthName.slice(0, 3).toLowerCase()
    );
    return monthIdx !== -1 && monthIdx <= currentMonthIdx;
  };

  const isRombongMacet = (r: RombongBill, curYear: number, curMonth: string): boolean => {
    // Unpaid prior billing slots in years before curYear
    const unpaidPrior = r.iuranRombong.some(b => b.tahun && b.tahun < curYear && !b.lunas);
    
    // Unpaid prior billing slots in the current year, before curMonth
    const monthIndex = fullMonths.findIndex(m => m.toLowerCase() === curMonth.toLowerCase());
    
    const unpaidCurrent = fullMonths.slice(0, monthIndex === -1 ? 0 : monthIndex).some(m => {
      const slot = r.iuranRombong.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === curYear || (!b.tahun && curYear === 2026))
      );
      const isLunas = slot ? slot.lunas : false;
      return !isLunas && isMonthDue(m, curYear);
    });

    return unpaidPrior || unpaidCurrent;
  };

  const isCitizenTx = (entry: LedgerEntry, citizenName: string, block: string, noRumah: string) => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const name = citizenName.toLowerCase();
    const sub = `blok ${block}-${noRumah}`.toLowerCase();
    const subWithSpace = `blok ${block} - ${noRumah}`.toLowerCase();
    const subSimple = `${block}-${noRumah}`.toLowerCase();
    
    return (
      desc.includes(name) || 
      desc.includes(sub) || 
      desc.includes(subWithSpace) || 
      desc.includes(subSimple)
    );
  };

  const filterLedgerForWarga = (citizen: WargaBill, targetYear: number) => {
    return ledger.filter(entry => {
      const matchesResident = isCitizenTx(entry, citizen.nama, citizen.blok, citizen.noRumah);
      const txYear = new Date(entry.tanggal).getFullYear();
      return matchesResident && txYear === targetYear;
    });
  };

  const filterLedgerForRombong = (rtLapak: RombongBill, targetYear: number) => {
    return ledger.filter(entry => {
      const desc = (entry.deskripsi || '').toLowerCase();
      const owner = rtLapak.namaPemilik.toLowerCase();
      const cleanOwner = owner.split('(')[0].trim();
      const lapakNo = rtLapak.noLapak.toLowerCase();
      
      const matchesOwner = desc.includes(owner) || desc.includes(cleanOwner) || desc.includes(lapakNo);
      const txYear = new Date(entry.tanggal).getFullYear();
      return matchesOwner && txYear === targetYear;
    });
  };

  const getWargaArrearsBeforeYear = (w: WargaBill, targetYear: number): number => {
    const defaultMonths = fullMonths;
    let total = 0;
    const priorYears = yearsList.filter(y => y < targetYear);
    priorYears.forEach(yr => {
      defaultMonths.forEach(m => {
        const slot = w.iuranRT.find(b =>
          b.bulan.toLowerCase() === m.toLowerCase() &&
          (b.tahun === yr || (!b.tahun && yr === 2026))
        );
        const isLunas = slot ? slot.lunas : false;
        if (!isLunas) {
          total += getDefaultRtRate(yr, m, rateRT);
        }
      });
    });
    return total;
  };

  const getRombongArrearsBeforeYear = (r: RombongBill, targetYear: number): number => {
    const defaultMonths = fullMonths;
    let total = 0;
    const priorYears = yearsList.filter(y => y < targetYear);
    priorYears.forEach(yr => {
      defaultMonths.forEach(m => {
        const slot = r.iuranRombong.find(b =>
          b.bulan.toLowerCase() === m.toLowerCase() &&
          (b.tahun === yr || (!b.tahun && yr === 2026))
        );
        const isLunas = slot ? slot.lunas : false;
        if (!isLunas) {
          total += getDefaultRombongRate(yr, m, rateRombong);
        }
      });
    });
    return total;
  };

  const printWargaInvoice = (w: WargaBill, targetYear: number) => {
    const printDoc = {
      write: (htmlContent: string) => {
        printContentViaIframe(htmlContent);
      },
      close: () => {}
    };

    const defaultMonths = fullMonths;
    const priorYears = yearsList.filter(yr => yr < targetYear);
    
    // Calculate past year arrears
    const priorUnpaidList: { tahun: number; bulan: string; nominal: number }[] = [];
    let priorUnpaidTotal = 0;
    priorYears.forEach(yr => {
      defaultMonths.forEach(m => {
        const slot = w.iuranRT.find(b =>
          b.bulan.toLowerCase() === m.toLowerCase() &&
          (b.tahun === yr || (!b.tahun && yr === 2026))
        );
        const isLunas = slot ? slot.lunas : false;
        if (!isLunas) {
          const rate = getDefaultRtRate(yr, m, rateRT);
          priorUnpaidList.push({ tahun: yr, bulan: m, nominal: rate });
          priorUnpaidTotal += rate;
        }
      });
    });

    // Calculate current chosen year info
    const currentYearList: { b: string; lunas: boolean; nominal: number; tanggalBayar?: string; jamBayar?: string }[] = [];
    let currentUnpaidTotal = 0;
    let currentPaidTotal = 0;
    
    defaultMonths.forEach(m => {
      const slot = w.iuranRT.find(b =>
        b.bulan.toLowerCase() === m.toLowerCase() &&
        (b.tahun === targetYear || (!b.tahun && targetYear === 2026))
      );
      const isLunas = slot ? slot.lunas : false;
      const nominal = slot ? slot.nominal : getDefaultRtRate(targetYear, m, rateRT);
      const isDue = isMonthDue(m, targetYear);
      
      currentYearList.push({
        b: m,
        lunas: isLunas,
        nominal: nominal,
        tanggalBayar: slot?.tanggalBayar,
        jamBayar: slot?.jamBayar
      });
      
      if (isLunas) {
        currentPaidTotal += nominal;
      } else if (isDue) {
        currentUnpaidTotal += nominal;
      }
    });

    const grandTotalTunggakan = priorUnpaidTotal + currentUnpaidTotal;
    const rtNum = rtTitle.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i) ? `RT ${rtTitle.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i)![1]}` : 'RT 008';

    printDoc.write(`
      <html>
        <head>
          <title>Tagihan Iuran Warga - ${w.nama}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              padding: 30px;
              margin: 0;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.5;
            }
            .kop-surat {
              text-align: center;
              border-bottom: 3px double #000000;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .kop-title {
              font-size: 18px;
              font-weight: 850;
              text-transform: uppercase;
              color: #0d1b2a;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .kop-subtitle {
              font-size: 11px;
              color: #4a5568;
              margin: 4px 0 0 0;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .invoice-tag {
              display: inline-block;
              background-color: #f1f5f9;
              color: #0d1b2a;
              font-weight: 800;
              font-size: 11px;
              padding: 4px 10px;
              border-radius: 6px;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .grid-meta {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 15px;
              margin-bottom: 25px;
              padding: 12px 15px;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 8px;
            }
            .meta-item label {
              display: block;
              font-size: 10px;
              font-weight: 700;
              color: #64748b;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .meta-item value {
              display: block;
              font-size: 13px;
              font-weight: 700;
              color: #0f172a;
            }
            .table-bills {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .table-bills th {
              background-color: #0f172a;
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 10px 12px;
              text-align: left;
              border: 1px solid #1e293b;
            }
            .table-bills td {
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .table-bills tr:nth-child(even) {
              background-color: #f8fafc;
            }
            .badge-lunas {
              background-color: #dcfce7;
              color: #15803d;
              font-weight: 700;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .badge-belum {
              background-color: #fee2e2;
              color: #b91c1c;
              font-weight: 700;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .box-summary {
              border: 1px solid #e2e8f0;
              border-radius: 8px;
              padding: 15px;
              background-color: #f8fafc;
              margin-bottom: 30px;
            }
            .summary-title {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              text-transform: uppercase;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 6px;
            }
            .summary-row.total {
              font-size: 15px;
              font-weight: 850;
              color: #b91c1c;
              border-top: 1.5px dashed #cbd5e1;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer-sign {
              display: grid;
              grid-template-cols: 1fr 1fr 1fr;
              gap: 20px;
              text-align: center;
              margin-top: 50px;
              page-break-inside: avoid;
            }
            .sign-col {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 105px;
            }
            .sign-label {
              font-size: 11px;
              font-weight: 600;
              color: #4a5568;
            }
            .sign-name {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              text-decoration: underline;
            }
            .no-print-btn {
              padding: 8px 16px;
              background-color: #0284c7;
              color: white;
              border: none;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              margin-bottom: 20px;
            }
            @media print {
              @page {
                size: A5 portrait;
                margin: 4mm 6mm;
              }
              body {
                padding: 0 !important;
                margin: 0 !important;
                font-size: 9px !important;
                line-height: 1.2 !important;
              }
              .kop-surat {
                padding-bottom: 4px !important;
                margin-bottom: 6px !important;
                border-bottom: 1.5px solid #000000 !important;
              }
              .kop-title {
                font-size: 13px !important;
              }
              .kop-subtitle {
                font-size: 8px !important;
                margin-top: 2px !important;
              }
              .invoice-tag {
                font-size: 8px !important;
                padding: 2px 5px !important;
                margin-bottom: 5px !important;
              }
              .meta-table {
                margin-bottom: 6px !important;
              }
              .meta-table td {
                padding: 4px 6px !important;
              }
              .meta-table span {
                font-size: 7.5px !important;
                margin-bottom: 1px !important;
              }
              .meta-table strong {
                font-size: 9.5px !important;
              }
              h3 {
                font-size: 9.5px !important;
                margin-top: 6px !important;
                margin-bottom: 3px !important;
              }
              .table-bills {
                margin-bottom: 6px !important;
              }
              .table-bills th {
                padding: 2.5px 5px !important;
                font-size: 7.5px !important;
              }
              .table-bills td {
                padding: 2.5px 5px !important;
                font-size: 7.5px !important;
              }
              .badge-lunas, .badge-belum {
                font-size: 7px !important;
                padding: 0.5px 1.5px !important;
              }
              .box-summary {
                padding: 5px 8px !important;
                margin-bottom: 5px !important;
                border-radius: 4px !important;
              }
              .summary-title {
                font-size: 8px !important;
                padding-bottom: 1px !important;
                margin-bottom: 2px !important;
              }
              .summary-row {
                font-size: 7.5px !important;
                margin-bottom: 1px !important;
              }
              .summary-row.total {
                font-size: 9.5px !important;
                padding-top: 3px !important;
                margin-top: 3px !important;
              }
              .note-box {
                margin-top: 3px !important;
                font-size: 7.5px !important;
                line-height: 1.15 !important;
              }
              .signature-table {
                margin-top: 10px !important;
              }
              .signature-title {
                margin-bottom: 30px !important;
                font-size: 7.5px !important;
              }
              .signature-name {
                font-size: 8px !important;
              }
              * {
                visibility: visible !important;
              }
              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;">
            <button class="no-print-btn" onclick="window.print()">Cetak Dokumen / Simpan PDF</button>
          </div>
          
          <div class="kop-surat">
            <h1 class="kop-title">${rtTitle}</h1>
            <div class="kop-subtitle">${rtAddress} — Email: ${rtEmail}</div>
          </div>
          
          <div style="text-align: center; margin-bottom: 10px;">
            <div class="invoice-tag">SURAT TAGIHAN RESMI IURAN WARGA</div>
          </div>
          
          <table class="meta-table" style="width: 100%; margin-bottom: 20px; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 50%; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px 0 0 6px; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Nama Anggota Warga</span>
                <strong style="font-size: 13px; color: #0f172a; display: block;">${w.nama}</strong>
              </td>
              <td style="width: 50%; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: none; border-radius: 0 6px 6px 0; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Alamat Rumah</span>
                <strong style="font-size: 13px; color: #0f172a; display: block;">Blok ${w.blok} No. ${w.noRumah}</strong>
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Nomor WA Terdaftar</span>
                <strong style="font-size: 13px; color: #0f172a; display: block;">${w.noWa || '-'}</strong>
              </td>
              <td style="width: 50%; padding: 8px 12px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-top: none; border-left: none; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 2px;">Tahun Anggaran Cetak</span>
                <strong style="font-size: 13px; color: #0f172a; display: block;">Tahun ${targetYear}</strong>
              </td>
            </tr>
          </table>

          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #0f172a;">I. Rincian Iuran Bulanan Tahun ${targetYear}</h3>
          <table class="table-bills">
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th>Bulan Penagihan</th>
                <th style="text-align: right;">Nominal Iuran</th>
                <th style="text-align: center;">Status Bayar</th>
                <th>Keterangan Pembayaran / Riwayat</th>
              </tr>
            </thead>
            <tbody>
              ${currentYearList.map((item, idx) => {
                const statusBadge = item.lunas 
                  ? `<span class="badge-lunas">Lunas</span>` 
                  : `<span class="badge-belum">Belum Lunas</span>`;
                  
                const formattedPayDate = item.tanggalBayar 
                  ? `${item.tanggalBayar} ${item.jamBayar || ''}` 
                  : '-';
                  
                return `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.b}</strong></td>
                    <td style="text-align: right; font-family: monospace;">Rp ${item.nominal.toLocaleString('id-ID')}</td>
                    <td style="text-align: center;">${statusBadge}</td>
                    <td style="font-size: 11px; color: #4a5568;">${item.lunas ? `Diterima pada ${formattedPayDate}` : `Menunggu pembayaran`}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #0f172a;">II. Rincian Tunggakan Tahun Lalu & Sebelum</h3>
          ${priorUnpaidList.length === 0 ? `
            <p class="note-box" style="font-style: italic; color: #16a34a; font-weight: 600; font-size: 12px; border: 1px dashed #bbf7d0; padding: 10px; background-color: #f0fdf4; border-radius: 6px; margin-bottom: 25px;">
              ✓ Hebat! Warga ini bebas tunggakan iuran bulanan dari tahun-tahun sebelumnya.
            </p>
          ` : `
            <table class="table-bills" style="margin-bottom: 25px;">
              <thead>
                <tr>
                  <th style="width: 5%;">No</th>
                  <th>Tahun Anggaran</th>
                  <th>Bulan</th>
                  <th style="text-align: right;">Tarif Iuran</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${priorUnpaidList.map((item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>Tahun ${item.tahun}</strong></td>
                    <td>${item.bulan}</td>
                    <td style="text-align: right; font-family: monospace; color: #b91c1c;">Rp ${item.nominal.toLocaleString('id-ID')}</td>
                    <td style="text-align: center;"><span class="badge-belum">Tertunggak</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}

          <div class="box-summary">
            <h4 class="summary-title font-bold">Ringkasan Beban & Akumulasi Tagihan</h4>
            <div class="summary-row">
              <span>Total Tunggakan Iuran Tahun ${targetYear}:</span>
              <span style="font-family: monospace;">Rp ${currentUnpaidTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row">
              <span>Total Terbayar Tahun ${targetYear}:</span>
              <span style="font-family: monospace; color: #16a34a; font-weight: bold;">Rp ${currentPaidTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row">
              <span>Total Akumulasi Tunggakan Tahun Sebelumnya (Sisa Arrears):</span>
              <span style="font-family: monospace; color: #b91c1c;">Rp ${priorUnpaidTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row total">
              <span>GRAND TOTAL TUNGGAKAN KUMULATIF:</span>
              <span style="font-family: monospace;">Rp ${grandTotalTunggakan.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div class="note-box" style="margin-top: 20px; font-size: 11px; color: #475569; border-left: 2px solid #0284c7; padding-left: 10px; line-height: 1.4;">
            *Catatan Penting:<br/>
            1. Harap melunasi tunggakan iuran demi kelancaran kegiatan sosial, keamanan, dan pemeliharaan facilities di lingkungan ${rtNum}.<br/>
            2. Pembayaran dapat diserahkan langsung kepada Pengurus RT / Bendahara / Kolektor resmi atau ditransfer ke rekening bank resmi RT.
          </div>

          <table class="signature-table" style="width: 100%; border-collapse: collapse; border: none; margin-top: 40px; page-break-inside: avoid;">
            <tr>
              <td style="width: 33%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <span class="signature-title" style="font-size: 11px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 55px;">Bendahara RT 08</span>
                <strong class="signature-name" style="font-size: 12px; color: #0f172a; text-decoration: underline; display: block;">${bendaharaNameFormatted}</strong>
              </td>
              <td style="width: 33%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <span class="signature-title" style="font-size: 11px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 55px;">Ketua RT 08</span>
                <strong class="signature-name" style="font-size: 12px; color: #0f172a; text-decoration: underline; display: block;">${adminNameFormatted}</strong>
              </td>
              <td style="width: 33%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <span class="signature-title" style="font-size: 11px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 55px;">Warga / Penerima</span>
                <strong class="signature-name" style="font-size: 12px; color: #0f172a; text-decoration: underline; display: block;">${cleanSignatureName(w.nama)}</strong>
              </td>
            </tr>
          </table>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 505);
            }
          </script>
        </body>
      </html>
    `);
    printDoc.close();
  };

  const printRombongInvoice = (r: RombongBill, targetYear: number) => {
    const printDoc = {
      write: (htmlContent: string) => {
        printContentViaIframe(htmlContent);
      },
      close: () => {}
    };

    const defaultMonths = fullMonths;
    const priorYears = yearsList.filter(yr => yr < targetYear);
    
    // Calculate past year arrears
    const priorUnpaidList: { tahun: number; bulan: string; nominal: number }[] = [];
    let priorUnpaidTotal = 0;
    priorYears.forEach(yr => {
      defaultMonths.forEach(m => {
        const slot = r.iuranRombong.find(b =>
          b.bulan.toLowerCase() === m.toLowerCase() &&
          (b.tahun === yr || (!b.tahun && yr === 2026))
        );
        const isLunas = slot ? slot.lunas : false;
        if (!isLunas) {
          const rate = getDefaultRombongRate(yr, m, rateRombong);
          priorUnpaidList.push({ tahun: yr, bulan: m, nominal: rate });
          priorUnpaidTotal += rate;
        }
      });
    });

    // Calculate current chosen year info
    const currentYearList: { b: string; lunas: boolean; nominal: number; tanggalBayar?: string; jamBayar?: string }[] = [];
    let currentUnpaidTotal = 0;
    let currentPaidTotal = 0;
    
    defaultMonths.forEach(m => {
      const slot = r.iuranRombong.find(b =>
        b.bulan.toLowerCase() === m.toLowerCase() &&
        (b.tahun === targetYear || (!b.tahun && targetYear === 2026))
      );
      const isLunas = slot ? slot.lunas : false;
      const nominal = slot ? slot.nominal : getDefaultRombongRate(targetYear, m, rateRombong);
      const isDue = isMonthDue(m, targetYear);
      
      currentYearList.push({
        b: m,
        lunas: isLunas,
        nominal: nominal,
        tanggalBayar: slot?.tanggalBayar,
        jamBayar: slot?.jamBayar
      });
      
      if (isLunas) {
        currentPaidTotal += nominal;
      } else if (isDue) {
        currentUnpaidTotal += nominal;
      }
    });

    const grandTotalTunggakan = priorUnpaidTotal + currentUnpaidTotal;
    const rtNum = rtTitle.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i) ? `RT ${rtTitle.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i)![1]}` : 'RT 008';

    printDoc.write(`
      <html>
        <head>
          <title>Tagihan Lapak Rombong - ${r.namaPemilik}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              padding: 30px;
              margin: 0;
              background-color: #ffffff;
              font-size: 13px;
              line-height: 1.5;
            }
            .kop-surat {
              text-align: center;
              border-bottom: 3px double #000000;
              padding-bottom: 15px;
              margin-bottom: 25px;
            }
            .kop-title {
              font-size: 18px;
              font-weight: 850;
              text-transform: uppercase;
              color: #0d1b2a;
              margin: 0;
              letter-spacing: 0.5px;
            }
            .kop-subtitle {
              font-size: 11px;
              color: #4a5568;
              margin: 4px 0 0 0;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            .invoice-tag {
              display: inline-block;
              background-color: #f1f5f9;
              color: #10b981;
              font-weight: 800;
              font-size: 11px;
              padding: 4px 10px;
              border-radius: 6px;
              text-transform: uppercase;
              margin-bottom: 20px;
            }
            .grid-meta {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 15px;
              margin-bottom: 25px;
              padding: 12px 15px;
              background-color: #fafdfb;
              border: 1px solid #d1fae5;
              border-radius: 8px;
            }
            .meta-item label {
              display: block;
              font-size: 10px;
              font-weight: 700;
              color: #047857;
              text-transform: uppercase;
              margin-bottom: 3px;
            }
            .meta-item value {
              display: block;
              font-size: 13px;
              font-weight: 700;
              color: #065f46;
            }
            .table-bills {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .table-bills th {
              background-color: #065f46;
              color: #ffffff;
              font-size: 11px;
              font-weight: 700;
              text-transform: uppercase;
              padding: 10px 12px;
              text-align: left;
              border: 1px solid #047857;
            }
            .table-bills td {
              padding: 10px 12px;
              border: 1px solid #cbd5e1;
              font-size: 12px;
            }
            .table-bills tr:nth-child(even) {
              background-color: #fafdfb;
            }
            .badge-lunas {
              background-color: #dcfce7;
              color: #15803d;
              font-weight: 700;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .badge-belum {
              background-color: #fee2e2;
              color: #b91c1c;
              font-weight: 700;
              font-size: 10px;
              padding: 2px 6px;
              border-radius: 4px;
              text-transform: uppercase;
            }
            .box-summary {
              border: 1px solid #d1fae5;
              border-radius: 8px;
              padding: 15px;
              background-color: #fafdfb;
              margin-bottom: 30px;
            }
            .summary-title {
              font-size: 12px;
              font-weight: 700;
              color: #065f46;
              text-transform: uppercase;
              border-bottom: 1px solid #a7f3d0;
              padding-bottom: 5px;
              margin-bottom: 10px;
            }
            .summary-row {
              display: flex;
              justify-content: space-between;
              font-size: 12px;
              margin-bottom: 6px;
            }
            .summary-row.total {
              font-size: 15px;
              font-weight: 850;
              color: #b91c1c;
              border-top: 1.5px dashed #a7f3d0;
              padding-top: 8px;
              margin-top: 8px;
            }
            .footer-sign {
              display: grid;
              grid-template-cols: 1fr 1fr 1fr;
              gap: 20px;
              text-align: center;
              margin-top: 50px;
              page-break-inside: avoid;
            }
            .sign-col {
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              height: 105px;
            }
            .sign-label {
              font-size: 11px;
              font-weight: 600;
              color: #4a5568;
            }
            .sign-name {
              font-size: 12px;
              font-weight: 700;
              color: #0f172a;
              text-decoration: underline;
            }
            .no-print-btn {
              padding: 8px 16px;
              background-color: #059669;
              color: white;
              border: none;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              margin-bottom: 20px;
            }
            @media print {
              @page {
                size: A5 portrait;
                margin: 4mm 6mm;
              }
              body {
                padding: 0 !important;
                margin: 0 !important;
                font-size: 9px !important;
                line-height: 1.2 !important;
              }
              .kop-surat {
                padding-bottom: 4px !important;
                margin-bottom: 6px !important;
                border-bottom: 1.5px solid #000000 !important;
              }
              .kop-title {
                font-size: 13px !important;
              }
              .kop-subtitle {
                font-size: 8px !important;
                margin-top: 2px !important;
              }
              .invoice-tag {
                font-size: 8px !important;
                padding: 2px 5px !important;
                margin-bottom: 5px !important;
              }
              .meta-table {
                margin-bottom: 6px !important;
              }
              .meta-table td {
                padding: 4px 6px !important;
              }
              .meta-table span {
                font-size: 7.5px !important;
                margin-bottom: 1px !important;
              }
              .meta-table strong {
                font-size: 9.5px !important;
              }
              h3 {
                font-size: 9.5px !important;
                margin-top: 6px !important;
                margin-bottom: 3px !important;
              }
              .table-bills {
                margin-bottom: 6px !important;
              }
              .table-bills th {
                padding: 2.5px 5px !important;
                font-size: 7.5px !important;
              }
              .table-bills td {
                padding: 2.5px 5px !important;
                font-size: 7.5px !important;
              }
              .badge-lunas, .badge-belum {
                font-size: 7px !important;
                padding: 0.5px 1.5px !important;
              }
              .box-summary {
                padding: 5px 8px !important;
                margin-bottom: 5px !important;
                border-radius: 4px !important;
              }
              .summary-title {
                font-size: 8px !important;
                padding-bottom: 1px !important;
                margin-bottom: 2px !important;
              }
              .summary-row {
                font-size: 7.5px !important;
                margin-bottom: 1px !important;
              }
              .summary-row.total {
                font-size: 9.5px !important;
                padding-top: 3px !important;
                margin-top: 3px !important;
              }
              .note-box {
                margin-top: 3px !important;
                font-size: 7.5px !important;
                line-height: 1.15 !important;
              }
              .signature-table {
                margin-top: 10px !important;
              }
              .signature-title {
                margin-bottom: 30px !important;
                font-size: 7.5px !important;
              }
              .signature-name {
                font-size: 8px !important;
              }
              * {
                visibility: visible !important;
              }
              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print" style="text-align: right;">
            <button class="no-print-btn" onclick="window.print()">Cetak Dokumen / Simpan PDF</button>
          </div>
          
          <div class="kop-surat">
            <h1 class="kop-title">${rtTitle}</h1>
            <div class="kop-subtitle">${rtAddress} — Email: ${rtEmail}</div>
          </div>
          
          <div style="text-align: center; margin-bottom: 10px;">
            <div class="invoice-tag">SURAT TAGIHAN SEWA & IURAN ROMBONG KULINER</div>
          </div>
          
          <table class="meta-table" style="width: 100%; margin-bottom: 20px; border-collapse: collapse; border: none;">
            <tr>
              <td style="width: 50%; padding: 8px 12px; background-color: #fafdfb; border: 1px solid #d1fae5; border-radius: 6px 0 0 6px; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; display: block; margin-bottom: 2px;">Nama Pemilik Rombong</span>
                <strong style="font-size: 13px; color: #065f46; display: block;">${r.namaPemilik}</strong>
              </td>
              <td style="width: 50%; padding: 8px 12px; background-color: #fafdfb; border: 1px solid #d1fae5; border-left: none; border-radius: 0 6px 6px 0; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; display: block; margin-bottom: 2px;">Nomor Lapak / Lokasi</span>
                <strong style="font-size: 13px; color: #065f46; display: block;">No. Lapak: ${r.noLapak} (${r.lokasi})</strong>
              </td>
            </tr>
            <tr>
              <td style="width: 50%; padding: 8px 12px; background-color: #fafdfb; border: 1px solid #d1fae5; border-top: none; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; display: block; margin-bottom: 2px;">Nomor WA Terdaftar</span>
                <strong style="font-size: 13px; color: #065f46; display: block;">${r.noWa || '-'}</strong>
              </td>
              <td style="width: 50%; padding: 8px 12px; background-color: #fafdfb; border: 1px solid #d1fae5; border-top: none; border-left: none; vertical-align: top;">
                <span style="font-size: 10px; font-weight: 700; color: #047857; text-transform: uppercase; display: block; margin-bottom: 2px;">Tahun Anggaran Cetak</span>
                <strong style="font-size: 13px; color: #065f46; display: block;">Tahun ${targetYear}</strong>
              </td>
            </tr>
          </table>

          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #0f172a;">I. Rincian Iuran Bulanan Tahun ${targetYear}</h3>
          <table class="table-bills">
            <thead>
              <tr>
                <th style="width: 5%;">No</th>
                <th>Bulan Sewa / Penagihan</th>
                <th style="text-align: right;">Nominal Iuran</th>
                <th style="text-align: center;">Status Bayar</th>
                <th>Keterangan Pembayaran / Riwayat</th>
              </tr>
            </thead>
            <tbody>
              ${currentYearList.map((item, idx) => {
                const statusBadge = item.lunas 
                  ? `<span class="badge-lunas">Lunas</span>` 
                  : `<span class="badge-belum">Belum Lunas</span>`;
                  
                const formattedPayDate = item.tanggalBayar 
                  ? `${item.tanggalBayar} ${item.jamBayar || ''}` 
                  : '-';
                  
                return `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>${item.b}</strong></td>
                    <td style="text-align: right; font-family: monospace;">Rp ${item.nominal.toLocaleString('id-ID')}</td>
                    <td style="text-align: center;">${statusBadge}</td>
                    <td style="font-size: 11px; color: #4a5568;">${item.lunas ? `Diterima pada ${formattedPayDate}` : `Menunggu pembayaran`}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>

          <h3 style="font-size: 13px; font-weight: 700; text-transform: uppercase; margin-bottom: 10px; color: #0f172a;">II. Rincian Tunggakan Tahun Lalu & Sebelum</h3>
          ${priorUnpaidList.length === 0 ? `
            <p class="note-box" style="font-style: italic; color: #16a34a; font-weight: 600; font-size: 12px; border: 1px dashed #bbf7d0; padding: 10px; background-color: #f0fdf4; border-radius: 6px; margin-bottom: 25px;">
              ✓ Hebat! Pemilik rombong ini bebas tunggakan iuran dari tahun-tahun sebelumnya.
            </p>
          ` : `
            <table class="table-bills" style="margin-bottom: 25px;">
              <thead>
                <tr>
                  <th style="width: 5%;">No</th>
                  <th>Tahun Anggaran</th>
                  <th>Bulan</th>
                  <th style="text-align: right;">Tarif Iuran</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${priorUnpaidList.map((item, idx) => `
                  <tr>
                    <td style="text-align: center;">${idx + 1}</td>
                    <td><strong>Tahun ${item.tahun}</strong></td>
                    <td>${item.bulan}</td>
                    <td style="text-align: right; font-family: monospace; color: #b91c1c;">Rp ${item.nominal.toLocaleString('id-ID')}</td>
                    <td style="text-align: center;"><span class="badge-belum">Tertunggak</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          `}

          <div class="box-summary">
            <h4 class="summary-title font-bold">Ringkasan Beban & Akumulasi Tagihan Rombong</h4>
            <div class="summary-row">
              <span>Total Tunggakan Iuran Tahun ${targetYear}:</span>
              <span style="font-family: monospace;">Rp ${currentUnpaidTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row">
              <span>Total Terbayar Tahun ${targetYear}:</span>
              <span style="font-family: monospace; color: #16a34a; font-weight: bold;">Rp ${currentPaidTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row">
              <span>Total Akumulasi Tunggakan Tahun Sebelumnya (Sisa Arrears):</span>
              <span style="font-family: monospace; color: #b91c1c;">Rp ${priorUnpaidTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="summary-row total">
              <span>GRAND TOTAL TUNGGAKAN KUMULATIF:</span>
              <span style="font-family: monospace;">Rp ${grandTotalTunggakan.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div class="note-box" style="margin-top: 20px; font-size: 11px; color: #475569; border-left: 2px solid #059669; padding-left: 10px; line-height: 1.4;">
            *Catatan Penting:<br/>
            1. Mohon melakukan penyelesaian iuran/sewa lapak rombong demi kenyamanan bersama dan penataan ketertiban lingkungan ${rtNum}.<br/>
            2. Pembayaran dapat diserahkan langsung kepada Pengurus RT / Bendahara / Kolektor resmi atau ditransfer ke rekening bank resmi RT.
          </div>

          <table class="signature-table" style="width: 100%; border-collapse: collapse; border: none; margin-top: 40px; page-break-inside: avoid;">
            <tr>
              <td style="width: 33%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <span class="signature-title" style="font-size: 11px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 55px;">Bendahara RT 08</span>
                <strong class="signature-name" style="font-size: 12px; color: #0f172a; text-decoration: underline; display: block;">${bendaharaNameFormatted}</strong>
              </td>
              <td style="width: 33%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <span class="signature-title" style="font-size: 11px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 55px;">Ketua RT 08</span>
                <strong class="signature-name" style="font-size: 12px; color: #0f172a; text-decoration: underline; display: block;">${adminNameFormatted}</strong>
              </td>
              <td style="width: 33%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <span class="signature-title" style="font-size: 11px; font-weight: 600; color: #4a5568; display: block; margin-bottom: 55px;">Pemilik Lapak / Rombong</span>
                <strong class="signature-name" style="font-size: 12px; color: #0f172a; text-decoration: underline; display: block;">${cleanSignatureName(r.namaPemilik)}</strong>
              </td>
            </tr>
          </table>
          
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
              }, 505);
            }
          </script>
        </body>
      </html>
    `);
    printDoc.close();
  };

  const exportWargaData = (warga: WargaBill) => {
    const printDoc = {
      write: (htmlContent: string) => {
        printContentViaIframe(htmlContent);
      },
      close: () => {}
    };

    const iuranLunasCount = warga.iuranRT.filter(i => i.lunas).length;
    const iuranBelumCount = warga.iuranRT.filter(i => !i.lunas).length;

    const isLokal = (warga.noKtp?.startsWith('3515')) || 
                    (warga.alamatKtpAsal ? /sidoarjo/i.test(warga.alamatKtpAsal) : false);
    const statusKtpText = warga.alamatKtpAsal || warga.noKtp 
      ? (isLokal ? 'KTP LOKAL (SIDOARJO)' : 'KTP LUAR DAERAH')
      : 'BELUM DIISI';
    const statusBadgeStyle = isLokal 
      ? 'background:#f0fdf4; color:#166534; border:1px solid #bbf7d0;' 
      : 'background:#fffbeb; color:#b45309; border:1px solid #fde68a;';

    printDoc.write(`
      <html>
        <head>
          <title>Dossier Resmi Warga - ${warga.nama}</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              padding: 40px;
              margin: 0;
              background-color: #ffffff;
              font-size: 14px;
              line-height: 1.6;
            }
            .header {
              border-bottom: 3px double #cbd5e1;
              padding-bottom: 20px;
              margin-bottom: 25px;
              text-align: center;
            }
            .title-major {
              font-size: 22px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0;
              color: #0f172a;
            }
            .title-sub {
              font-size: 13px;
              color: #64748b;
              margin: 5px 0 0 0;
              font-weight: 600;
            }
            .section {
              margin-bottom: 30px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 15px;
              font-weight: 700;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 15px;
              color: #0284c7;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
            }
            .full-width {
              grid-column: span 2;
              background: #f8fafc;
              border: 1px solid #e2e8f0;
              padding: 12px 15px;
              border-radius: 8px;
              margin-top: 10px;
            }
            .field {
              margin-bottom: 12px;
            }
            .field-label {
              font-size: 11px;
              font-weight: 750;
              text-transform: uppercase;
              color: #64748b;
              margin-bottom: 2px;
            }
            .field-value {
              font-size: 14px;
              font-weight: 600;
              color: #0f172a;
            }
            .doc-container {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 20px;
              margin-top: 20px;
            }
            .doc-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 15px;
              background-color: #f8fafc;
              text-align: center;
            }
            .doc-card h5 {
              margin: 0 0 10px 0;
              color: #334155;
              font-size: 12px;
              font-weight: 700;
              text-transform: uppercase;
            }
            .scan-img {
              max-width: 100%;
              max-height: 250px;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
              object-fit: contain;
              box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            }
            .no-scan {
              padding: 40px 20px;
              color: #94a3b8;
              font-style: italic;
              font-size: 12px;
              border: 1px dashed #cbd5e1;
              border-radius: 8px;
              background: #ffffff;
            }
            .footer-note {
              margin-top: 50px;
              border-top: 1px solid #e2e8f0;
              padding-top: 15px;
              text-align: center;
              font-size: 11px;
              color: #94a3b8;
            }
            .badge {
              padding: 3px 8px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              display: inline-block;
            }
            @media print {
              * {
                visibility: visible !important;
              }
              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              body {
                padding: 10px;
              }
            }
            .print-btn-bar {
              background: #f1f5f9;
              padding: 12px 20px;
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
              border-radius: 8px;
            }
            .btn-print {
              background-color: #0284c7;
              color: white;
              border: none;
              padding: 8px 16px;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              font-size: 13px;
            }
            .btn-print:hover {
              background-color: #0369a1;
            }
          </style>
        </head>
        <body>
          <div class="print-btn-bar no-print">
            <button class="btn-print" onclick="window.print()">Cetak / Simpan Sebagai PDF</button>
          </div>
          <div class="header">
            <h1 class="title-major">Dossier Arsip Kependudukan</h1>
            <div class="title-sub">${rtTitle} — ${rtAddress}</div>
          </div>
          
          <div class="section">
            <div class="section-title">Profil & Data Identitas Resmi</div>
            <div class="grid">
              <div>
                <div class="field">
                  <div class="field-label">Nama Kepala Keluarga</div>
                  <div class="field-value">${warga.nama}</div>
                </div>
                <div class="field">
                  <div class="field-label">Alamat / ID Rumah</div>
                  <div class="field-value">Blok ${warga.blok} No. ${warga.noRumah}</div>
                </div>
                <div class="field">
                  <div class="field-label">No. WhatsApp</div>
                  <div class="field-value">${warga.noWa || '-'}</div>
                </div>
              </div>
              <div>
                <div class="field">
                  <div class="field-label">Nomor KTP</div>
                  <div class="field-value font-mono" style="letter-spacing:1px">${warga.noKtp || 'Belum Diisi'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Nomor Kartu Keluarga (KK)</div>
                  <div class="field-value font-mono" style="letter-spacing:1px">${warga.noKk || 'Belum Diisi'}</div>
                </div>
                <div class="field">
                  <div class="field-label">Status Regional KTP</div>
                  <div class="field-value">
                    <span class="badge" style="${statusBadgeStyle}">${statusKtpText}</span>
                  </div>
                </div>
              </div>

              <div class="full-width">
                <div class="field" style="margin-bottom:0">
                  <div class="field-label">Alamat Lengkap Asal (Sesuai KTP)</div>
                  <div class="field-value" style="font-weight:500; font-size:13px; color:#334155;">
                    ${warga.alamatKtpAsal || '<span style="color:#94a3b8; font-style:italic;">Belum Diisi / Tidak Ada</span>'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Lampiran Fotocopy & Berkas Pendukung</div>
            <div class="doc-container">
              <div class="doc-card">
                <h5>Fotocopy KTP</h5>
                ${warga.ktpBase64 ? `<img src="${warga.ktpBase64}" class="scan-img" />` : `<div class="no-scan">Tidak ada photocopy/scan KTP terlampir</div>`}
              </div>
              <div class="doc-card">
                <h5>Fotocopy Kartu Keluarga (KK)</h5>
                ${warga.kkBase64 ? `<img src="${warga.kkBase64}" class="scan-img" />` : `<div class="no-scan">Tidak ada photocopy/scan KK terlampir</div>`}
              </div>
            </div>
          </div>

          <div class="footer-note">
            Dokumen ini dicetak otomatis secara sistem digital RT 08 Perumtas pada tanggal ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}.
          </div>
        </body>
      </html>
    `);
    printDoc.close();
  };

  const parseAnggotaKeluargaString = (str: string) => {
    if (!str || !str.trim()) return [];
    
    const list: { id: string; nama: string; hubungan: string; nik?: string; noHape?: string }[] = [];
    const membersRaw = str.split(';');
    
    membersRaw.forEach((mRaw) => {
      const val = mRaw.trim();
      if (!val) return;
      
      const openParen = val.indexOf('(');
      const closeParen = val.lastIndexOf(')');
      
      if (openParen > -1) {
        const nama = val.substring(0, openParen).trim();
        let detailString = val.substring(openParen + 1, closeParen > -1 ? closeParen : val.length).trim();
        
        let hubungan = 'Lainnya';
        let nik: string | undefined = undefined;
        let noHape: string | undefined = undefined;
        
        const parts = detailString.split(/[|,]/).map(p => p.trim());
        if (parts.length > 0) {
          hubungan = parts[0] || 'Lainnya';
          
          parts.slice(1).forEach(part => {
            if (part.toLowerCase().includes('nik:')) {
              nik = part.substring(part.toLowerCase().indexOf('nik:') + 4).trim();
            } else if (part.toLowerCase().includes('wa:')) {
              noHape = part.substring(part.toLowerCase().indexOf('wa:') + 3).trim();
            } else if (/^\d+$/.test(part)) {
              if (part.length === 16) {
                nik = part;
              } else {
                noHape = part;
              }
            }
          });
        }
        
        if (nama) {
          list.push({
            id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            nama,
            hubungan,
            nik: nik || undefined,
            noHape: noHape || undefined
          });
        }
      } else {
        list.push({
          id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          nama: val,
          hubungan: 'Lainnya'
        });
      }
    });
    
    return list;
  };

  const mergeWargaBill = (existing: WargaBill, row: any): WargaBill => {
    const rawAnggota = row['Anggota Keluarga'] || row['anggotaKeluarga'] || row['AnggotaKeluarga'];
    const anggotaKeluarga = rawAnggota !== undefined 
      ? parseAnggotaKeluargaString(String(rawAnggota)) 
      : existing.anggotaKeluarga || [];

    const statusRumahRaw = row['Status Rumah'] !== undefined ? String(row['Status Rumah']).trim().toLowerCase() : '';
    const statusRumah = statusRumahRaw 
      ? (statusRumahRaw.includes('sewa') || statusRumahRaw.includes('kontrak') ? 'sewa_kontrak' : (statusRumahRaw.includes('lain') || statusRumahRaw.includes('tumpang') ? 'lainnya' : 'milik_sendiri'))
      : existing.statusRumah;

    return {
      ...existing,
      nama: row['Nama Kepala Keluarga'] ? String(row['Nama Kepala Keluarga']).trim() : existing.nama,
      blok: row['Blok Rumah'] ? String(row['Blok Rumah']).trim() : existing.blok,
      noRumah: row['Nomor Rumah'] ? String(row['Nomor Rumah']).trim() : existing.noRumah,
      noWa: row['No WhatsApp'] !== undefined ? String(row['No WhatsApp']).trim() : existing.noWa,
      noKtp: row['Nomor KTP (NIK)'] !== undefined ? (String(row['Nomor KTP (NIK)']).trim() || undefined) : existing.noKtp,
      noKk: row['Nomor KK'] !== undefined ? (String(row['Nomor KK']).trim() || undefined) : existing.noKk,
      alamatKtpAsal: row['Alamat Asal KTP'] !== undefined ? (String(row['Alamat Asal KTP']).trim() || undefined) : existing.alamatKtpAsal,
      statusRumah: statusRumah || undefined,
      anggotaKeluarga
    };
  };

  const mergeRombongBill = (existing: RombongBill, row: any): RombongBill => {
    const iuranRombong = [...existing.iuranRombong];
    
    yearsList.forEach(yr => {
      fullMonths.forEach(m => {
        const statusKey = `Sewa & Iuran ${m} ${yr} (Status)`;
        const nominalKey = `Sewa & Iuran ${m} ${yr} (Nominal)`;
        const tanggalKey = `Sewa & Iuran ${m} ${yr} (Tanggal Bayar)`;
        const jamKey = `Sewa & Iuran ${m} ${yr} (Jam Bayar)`;
        
        if (row[statusKey] !== undefined) {
          const lunas = row[statusKey] === 'Lunas';
          const nominal = Number(row[nominalKey]) || getDefaultRombongRate(yr, m, rateRombong);
          const tanggalBayar = row[tanggalKey] ? String(row[tanggalKey]).trim() : undefined;
          const jamBayar = row[jamKey] ? String(row[jamKey]).trim() : undefined;
          
          const idx = iuranRombong.findIndex(b => 
            b.bulan.toLowerCase() === m.toLowerCase() && 
            (b.tahun === yr || (!b.tahun && yr === 2026))
          );
          
          if (idx > -1) {
            iuranRombong[idx] = {
              ...iuranRombong[idx],
              lunas,
              nominal,
              tahun: yr,
              tanggalBayar,
              jamBayar
            };
          } else {
            iuranRombong.push({
              bulan: m,
              lunas,
              nominal,
              tahun: yr,
              tanggalBayar,
              jamBayar
            });
          }
        }
      });
    });

    return {
      ...existing,
      namaPemilik: row['Nama Pemilik Lapak'] ? String(row['Nama Pemilik Lapak']).trim() : existing.namaPemilik,
      noLapak: row['Nomor Lapak'] ? String(row['Nomor Lapak']).trim() : existing.noLapak,
      lokasi: row['Lokasi Rombong'] ? String(row['Lokasi Rombong']).trim() : existing.lokasi,
      noWa: row['No WhatsApp'] !== undefined ? String(row['No WhatsApp']).trim() : existing.noWa,
      iuranRombong
    };
  };

  const createWargaBillFromRow = (row: any): WargaBill => {
    const id = `warga-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const nama = String(row['Nama Kepala Keluarga'] || 'Tanpa Nama').trim();
    const blok = String(row['Blok Rumah'] || 'A4').trim();
    const noRumah = String(row['Nomor Rumah'] || '').trim();
    const noWa = String(row['No WhatsApp'] || '').trim();
    const noKtp = String(row['Nomor KTP (NIK)'] || '').trim();
    const noKk = String(row['Nomor KK'] || '').trim();
    const alamatKtpAsal = String(row['Alamat Asal KTP'] || '').trim();
    
    const statusRumahRaw = String(row['Status Rumah'] || '').trim().toLowerCase();
    const statusRumah = statusRumahRaw 
      ? (statusRumahRaw.includes('sewa') || statusRumahRaw.includes('kontrak') ? 'sewa_kontrak' : (statusRumahRaw.includes('lain') || statusRumahRaw.includes('tumpang') ? 'lainnya' : 'milik_sendiri')) 
      : 'milik_sendiri';

    const rawAnggota = row['Anggota Keluarga'] || row['anggotaKeluarga'] || row['AnggotaKeluarga'];
    const anggotaKeluarga = rawAnggota ? parseAnggotaKeluargaString(String(rawAnggota)) : [];
    
    const iuranRT: any[] = [];
    yearsList.forEach(yr => {
      fullMonths.forEach(m => {
        iuranRT.push({
          bulan: m,
          lunas: false,
          nominal: getDefaultRtRate(yr, m, rateRT),
          tahun: yr
        });
      });
    });

    return {
      id,
      nama,
      blok,
      noRumah,
      noWa,
      noKtp: noKtp || undefined,
      noKk: noKk || undefined,
      alamatKtpAsal: alamatKtpAsal || undefined,
      statusRumah,
      iuranRT,
      anggotaKeluarga
    };
  };

  const createRombongBillFromRow = (row: any): RombongBill => {
    const id = `rombong-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const namaPemilik = String(row['Nama Pemilik Lapak'] || 'Tanpa Nama').trim();
    const noLapak = String(row['Nomor Lapak'] || '').trim();
    const lokasi = String(row['Lokasi Rombong'] || 'Samping Lapangan').trim();
    const noWa = String(row['No WhatsApp'] || '').trim();
    
    const iuranRombong: any[] = [];
    yearsList.forEach(yr => {
      fullMonths.forEach(m => {
        const statusKey = `Sewa & Iuran ${m} ${yr} (Status)`;
        const nominalKey = `Sewa & Iuran ${m} ${yr} (Nominal)`;
        const tanggalKey = `Sewa & Iuran ${m} ${yr} (Tanggal Bayar)`;
        const jamKey = `Sewa & Iuran ${m} ${yr} (Jam Bayar)`;
        
        const lunas = row[statusKey] === 'Lunas';
        const nominal = Number(row[nominalKey]) || getDefaultRombongRate(yr, m, rateRombong);
        const tanggalBayar = row[tanggalKey] ? String(row[tanggalKey]).trim() : undefined;
        const jamBayar = row[jamKey] ? String(row[jamKey]).trim() : undefined;
        
        iuranRombong.push({
          bulan: m,
          lunas,
          nominal,
          tahun: yr,
          tanggalBayar,
          jamBayar
        });
      });
    });

    return {
      id,
      namaPemilik,
      noLapak,
      lokasi,
      noWa,
      iuranRombong
    };
  };

  const exportWargaToExcel = () => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Pengurus berkategori Admin yang diperbolehkan mengunduh data dalam bentuk Excel.');
      return;
    }
    try {
      const rows: any[] = [];
      wargaList.filter(w => !w.isDeleted).forEach(w => {
        // Primary citizen (Kepala Keluarga)
        rows.push({
          'Kode / ID (Jangan Diubah)': w.id,
          'Nama Kepala Keluarga': w.nama,
          'Anggota Keluarga': '', // Empty for head of family
          'Status Rumah': w.statusRumah === 'sewa_kontrak' ? 'Sewa / Kontrak' : (w.statusRumah === 'lainnya' ? 'Lainnya / Menumpang' : 'Milik Sendiri'),
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
              'Nama Kepala Keluarga': m.nama, // Holds family member's name
              'Anggota Keluarga': m.hubungan || 'Lainnya', // Holds relationship
              'Status Rumah': '',
              'Nomor KTP (NIK)': m.nik || '',
              'Nomor KK': '',
              'Alamat Asal KTP': '',
              'Blok Rumah': '',
              'Nomor Rumah': '',
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

      XLSX.writeFile(workbook, `Data_Warga_RT08.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data warga ke Excel.');
    }
  };

  const exportRombongToExcel = () => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Pengurus berkategori Admin yang diperbolehkan mengunduh data dalam bentuk Excel.');
      return;
    }
    try {
      const rows = rombongList.filter(r => !r.isDeleted).map(r => {
        const row: any = {
          'Kode / ID (Jangan Diubah)': r.id,
          'Nama Pemilik Lapak': r.namaPemilik,
          'Nomor Lapak': r.noLapak || '',
          'Lokasi Rombong': r.lokasi || '',
          'No WhatsApp': r.noWa || '',
        };
        
        return row;
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Data Lapak Rombong');
      
      // Auto-fit columns
      const colWidths = Object.keys(rows[0] || {}).map(key => ({
        wch: Math.max(key.length + 3, 12)
      }));
      worksheet['!cols'] = colWidths;

      XLSX.writeFile(workbook, `Data_Lapak_Rombong_RT08_Tahun_${selectedBillingYear}.xlsx`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengekspor data lapak rombong ke Excel.');
    }
  };

  const importWargaFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Pengurus berkategori Admin yang diperbolehkan mengunduh/mengunggah master database lewat Excel.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        // Validate headers roughly
        const sampleRow = jsonData[0];
        if (!sampleRow['Nama Kepala Keluarga'] && !sampleRow['Nama'] && !sampleRow['Blok Rumah']) {
          alert('Format Kolom Excel Warga tidak sesuai. Pastikan template sesuai format ekspor data warga.');
          return;
        }

        let updatedCount = 0;
        let insertedCount = 0;

        let workingWargaList = [...wargaList];
        
        let currentWarga: any = null;
        let currentWargaIndexInList = -1;

        jsonData.forEach((row: any) => {
          const excelId = row['Kode / ID (Jangan Diubah)'] || row['ID'] || row['id'];
          const blok = row['Blok Rumah'] ? String(row['Blok Rumah']).trim() : '';
          const noRumah = row['Nomor Rumah'] ? String(row['Nomor Rumah']).trim() : '';
          const namaKepala = row['Nama Kepala Keluarga'] ? String(row['Nama Kepala Keluarga']).trim() : '';
          
          // Check if this row represents a primary resident (Kepala Keluarga)
          const isPrimary = excelId || blok || noRumah || !currentWarga;

          if (isPrimary && namaKepala) {
            let existingIndex = -1;
            if (excelId) {
              existingIndex = workingWargaList.findIndex(w => w.id === excelId && !w.isDeleted);
            } else if (blok && noRumah) {
              existingIndex = workingWargaList.findIndex(w => w.blok === blok && w.noRumah === noRumah && !w.isDeleted);
            }

            if (existingIndex > -1) {
              const merged = mergeWargaBill(workingWargaList[existingIndex], row);
              // Clear previous family members so that we populate sequentially from below rows
              merged.anggotaKeluarga = [];
              
              const rawAnggota = row['Anggota Keluarga'] || row['anggotaKeluarga'] || row['AnggotaKeluarga'];
              if (rawAnggota && String(rawAnggota).includes('(')) {
                merged.anggotaKeluarga = parseAnggotaKeluargaString(String(rawAnggota));
              }

              workingWargaList[existingIndex] = merged;
              currentWarga = merged;
              currentWargaIndexInList = existingIndex;
              updatedCount++;
            } else {
              const newWarga = createWargaBillFromRow(row);
              newWarga.anggotaKeluarga = [];
              
              const rawAnggota = row['Anggota Keluarga'] || row['anggotaKeluarga'] || row['AnggotaKeluarga'];
              if (rawAnggota && String(rawAnggota).includes('(')) {
                newWarga.anggotaKeluarga = parseAnggotaKeluargaString(String(rawAnggota));
              }

              workingWargaList.push(newWarga);
              currentWarga = newWarga;
              currentWargaIndexInList = workingWargaList.length - 1;
              insertedCount++;
            }
          } else if (currentWarga && namaKepala) {
            // It represents a family member of current active Kepala Keluarga
            const hubungan = row['Anggota Keluarga'] ? String(row['Anggota Keluarga']).trim() : 'Lainnya';
            const nik = row['Nomor KTP (NIK)'] ? String(row['Nomor KTP (NIK)']).trim() : undefined;
            const rawWa = row['No WhatsApp'] || '';
            const noHape = rawWa ? String(rawWa).replace(/wa:\s*/i, '').trim() : undefined;

            const memberObj = {
              id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
              nama: namaKepala,
              hubungan: hubungan,
              nik: nik || undefined,
              noHape: noHape || undefined
            };

            if (!currentWarga.anggotaKeluarga) {
              currentWarga.anggotaKeluarga = [];
            }
            if (!currentWarga.anggotaKeluarga.some((m: any) => m.nama.toLowerCase() === namaKepala.toLowerCase())) {
              currentWarga.anggotaKeluarga.push(memberObj);
            }

            workingWargaList[currentWargaIndexInList] = { ...currentWarga };
          }
        });

        updateWargaList(workingWargaList);
        alert(`Berhasil mengimpor data warga!\n- ${updatedCount} data warga diperbarui/dimatangkan\n- ${insertedCount} warga baru berhasil didaftarkan.`);
        
        // Log import operation to ledger
        addLedgerEntry({
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: `Import Data Excel Warga: ${jsonData.length} Baris Data (KK & Anggota)`,
          jumlah: 0,
          tipe: 'pemasukan',
          sumberKas: 'rtPettyCash',
          kategori: 'Administrasi Warga',
          petugas: currentUser?.nama.split(' ')[0] || 'Admin'
        });

        // Clear input value so same file can be chosen again
        e.target.value = '';
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat memproses file Excel warga.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importRombongFromExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya Pengurus berkategori Admin yang diperbolehkan mengunduh/mengunggah master database lewat Excel.');
      return;
    }
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('File Excel kosong atau format tidak sesuai.');
          return;
        }

        const sampleRow = jsonData[0];
        if (!sampleRow['Nama Pemilik Lapak'] && !sampleRow['Nama Pemilik'] && !sampleRow['Nomor Lapak']) {
          alert('Format Kolom Excel Rombong tidak sesuai. Pastikan template sesuai format ekspor data rombong Lapak.');
          return;
        }

        let updatedCount = 0;
        let insertedCount = 0;

        let workingRombongList = [...rombongList];

        jsonData.forEach((row: any) => {
          const excelId = row['Kode / ID (Jangan Diubah)'] || row['ID'] || row['id'];
          const existingIndex = excelId ? workingRombongList.findIndex(r => r.id === excelId && !r.isDeleted) : -1;

          if (existingIndex > -1) {
            workingRombongList[existingIndex] = mergeRombongBill(workingRombongList[existingIndex], row);
            updatedCount++;
          } else {
            const newRombong = createRombongBillFromRow(row);
            workingRombongList.push(newRombong);
            insertedCount++;
          }
        });

        updateRombongList(workingRombongList);
        alert(`Berhasil mengimpor data lapak rombong!\n- ${updatedCount} data lapak diperbarui\n- ${insertedCount} lapak kuliner baru didaftarkan.`);

        // Log import operation to ledger
        addLedgerEntry({
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: `Import Data Excel Lapak Rombong: ${jsonData.length} Pemilik`,
          jumlah: 0,
          tipe: 'pemasukan',
          sumberKas: 'rombongTunai',
          kategori: 'Administrasi Rombong',
          petugas: currentUser?.nama.split(' ')[0] || 'Admin'
        });

        e.target.value = '';
      } catch (err) {
        console.error(err);
        alert('Terjadi kesalahan saat memproses file Excel rombong.');
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const exportAllWargaList = (list: WargaBill[]) => {
    const printDoc = {
      write: (htmlContent: string) => {
        printContentViaIframe(htmlContent);
      },
      close: () => {}
    };

    const totalCount = list.length;
    let localCount = 0;
    let foreignCount = 0;
    let unassignedCount = 0;

    const getRtNumber = (title: string) => {
      const match = title.match(/(?:RUKUN TETANGGA|RT)\s+(\d+)/i);
      return match ? `RT ${match[1]}` : 'RT 008';
    };

    const getDesaName = (address: string) => {
      const match = address.match(/(?:desa|ds\.?|kel\.?|kelurahan)\s+([A-Z0-9]+)/i);
      if (match && match[1]) {
        return match[1].toUpperCase();
      }
      if (/popoh/i.test(address)) return 'POPOH';
      if (/grabagan/i.test(address)) return 'GRABAGAN';
      return 'POPOH';
    };

    const rtNum = getRtNumber(rtTitle);
    const villageName = getDesaName(rtAddress);
    const adminUser = usersList.find(u => u.role === 'admin');
    const sekretarisUser = usersList.find(u => u.role === 'sekretaris');

    list.forEach(w => {
      if (!w.noKtp && !w.alamatKtpAsal) {
        unassignedCount++;
      } else {
        const isLokal = (w.noKtp?.startsWith('3515')) || 
                        (w.alamatKtpAsal ? /sidoarjo/i.test(w.alamatKtpAsal) : false);
        if (isLokal) localCount++;
        else foreignCount++;
      }
    });

    const rowsHtml = list.map((w, index) => {
      const isLokal = (w.noKtp?.startsWith('3515')) || 
                      (w.alamatKtpAsal ? /sidoarjo/i.test(w.alamatKtpAsal) : false);
      
      let statusLabel = 'Belum Diisi';
      let statusStyle = 'color: #64748b; font-weight: bold; font-family: monospace; font-size: 10px;';
      
      if (w.noKtp || w.alamatKtpAsal) {
        if (isLokal) {
          statusLabel = 'LOKAL';
          statusStyle = 'background-color: #f0fdf4; color: #166534; font-weight: 800; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #bbf7d0;';
        } else {
          statusLabel = 'LUAR DAERAH';
          statusStyle = 'background-color: #fffbeb; color: #b45309; font-weight: 800; font-family: monospace; font-size: 10px; padding: 2px 6px; border-radius: 4px; border: 1px solid #fde68a;';
        }
      }

      return `
        <tr>
          <td style="text-align: center; font-weight: bold; color: #64748b;">${index + 1}</td>
          <td>
            <div style="font-weight: 800; color: #0f172a; font-size: 12px;">${w.nama}</div>
            <div style="font-size: 10px; color: #64748b; font-family: monospace; margin-top: 2px;">WA: ${w.noWa || '-'}</div>
          </td>
          <td style="text-align: center; font-weight: 700; color: #0284c7; font-size: 12px;">Blok ${w.blok} No. ${w.noRumah}</td>
          <td>
            <div style="font-size: 11px; font-family: monospace; letter-spacing: 0.5px;"><strong>NIK:</strong> ${w.noKtp || '-'}</div>
            <div style="font-size: 11px; font-family: monospace; color: #64748b; letter-spacing: 0.5px; margin-top: 1px;"><strong>KK :</strong> ${w.noKk || '-'}</div>
          </td>
          <td style="font-size: 11px; font-weight: 500; color: #334155; max-width: 280px; word-wrap: break-word;">
            ${w.alamatKtpAsal || '<span style="color: #94a3b8; font-style: italic;">Belum diisi</span>'}
          </td>
          <td style="text-align: center;">
            <span style="${statusStyle}">${statusLabel}</span>
          </td>
        </tr>
      `;
    }).join('');

    printDoc.write(`
      <html>
        <head>
          <title>Buku Registry & Data Warga Terupdate - RT 08 Perumtas 3</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Arial, sans-serif;
              color: #1e293b;
              padding: 30px;
              margin: 0;
              background-color: #ffffff;
              font-size: 11px;
              line-height: 1.4;
            }
            .header {
              border-bottom: 3px double #0f172a;
              padding-bottom: 15px;
              margin-bottom: 20px;
              text-align: center;
            }
            .title-major {
              font-size: 20px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 1px;
              margin: 0;
              color: #0f172a;
            }
            .title-sub {
              font-size: 12px;
              color: #475569;
              margin: 5px 0 0 0;
              font-weight: 600;
            }
            .doc-info {
              display: flex;
              justify-content: space-between;
              font-size: 11px;
              color: #64748b;
              margin-bottom: 15px;
              font-weight: 600;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 8px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
              page-break-inside: auto;
            }
            tr {
              page-break-inside: avoid;
              page-break-after: auto;
            }
            th {
              background-color: #f1f5f9;
              color: #0f172a;
              font-weight: 800;
              text-transform: uppercase;
              font-size: 10px;
              border: 1px solid #cbd5e1;
              padding: 8px;
              letter-spacing: 0.5px;
            }
            td {
              border: 1px solid #cbd5e1;
              padding: 8px;
              vertical-align: middle;
            }
            .stats-container {
              display: grid;
              grid-template-cols: repeat(4, 1fr);
              gap: 15px;
              margin-top: 25px;
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .stats-card {
              border: 1px solid #e2e8f0;
              padding: 10px 15px;
              border-radius: 8px;
              background-color: #f8fafc;
            }
            .stats-label {
              font-size: 9px;
              font-weight: bold;
              text-transform: uppercase;
              color: #64748b;
            }
            .stats-value {
              font-size: 16px;
              font-weight: 800;
              color: #0f172a;
              margin-top: 2px;
            }
            .signatures {
              margin-top: 40px;
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 40px;
              text-align: center;
              font-weight: bold;
              page-break-inside: avoid;
            }
            .sig-space {
              height: 70px;
            }
            .no-print {
              background: #f1f5f9;
              padding: 12px 20px;
              display: flex;
              justify-content: flex-end;
              margin-bottom: 20px;
              border-radius: 8px;
            }
            .btn-print {
              background-color: #0284c7;
              color: white;
              border: none;
              padding: 8px 16px;
              font-weight: bold;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
            }
            .btn-print:hover {
              background-color: #0369a1;
            }
            @media print {
              * {
                visibility: visible !important;
              }
              .no-print, .no-print * {
                display: none !important;
                visibility: hidden !important;
              }
              body {
                padding: 10px;
              }
            }
          </style>
        </head>
        <body>
          <div class="no-print">
            <button class="btn-print" onclick="window.print()">Cetak Laporan / Simpan PDF</button>
          </div>
          <div class="header">
            <h1 class="title-major">${rtTitle}</h1>
            <div class="title-sub">${rtAddress}</div>
          </div>

          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="margin: 0; text-transform: uppercase; font-size: 14px; letter-spacing: 0.5px; color: #0284c7;">Laporan Register Data Kependudukan Warga Terupdate</h2>
            <div style="font-size: 10px; color: #475569; font-weight: 500; margin-top: 3px;">
              Dokumen resmi rekapitulasi data Kartu Keluarga, NIK, dan asal domisili warga RT 08
            </div>
          </div>

          <div class="doc-info">
            <div>Dibuat Secara Digital: Sistem Layanan RT 08</div>
            <div>Tanggal Cetak: ${new Date().toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}</div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">No</th>
                <th style="width: 25%">Nama Kepala Keluarga / WA</th>
                <th style="width: 15%">Alamat Rumah</th>
                <th style="width: 20%">Data Identitas (NIK & KK)</th>
                <th style="width: 23%">Alamat Lengkap Asal (Sesuai KTP)</th>
                <th style="width: 12%">Status KTP</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>

          <div class="stats-container">
            <div class="stats-card">
              <div class="stats-label">Total Warga</div>
              <div class="stats-value">${totalCount} KK</div>
            </div>
            <div class="stats-card" style="border-left: 4px solid #10b981;">
              <div class="stats-label">KTP Lokal Sidoarjo</div>
              <div class="stats-value" style="color: #059669;">${localCount} KK</div>
            </div>
            <div class="stats-card" style="border-left: 4px solid #f59e0b;">
              <div class="stats-label">KTP Luar Daerah</div>
              <div class="stats-value" style="color: #d97706;">${foreignCount} KK</div>
            </div>
            <div class="stats-card" style="border-left: 4px solid #94a3b8;">
              <div class="stats-label">Belum Lengkap</div>
              <div class="stats-value" style="color: #64748b;">${unassignedCount} KK</div>
            </div>
          </div>

          <table style="width: 100%; border-collapse: collapse; border: none; margin-top: 40px; page-break-inside: avoid;">
            <tr>
              <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <div style="font-weight: bold; font-family: sans-serif; font-size: 11px; margin-bottom: 2px;">Mengetahui,</div>
                <div style="text-transform: uppercase; font-weight: bold; font-family: sans-serif; font-size: 11px;">Sekretaris ${rtNum}</div>
                <div style="height: 55px;"></div>
                <div style="text-decoration: underline; font-weight: bold; font-family: sans-serif; font-size: 12px;">${sekretarisUser ? cleanSignatureName(sekretarisUser.nama) : '..........................................'}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-family: sans-serif;">Arsip Administrasi RT</div>
              </td>
              <td style="width: 50%; border: none; text-align: center; vertical-align: top; padding: 10px;">
                <div style="font-weight: bold; font-family: sans-serif; font-size: 11px; margin-bottom: 2px;">Mengesahkan,</div>
                <div style="text-transform: uppercase; font-weight: bold; font-family: sans-serif; font-size: 11px;">Ketua ${rtNum} ${villageName}</div>
                <div style="height: 55px;"></div>
                <div style="text-decoration: underline; font-weight: bold; font-family: sans-serif; font-size: 12px;">${adminUser ? cleanSignatureName(adminUser.nama) : '..........................................'}</div>
                <div style="font-size: 10px; color: #64748b; margin-top: 3px; font-weight: 800; font-family: sans-serif;">${adminUser ? 'Bpk. ' + cleanSignatureName(adminUser.nama) : 'Bpk. Ketua RT'}</div>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `);
    printDoc.close();
  };

  const addFamilyMemberToList = () => {
    if (!tempMember.nama.trim()) return;
    const item = {
      id: `member-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      nama: tempMember.nama.trim(),
      hubungan: tempMember.hubungan,
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

  // Warga operations
  const handleAddWarga = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWarga.nama || !newWarga.noRumah) return;

    const months = fullMonths;
    const monthsOrder = fullMonths.map(m => m.toLowerCase());
    const iuranRT: any[] = [];
    
    yearsList.forEach(yr => {
      months.forEach(m => {
        let isLunas = false;
        let tglBayar: string | undefined = undefined;
        let jmBayar: string | undefined = undefined;
        let setNominal = getDefaultRtRate(yr, m, rateRT);
        
        if (newWarga.isWargaBaru) {
          const isBeforeYear = yr < newWarga.mulaiTahun;
          const isSameYearBeforeMonth = (yr === newWarga.mulaiTahun) && 
            (monthsOrder.indexOf(m.toLowerCase()) < monthsOrder.indexOf(newWarga.mulaiBulan.toLowerCase()));
            
          if (isBeforeYear || isSameYearBeforeMonth) {
            isLunas = true;
            tglBayar = 'Bebas (Warga Baru)';
            jmBayar = 'Sistem';
            setNominal = 0;
          }
        }
        
        iuranRT.push({
          bulan: m,
          lunas: isLunas,
          nominal: setNominal,
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
      statusRumah: newWarga.statusRumah,
      tglAwalSewa: newWarga.statusRumah === 'sewa_kontrak' ? newWarga.tglAwalSewa : undefined,
      tglAkhirSewa: newWarga.statusRumah === 'sewa_kontrak' ? newWarga.tglAkhirSewa : undefined,
      isWargaBaru: newWarga.isWargaBaru,
      mulaiBulan: newWarga.isWargaBaru ? newWarga.mulaiBulan : undefined,
      mulaiTahun: newWarga.isWargaBaru ? newWarga.mulaiTahun : undefined,
      iuranRT: iuranRT,
      anggotaKeluarga: newWarga.anggotaKeluarga || [],
    };

    updateWargaList([...wargaList, created]);
    setShowAddModal(false);
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
      statusRumah: 'milik_sendiri',
      tglAwalSewa: '',
      tglAkhirSewa: '',
      isWargaBaru: false,
      mulaiBulan: 'Maret',
      mulaiTahun: selectedBillingYear || 2026,
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
          statusRumah: editingWarga.statusRumah,
          tglAwalSewa: editingWarga.statusRumah === 'sewa_kontrak' ? editingWarga.tglAwalSewa : undefined,
          tglAkhirSewa: editingWarga.statusRumah === 'sewa_kontrak' ? editingWarga.tglAkhirSewa : undefined,
          isWargaBaru: editingWarga.isWargaBaru,
          mulaiBulan: editingWarga.isWargaBaru ? editingWarga.mulaiBulan : undefined,
          mulaiTahun: editingWarga.isWargaBaru ? editingWarga.mulaiTahun : undefined,
          anggotaKeluarga: editingWarga.anggotaKeluarga || [],
        };
      }
      return w;
    });

    updateWargaList(updated);
    setEditingWarga(null);

    // Log edit to ledger
    addLedgerEntry({
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: `Modifikasi Data Warga: ${editingWarga.nama} (Blok ${editingWarga.blok}-${editingWarga.noRumah})`,
      jumlah: 0,
      tipe: 'pemasukan',
      sumberKas: 'rtPettyCash',
      kategori: 'Administrasi Warga',
      petugas: currentUser?.nama.split(' ')[0] || 'Admin'
    });
  };

  const handleDeleteWarga = (id: string, nama: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    const w = wargaList.find(x => x.id === id);
    if (w && w.statusKeaktifan && w.statusKeaktifan !== 'aktif') {
      setDeleteChoiceWarga('aktif');
    } else {
      setDeleteChoiceWarga('nonaktif');
    }
    setWargaToDelete({ id, nama });
  };

  const handleReactivateWarga = (id: string, nama: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    updateWargaList(wargaList.map(w => w.id === id ? { ...w, statusKeaktifan: 'aktif' as any } : w));
    setSelectedWargaHistory(prev => prev && prev.id === id ? { ...prev, statusKeaktifan: 'aktif' as any } : prev);
    alert(`Warga "${nama}" berhasil diaktifkan kembali!`);
  };

  // Rombong operations
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
      iuranRombong: months.map(m => ({ bulan: m, lunas: false, nominal: getDefaultRombongRate(new Date().getFullYear(), m, rateRombong) })),
    };

    updateRombongList([...rombongList, created]);
    setShowAddRombongModal(false);
    setNewRombong({ namaPemilik: '', lokasi: '', noLapak: '', noWa: '' });

    // Log addition to ledger
    addLedgerEntry({
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: `Pendaftaran Rombong Baru: ${created.namaPemilik} (${created.noLapak})`,
      jumlah: 0,
      tipe: 'pemasukan',
      sumberKas: 'rombongTunai',
      kategori: 'Administrasi Rombong',
      petugas: currentUser?.nama.split(' ')[0] || 'Admin'
    });
  };

  const handleEditRombongSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRombong) return;

    const updated = rombongList.map(r => {
      if (r.id === editingRombong.id) {
        return {
          ...r,
          namaPemilik: editingRombong.namaPemilik,
          lokasi: editingRombong.lokasi,
          noLapak: editingRombong.noLapak,
          noWa: editingRombong.noWa?.trim()
        };
      }
      return r;
    });

    updateRombongList(updated);
    setEditingRombong(null);

    // Log edit to ledger
    addLedgerEntry({
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: `Modifikasi Data Rombong: ${editingRombong.namaPemilik} (${editingRombong.noLapak})`,
      jumlah: 0,
      tipe: 'pemasukan',
      sumberKas: 'rombongTunai',
      kategori: 'Administrasi Rombong',
      petugas: currentUser?.nama.split(' ')[0] || 'Admin'
    });
  };

  const handleDeleteRombong = (id: string, nama: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    const r = rombongList.find(x => x.id === id);
    if (r && r.statusKeaktifan && r.statusKeaktifan !== 'aktif') {
      setDeleteChoiceRombong('aktif');
    } else {
      setDeleteChoiceRombong('nonaktif');
    }
    setRombongToDelete({ id, nama });
  };

  const handleReactivateRombong = (id: string, nama: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    updateRombongList(rombongList.map(r => r.id === id ? { ...r, statusKeaktifan: 'aktif' as any } : r));
    setSelectedRombongHistory(prev => prev && prev.id === id ? { ...prev, statusKeaktifan: 'aktif' as any } : prev);
    alert(`Lapak Rombong "${nama}" berhasil diaktifkan kembali!`);
  };

  // Payment triggers with year compatibility
  const openPaymentModal = (
    warga: WargaBill, 
    category: 'Iuran RT', 
    bulan: string, 
    nominal: number,
    billingType: 'iuranRT',
    tahun: number = 2026
  ) => {
    if (!isLoggedIn) {
      alert('Anda harus masuk/login sebagai Admin terlebih dahulu untuk mencatat pembayaran.');
      return;
    }
    setPaymentTargetKas('rtTunai');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setPaymentTime(`${hh}:${mm}`);
    setPaymentReceiptBase64('');
    setPaymentReceiptNamaFile('');
    setPayingInfo({ warga, category, bulan, nominal, billingType, tahun });
  };

  const openRombongPaymentModal = (
    rombong: RombongBill, 
    category: 'Iuran Rombong', 
    bulan: string, 
    nominal: number, 
    billingType: 'iuranRombong',
    tahun: number = 2026
  ) => {
    if (!isLoggedIn) {
      alert('Anda harus masuk/login sebagai Admin terlebih dahulu untuk mencatat pembayaran Rombong.');
      return;
    }
    setPaymentTargetKas('rombongTunai');
    setPaymentDate(new Date().toISOString().split('T')[0]);
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    setPaymentTime(`${hh}:${mm}`);
    setPaymentReceiptBase64('');
    setPaymentReceiptNamaFile('');
    
    // Initialize custom rombong settings
    setCustomRombongPayNominal(nominal);
    setIsRombongCustomActive(false);
    setAdminApprovalPin('');
    
    setPayingRombongInfo({ rombong, category, bulan, nominal, billingType, tahun });
  };

  const processPayment = () => {
    if (!payingInfo) return;

    const { warga, category, bulan, nominal, billingType, tahun } = payingInfo;

    const updatedWargaList = wargaList.map(w => {
      if (w.id === warga.id) {
        const index = w[billingType].findIndex(b => b.bulan.toLowerCase() === bulan.toLowerCase() && (b.tahun === tahun || (!b.tahun && tahun === 2026)));
        let updatedBillings = [...w[billingType]];
        if (index > -1) {
          updatedBillings = updatedBillings.map(b => {
             if (b.bulan.toLowerCase() === bulan.toLowerCase() && (b.tahun === tahun || (!b.tahun && tahun === 2026))) {
              return { 
                ...b, 
                lunas: true, 
                tanggalBayar: paymentDate, 
                jamBayar: paymentTime,
                fotoBase64: paymentReceiptBase64 || undefined,
                fotoNamaFile: paymentReceiptNamaFile || undefined
              };
            }
            return b;
          });
        } else {
          updatedBillings.push({
            bulan: bulan,
            lunas: true,
            nominal: nominal,
            tahun: tahun,
            tanggalBayar: paymentDate,
            jamBayar: paymentTime,
            fotoBase64: paymentReceiptBase64 || undefined,
            fotoNamaFile: paymentReceiptNamaFile || undefined
          });
        }
        const updatedWarga = { ...w, [billingType]: updatedBillings };
        // Sync our open calendar bookkeeping modal instantly
        if (selectedWargaHistory && selectedWargaHistory.id === warga.id) {
          setSelectedWargaHistory(updatedWarga);
        }
        return updatedWarga;
      }
      return w;
    });

    updateWargaList(updatedWargaList);

    const nextKas = { ...kas };
    nextKas[paymentTargetKas] += nominal;
    updateKas(nextKas);

    addLedgerEntry({
      tanggal: paymentDate,
      deskripsi: `${category} Bulan ${bulan} ${tahun} - ${warga.nama} (Blok ${warga.blok}-${warga.noRumah})`,
      jumlah: nominal,
      tipe: 'pemasukan',
      sumberKas: paymentTargetKas,
      kategori: category,
      petugas: currentUser?.nama || 'Petugas RT',
      fotoBase64: paymentReceiptBase64 || undefined,
      fotoNamaFile: paymentReceiptNamaFile || undefined
    });

    setReceiptSuccessInfo({
      id: warga.id,
      nama: warga.nama,
      tipe: 'warga',
      blok: warga.blok,
      noRumah: warga.noRumah,
      noWa: warga.noWa || '',
      category,
      bulan,
      tahun,
      nominal,
      tanggalBayar: paymentDate,
      jamBayar: paymentTime,
      kasPenerima: paymentTargetKas,
      petugas: currentUser?.nama || 'Petugas RT',
      catatan: paymentReceiptNamaFile ? `Gambar struk: ${paymentReceiptNamaFile}` : ''
    });

    setPayingInfo(null);
  };

  const processRombongPayment = () => {
    if (!payingRombongInfo) return;

    const { rombong, category, bulan, nominal, billingType, tahun } = payingRombongInfo;

    const finalNominal = isRombongCustomActive ? customRombongPayNominal : nominal;
    const isCustom = isRombongCustomActive && finalNominal !== nominal;

    if (isCustom) {
      if (!isKolektor2) {
        alert('Proses Ditolak: Nominal custom untuk Sewa Rombong hanya bisa dicatatkan oleh petugas Kolektor Rombong (kolektor2)!');
        return;
      }
      if (finalNominal <= 0) {
        alert('Proses Ditolak: Nominal custom harus lebih besar dari Rp 0!');
        return;
      }
      const macet = isRombongMacet(rombong, tahun, bulan);
      if (macet) {
        // Needs admin approval
        if (currentUser?.role !== 'admin') {
          if (!adminApprovalPin) {
            alert('Proses Ditolak: Rombong ini memiliki catatan sewa yang macet/tertunggak. Kustomisasi nominal membutuhkan persetujuan Admin (PIN)!');
            return;
          }
          const validAdmin = usersList.find(u => u.role === 'admin' && u.pin === adminApprovalPin);
          if (!validAdmin) {
            alert('Otorisasi Gagal: PIN Admin yang dimasukkan salah!');
            return;
          }
        }
      }
    }

    const updatedRombongList = rombongList.map(r => {
      if (r.id === rombong.id) {
        const index = r[billingType].findIndex(b => b.bulan.toLowerCase() === bulan.toLowerCase() && (b.tahun === tahun || (!b.tahun && tahun === 2026)));
        let updatedBillings = [...r[billingType]];
        if (index > -1) {
          updatedBillings = updatedBillings.map(b => {
            if (b.bulan.toLowerCase() === bulan.toLowerCase() && (b.tahun === tahun || (!b.tahun && tahun === 2026))) {
              return { 
                ...b, 
                lunas: true, 
                nominal: finalNominal,
                tanggalBayar: paymentDate, 
                jamBayar: paymentTime,
                fotoBase64: paymentReceiptBase64 || undefined,
                fotoNamaFile: paymentReceiptNamaFile || undefined,
                isCustom: isCustom,
                approved: !isCustom
              };
            }
            return b;
          });
        } else {
          updatedBillings.push({
            bulan: bulan,
            lunas: true,
            nominal: finalNominal,
            tahun: tahun,
            tanggalBayar: paymentDate,
            jamBayar: paymentTime,
            fotoBase64: paymentReceiptBase64 || undefined,
            fotoNamaFile: paymentReceiptNamaFile || undefined,
            isCustom: isCustom,
            approved: !isCustom
          });
        }
        const updatedRombong = { ...r, [billingType]: updatedBillings };
        // Sync our open calendar bookkeeping modal instantly
        if (selectedRombongHistory && selectedRombongHistory.id === rombong.id) {
          setSelectedRombongHistory(updatedRombong);
        }
        return updatedRombong;
      }
      return r;
    });

    updateRombongList(updatedRombongList);

    if (!isCustom) {
      const nextKas = { ...kas };
      nextKas[paymentTargetKas] += finalNominal;
      updateKas(nextKas);
    }

    addLedgerEntry({
      tanggal: paymentDate,
      deskripsi: `${category} Bulan ${bulan} ${tahun} - ${rombong.namaPemilik} (${rombong.noLapak})`,
      jumlah: finalNominal,
      tipe: 'pemasukan',
      sumberKas: paymentTargetKas,
      kategori: 'Pendapatan Rombong',
      petugas: currentUser?.nama || 'Petugas RT',
      fotoBase64: paymentReceiptBase64 || undefined,
      fotoNamaFile: paymentReceiptNamaFile || undefined,
      isCustomRombong: isCustom,
      approvedByAdmin: !isCustom,
      needApproval: isCustom,
      rombongId: rombong.id,
      bulan: bulan,
      tahun: tahun
    });

    setReceiptSuccessInfo({
      id: rombong.id,
      nama: rombong.namaPemilik,
      tipe: 'rombong',
      noLapak: rombong.noLapak,
      noWa: rombong.noWa || '',
      category,
      bulan,
      tahun,
      nominal: finalNominal,
      tanggalBayar: paymentDate,
      jamBayar: paymentTime,
      kasPenerima: paymentTargetKas,
      petugas: currentUser?.nama || 'Petugas RT',
      catatan: paymentReceiptNamaFile ? `Gambar struk: ${paymentReceiptNamaFile}` : ''
    });

    // Reset custom/approval states
    setAdminApprovalPin('');
    setIsRombongCustomActive(false);

    setPayingRombongInfo(null);
  };

  // Correction Triggers & Actions
  const openCorrectionModal = (
    warga: WargaBill,
    category: 'Iuran RT',
    bulan: string,
    nominal: number,
    billingType: 'iuranRT',
    tahun: number
  ) => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya pihak Pengurus (Admin) dengan otorisasi khusus yang dapat melakukan koreksi data.');
      return;
    }

    const slot = warga.iuranRT.find(b => 
      b.bulan.toLowerCase() === bulan.toLowerCase() && 
      (b.tahun === tahun || (!b.tahun && tahun === 2026))
    );
    const existingDate = slot?.tanggalBayar || new Date().toISOString().split('T')[0];
    const existingTime = slot?.jamBayar || (() => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    })();
    setCorrPaymentDate(existingDate);
    setCorrPaymentTime(existingTime);

    setCorrectionWargaInfo({ warga, billingType, bulan, nominal, tahun });
    setCorrStatusLunas(slot ? slot.lunas : true);
    setCorrNominal(nominal);
    setCorrTahun(tahun);
    setCorrTransferTargetWargaId('');
    setCorrTargetKas('rtTunai');
    setCorrNoCashFlow(slot ? (slot.noCashFlow || false) : true);
    setCorrCatatan(slot?.catatan || '');
  };

  const openRombongCorrectionModal = (
    rombong: RombongBill,
    category: 'Iuran Rombong',
    bulan: string,
    nominal: number,
    billingType: 'iuranRombong',
    tahun: number
  ) => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya pihak Pengurus (Admin) dengan otorisasi khusus yang dapat melakukan koreksi data.');
      return;
    }

    const slot = rombong.iuranRombong.find(b => 
      b.bulan.toLowerCase() === bulan.toLowerCase() && 
      (b.tahun === tahun || (!b.tahun && tahun === 2026))
    );
    const existingDate = slot?.tanggalBayar || new Date().toISOString().split('T')[0];
    const existingTime = slot?.jamBayar || (() => {
      const now = new Date();
      return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    })();
    setCorrPaymentDate(existingDate);
    setCorrPaymentTime(existingTime);

    setCorrectionRombongInfo({ rombong, billingType, bulan, nominal, tahun });
    setCorrRombongStatusLunas(slot ? slot.lunas : true);
    setCorrRombongNominal(nominal);
    setCorrRombongTahun(tahun);
    setCorrTransferTargetRombongId('');
    setCorrRombongTargetKas('rombongTunai');
    setCorrRombongNoCashFlow(slot ? (slot.noCashFlow || false) : true);
    setCorrRombongCatatan(slot?.catatan || '');
  };

  const saveCorrection = () => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya pihak Pengurus (Admin) dengan otorisasi khusus yang dapat memodifikasi data koreksi.');
      return;
    }
    if (!correctionWargaInfo) return;

    const { warga, billingType, bulan, nominal: initialNominal, tahun: initialTahun } = correctionWargaInfo;

    // 1. Correct "Wrong Ticked Warga" by moving payment to another person
    if (corrTransferTargetWargaId) {
      const targetWarga = wargaList.find(w => w.id === corrTransferTargetWargaId);
      if (!targetWarga) return;

      const updatedWargaList = wargaList.map(w => {
        // Revert source citizen billing slot
        if (w.id === warga.id) {
          const updatedBillings = w[billingType].map(b => {
            const isMatch = b.bulan.toLowerCase() === bulan.toLowerCase() && 
                            (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026));
            if (isMatch) {
              return { ...b, lunas: false, tanggalBayar: undefined, jamBayar: undefined, catatan: undefined, manualKoreksi: true };
            }
            return b;
          });
          const updated = { ...w, [billingType]: updatedBillings };
          if (selectedWargaHistory && selectedWargaHistory.id === warga.id) {
            setSelectedWargaHistory(updated);
          }
          return updated;
        }

        // Apply to target citizen billing slot
        if (w.id === corrTransferTargetWargaId) {
          const index = w[billingType].findIndex(b => 
            b.bulan.toLowerCase() === bulan.toLowerCase() && 
            (b.tahun === corrTahun || (!b.tahun && corrTahun === 2026))
          );
          let updatedBillings = [...w[billingType]];
          if (index > -1) {
            updatedBillings = updatedBillings.map(b => {
              if (b.bulan.toLowerCase() === bulan.toLowerCase() && (b.tahun === corrTahun || (!b.tahun && corrTahun === 2026))) {
                return { ...b, lunas: true, nominal: corrNominal, tanggalBayar: corrPaymentDate, jamBayar: corrPaymentTime, catatan: corrCatatan, manualKoreksi: true };
              }
              return b;
            });
          } else {
            updatedBillings.push({
              bulan: bulan,
              lunas: true,
              nominal: corrNominal,
              tahun: corrTahun,
              tanggalBayar: corrPaymentDate,
              jamBayar: corrPaymentTime,
              catatan: corrCatatan,
              manualKoreksi: true
            });
          }
          return { ...w, [billingType]: updatedBillings };
        }

        return w;
      });

      updateWargaList(updatedWargaList);

      addLedgerEntry({
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: `Koreksi Transfer Iuran RT Bulan ${bulan} ${corrTahun}: Dari ${warga.nama} ke ${targetWarga.nama} (Blok ${targetWarga.blok}-${targetWarga.noRumah})`,
        jumlah: corrNominal - initialNominal,
        tipe: 'pemasukan',
        sumberKas: corrTargetKas,
        kategori: 'Koreksi Data',
        petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
      });

      if (corrNominal !== initialNominal) {
        const nextKas = { ...kas };
        nextKas[corrTargetKas] += (corrNominal - initialNominal);
        updateKas(nextKas);
      }

      alert(`Sukses: Pencatatan iuran berhasil dipindahkan ke ${targetWarga.nama} (Blok ${targetWarga.blok}-${targetWarga.noRumah}).`);
      setCorrectionWargaInfo(null);
      return;
    }

    // 2. Adjusting status, year/period, or nominal for the same citizen
    const slot = warga.iuranRT.find(b => 
      b.bulan.toLowerCase() === bulan.toLowerCase() && 
      (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026))
    );
    const originallyNoCashFlow = slot?.noCashFlow || false;
    const isNoCashFlowNow = corrNoCashFlow || originallyNoCashFlow;

    const updatedWargaList = wargaList.map(w => {
      if (w.id === warga.id) {
        const index = w[billingType].findIndex(b => 
          b.bulan.toLowerCase() === bulan.toLowerCase() && 
          (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026))
        );
        let updatedBillings = [...w[billingType]];
        
        if (corrStatusLunas) {
          if (index > -1) {
            updatedBillings = updatedBillings.map(b => {
              const isMatch = b.bulan.toLowerCase() === bulan.toLowerCase() && 
                              (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026));
              if (isMatch) {
                return { ...b, lunas: true, nominal: corrNominal, tahun: corrTahun, tanggalBayar: corrPaymentDate, jamBayar: corrPaymentTime, noCashFlow: corrNoCashFlow, catatan: corrCatatan, manualKoreksi: true };
              }
              return b;
            });
          } else {
            updatedBillings.push({
              bulan: bulan,
              lunas: true,
              nominal: corrNominal,
              tahun: corrTahun,
              tanggalBayar: corrPaymentDate,
              jamBayar: corrPaymentTime,
              noCashFlow: corrNoCashFlow,
              catatan: corrCatatan,
              manualKoreksi: true
            });
          }
        } else {
          // Unmark / change to unpaid
          if (index > -1) {
            updatedBillings = updatedBillings.map(b => {
              const isMatch = b.bulan.toLowerCase() === bulan.toLowerCase() && 
                              (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026));
              if (isMatch) {
                return { ...b, lunas: false, tanggalBayar: undefined, jamBayar: undefined, noCashFlow: corrNoCashFlow, catatan: corrCatatan, manualKoreksi: true };
              }
              return b;
            });
          } else {
            updatedBillings.push({
              bulan: bulan,
              lunas: false,
              nominal: corrNominal,
              tahun: corrTahun,
              noCashFlow: corrNoCashFlow,
              catatan: corrCatatan,
              manualKoreksi: true
            });
          }
        }

        const updated = { ...w, [billingType]: updatedBillings };
        if (selectedWargaHistory && selectedWargaHistory.id === warga.id) {
          setSelectedWargaHistory(updated);
        }
        return updated;
      }
      return w;
    });

    updateWargaList(updatedWargaList);

    if (isNoCashFlowNow) {
      addLedgerEntry({
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: `[Koreksi Administratif] Iuran RT Bulan ${bulan} ${corrTahun} - Warga ${warga.nama} ditandai ${corrStatusLunas ? 'Lunas' : 'Belum Lunas'} (Tanpa Aliran Kas)${corrCatatan ? ` | Catatan: ${corrCatatan}` : ''}`,
        jumlah: 0,
        tipe: 'pemasukan',
        sumberKas: corrTargetKas,
        kategori: 'Koreksi Data',
        petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
      });
    } else {
      if (!corrStatusLunas) {
        // Revert initial nominal
        const nextKas = { ...kas };
        nextKas[corrTargetKas] -= initialNominal;
        updateKas(nextKas);

        addLedgerEntry({
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: `Koreksi Batalkan Iuran RT Bulan ${bulan} ${initialTahun} - Warga ${warga.nama}${corrCatatan ? ` | Catatan: ${corrCatatan}` : ''}`,
          jumlah: -initialNominal,
          tipe: 'pengeluaran',
          sumberKas: corrTargetKas,
          kategori: 'Koreksi Data',
          petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
        });
      } else {
        // Adjustment Difference
        const diff = corrNominal - initialNominal;
        if (diff !== 0 || corrTahun !== initialTahun) {
          const nextKas = { ...kas };
          nextKas[corrTargetKas] += diff;
          updateKas(nextKas);

          addLedgerEntry({
            tanggal: new Date().toISOString().split('T')[0],
            deskripsi: `Koreksi Edit Iuran RT Bulan ${bulan} ${corrTahun} - Warga ${warga.nama} (Penyesuaian Data)${corrCatatan ? ` | Catatan: ${corrCatatan}` : ''}`,
            jumlah: diff,
            tipe: 'pemasukan',
            sumberKas: corrTargetKas,
            kategori: 'Koreksi Data',
            petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
          });
        }
      }
    }

    alert('Koreksi data iuran berhasil disimpan.');
    setCorrectionWargaInfo(null);
  };

  const handleSaveBatchCorrection = () => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya pihak Pengurus (Admin) dengan otorisasi khusus yang dapat melakukan koreksi massal.');
      return;
    }
    if (!selectedWargaHistory) return;

    const warga = selectedWargaHistory;
    const billingType = 'iuranRT';
    const monthsOrder = fullMonths.map(m => m.toLowerCase());

    const updatedWargaList = wargaList.map(w => {
      if (w.id === warga.id) {
        let updatedBillings = [...w[billingType]];

        const startMonthIndex = w.mulaiBulan ? monthsOrder.indexOf(w.mulaiBulan.toLowerCase()) : -1;
        const startYear = w.mulaiTahun || 2026;

        const isBeforePlacement = (yr: number, mName: string) => {
          if (!w.isWargaBaru) return false;
          if (yr < startYear) return true;
          if (yr > startYear) return false;
          const mIdx = monthsOrder.indexOf(mName.toLowerCase());
          return mIdx < startMonthIndex;
        };

        fullMonths.forEach(m => {
          const shortM = m.slice(0, 3);
          const isTargetLunas = batchMonthsPaidStatus[m];
          const beforePlacement = isBeforePlacement(historyYear, m);
          
          const index = updatedBillings.findIndex(b => 
            (b.tahun === historyYear || (!b.tahun && historyYear === 2026)) &&
            (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
          );

          if (index > -1) {
            if (beforePlacement) {
              updatedBillings[index] = {
                ...updatedBillings[index],
                lunas: true,
                nominal: 0,
                tanggalBayar: 'Sistem',
                jamBayar: undefined,
                catatan: 'Bebas (Warga Baru)',
                manualKoreksi: true
              };
            } else {
              updatedBillings[index] = {
                ...updatedBillings[index],
                lunas: isTargetLunas,
                nominal: updatedBillings[index].nominal === 0 ? getDefaultRtRate(historyYear, m, rateRT) : updatedBillings[index].nominal,
                tanggalBayar: isTargetLunas ? (updatedBillings[index].tanggalBayar || new Date().toISOString().split('T')[0]) : undefined,
                jamBayar: isTargetLunas ? (updatedBillings[index].jamBayar || '12:00') : undefined,
                catatan: isTargetLunas ? (updatedBillings[index].catatan || 'Koreksi Massal') : undefined,
                manualKoreksi: true
              };
            }
          } else {
            if (beforePlacement) {
              updatedBillings.push({
                bulan: m,
                lunas: true,
                nominal: 0,
                tahun: historyYear,
                tanggalBayar: 'Sistem',
                jamBayar: undefined,
                catatan: 'Bebas (Warga Baru)',
                manualKoreksi: true
              });
            } else {
              updatedBillings.push({
                bulan: m,
                lunas: isTargetLunas,
                nominal: getDefaultRtRate(historyYear, m, rateRT),
                tahun: historyYear,
                tanggalBayar: isTargetLunas ? new Date().toISOString().split('T')[0] : undefined,
                jamBayar: isTargetLunas ? '12:00' : undefined,
                catatan: isTargetLunas ? 'Koreksi Massal' : undefined,
                manualKoreksi: true
              });
            }
          }
        });

        const updatedWarga = { ...w, [billingType]: updatedBillings };
        setSelectedWargaHistory(updatedWarga);
        return updatedWarga;
      }
      return w;
    });

    updateWargaList(updatedWargaList);
    addLedgerEntry({
      tanggal: new Date().toISOString().split('T')[0],
      deskripsi: `Koreksi Massal Iuran RT Thn ${historyYear} - ${warga.nama}`,
      jumlah: 0,
      tipe: 'pemasukan',
      sumberKas: 'rtPettyCash',
      kategori: 'Iuran RT',
      petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
    });

    setIsBatchEdit(false);
    alert('Koreksi status pembayaran massal berhasil disimpan.');
  };

  const saveRombongCorrection = () => {
    if (!isLoggedIn || currentUser?.role !== 'admin') {
      alert('Akses Ditolak: Hanya pihak Pengurus (Admin) dengan otorisasi khusus yang dapat memodifikasi data koreksi.');
      return;
    }
    if (!correctionRombongInfo) return;

    const { rombong, billingType, bulan, nominal: initialNominal, tahun: initialTahun } = correctionRombongInfo;

    // 1. Move to another merchant / stall (correction)
    if (corrTransferTargetRombongId) {
      const targetRombong = rombongList.find(r => r.id === corrTransferTargetRombongId);
      if (!targetRombong) return;

      const updatedRombongList = rombongList.map(r => {
        // Revert source stall
        if (r.id === rombong.id) {
          const updatedBillings = r[billingType].map(b => {
            const isMatch = b.bulan.toLowerCase() === bulan.toLowerCase() && 
                            (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026));
            if (isMatch) {
              return { ...b, lunas: false, tanggalBayar: undefined, jamBayar: undefined, catatan: undefined };
            }
            return b;
          });
          const updated = { ...r, [billingType]: updatedBillings };
          if (selectedRombongHistory && selectedRombongHistory.id === rombong.id) {
            setSelectedRombongHistory(updated);
          }
          return updated;
        }

        // Apply to target stall
        if (r.id === corrTransferTargetRombongId) {
          const index = r[billingType].findIndex(b => 
            b.bulan.toLowerCase() === bulan.toLowerCase() && 
            (b.tahun === corrRombongTahun || (!b.tahun && corrRombongTahun === 2026))
          );
          let updatedBillings = [...r[billingType]];
          if (index > -1) {
            updatedBillings = updatedBillings.map(b => {
              if (b.bulan.toLowerCase() === bulan.toLowerCase() && (b.tahun === corrRombongTahun || (!b.tahun && corrRombongTahun === 2026))) {
                return { ...b, lunas: true, nominal: corrRombongNominal, tanggalBayar: corrPaymentDate, jamBayar: corrPaymentTime, catatan: corrRombongCatatan };
              }
              return b;
            });
          } else {
            updatedBillings.push({
              bulan: bulan,
              lunas: true,
              nominal: corrRombongNominal,
              tahun: corrRombongTahun,
              tanggalBayar: corrPaymentDate,
              jamBayar: corrPaymentTime,
              catatan: corrRombongCatatan
            });
          }
          return { ...r, [billingType]: updatedBillings };
        }

        return r;
      });

      updateRombongList(updatedRombongList);

      addLedgerEntry({
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: `Koreksi Transfer Lapak Rombong Bulan ${bulan} ${corrRombongTahun}: Dari ${rombong.namaPemilik} ke ${targetRombong.namaPemilik}`,
        jumlah: corrRombongNominal - initialNominal,
        tipe: 'pemasukan',
        sumberKas: corrRombongTargetKas,
        kategori: 'Koreksi Data',
        petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
      });

      if (corrRombongNominal !== initialNominal) {
        const nextKas = { ...kas };
        nextKas[corrRombongTargetKas] += (corrRombongNominal - initialNominal);
        updateKas(nextKas);
      }

      alert(`Sukses: Pencatatan sewa/lapak berhasil dipindahkan ke lapak ${targetRombong.namaPemilik} (${targetRombong.noLapak}).`);
      setCorrectionRombongInfo(null);
      return;
    }

    // 2. Adjusting status, periods, or nominals for the same merchant
    const slot = rombong.iuranRombong.find(b => 
      b.bulan.toLowerCase() === bulan.toLowerCase() && 
      (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026))
    );
    const originallyNoCashFlow = slot?.noCashFlow || false;
    const isNoCashFlowNow = corrRombongNoCashFlow || originallyNoCashFlow;

    const updatedRombongList = rombongList.map(r => {
      if (r.id === rombong.id) {
        const index = r[billingType].findIndex(b => 
          b.bulan.toLowerCase() === bulan.toLowerCase() && 
          (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026))
        );
        let updatedBillings = [...r[billingType]];

        if (corrRombongStatusLunas) {
          if (index > -1) {
            updatedBillings = updatedBillings.map(b => {
              const isMatch = b.bulan.toLowerCase() === bulan.toLowerCase() && 
                              (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026));
              if (isMatch) {
                return { ...b, lunas: true, nominal: corrRombongNominal, tahun: corrRombongTahun, tanggalBayar: corrPaymentDate, jamBayar: corrPaymentTime, noCashFlow: corrRombongNoCashFlow, catatan: corrRombongCatatan, manualKoreksi: true };
              }
              return b;
            });
          } else {
            updatedBillings.push({
              bulan: bulan,
              lunas: true,
              nominal: corrRombongNominal,
              tahun: corrRombongTahun,
              tanggalBayar: corrPaymentDate,
              jamBayar: corrPaymentTime,
              noCashFlow: corrRombongNoCashFlow,
              catatan: corrRombongCatatan,
              manualKoreksi: true
            });
          }
        } else {
          if (index > -1) {
            updatedBillings = updatedBillings.map(b => {
              const isMatch = b.bulan.toLowerCase() === bulan.toLowerCase() && 
                              (b.tahun === initialTahun || (!b.tahun && initialTahun === 2026));
              if (isMatch) {
                return { ...b, lunas: false, tanggalBayar: undefined, jamBayar: undefined, noCashFlow: corrRombongNoCashFlow, catatan: corrRombongCatatan, manualKoreksi: true };
              }
              return b;
            });
          } else {
            updatedBillings.push({
              bulan: bulan,
              lunas: false,
              nominal: corrRombongNominal,
              tahun: corrRombongTahun,
              noCashFlow: corrRombongNoCashFlow,
              catatan: corrRombongCatatan,
              manualKoreksi: true
            });
          }
        }

        const updated = { ...r, [billingType]: updatedBillings };
        if (selectedRombongHistory && selectedRombongHistory.id === rombong.id) {
          setSelectedRombongHistory(updated);
        }
        return updated;
      }
      return r;
    });

    updateRombongList(updatedRombongList);

    if (isNoCashFlowNow) {
      addLedgerEntry({
        tanggal: new Date().toISOString().split('T')[0],
        deskripsi: `[Koreksi Administratif] Iuran Rombong Bulan ${bulan} ${corrRombongTahun} - ${rombong.namaPemilik} ditandai ${corrRombongStatusLunas ? 'Lunas' : 'Belum Lunas'} (Tanpa Aliran Kas)${corrRombongCatatan ? ` | Catatan: ${corrRombongCatatan}` : ''}`,
        jumlah: 0,
        tipe: 'pemasukan',
        sumberKas: corrRombongTargetKas,
        kategori: 'Koreksi Data',
        petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
      });
    } else {
      if (!corrRombongStatusLunas) {
        const nextKas = { ...kas };
        nextKas[corrRombongTargetKas] -= initialNominal;
        updateKas(nextKas);

        addLedgerEntry({
          tanggal: new Date().toISOString().split('T')[0],
          deskripsi: `Koreksi Batalkan Sewa Rombong Bulan ${bulan} ${initialTahun} - ${rombong.namaPemilik}${corrRombongCatatan ? ` | Catatan: ${corrRombongCatatan}` : ''}`,
          jumlah: -initialNominal,
          tipe: 'pengeluaran',
          sumberKas: corrRombongTargetKas,
          kategori: 'Koreksi Data',
          petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
        });
      } else {
        const diff = corrRombongNominal - initialNominal;
        if (diff !== 0 || corrRombongTahun !== initialTahun) {
          const nextKas = { ...kas };
          nextKas[corrRombongTargetKas] += diff;
          updateKas(nextKas);

          addLedgerEntry({
            tanggal: new Date().toISOString().split('T')[0],
            deskripsi: `Koreksi Edit Sewa Rombong Bulan ${bulan} ${corrRombongTahun} - ${rombong.namaPemilik} (Penyesuaian Data)${corrRombongCatatan ? ` | Catatan: ${corrRombongCatatan}` : ''}`,
            jumlah: diff,
            tipe: 'pemasukan',
            sumberKas: corrRombongTargetKas,
            kategori: 'Koreksi Data',
            petugas: currentUser?.nama ? cleanSignatureName(currentUser.nama) : getFallbackPetugasName()
          });
        }
      }
    }

    alert('Koreksi data sewa berhasil disimpan.');
    setCorrectionRombongInfo(null);
  };

  // Officer classifications
  const isOfficer = isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara' || currentUser?.role === 'kolektor');
  const isWargaOfficer = isOfficer && !isKolektor2;

  // Helper to count overdue / unpaid months for a citizen up to current date or active system configuration
  const getUnpaidMonthsCountWarga = (w: WargaBill) => {
    if (w.statusKeaktifan && w.statusKeaktifan !== 'aktif') {
      return 0; // frozen / cannot be billed
    }
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonthIndex = now.getMonth(); // 0 = Jan, 11 = Dec
    
    const monthNamesLow = fullMonths.map(m => m.toLowerCase());
    
    return w.iuranRT.filter(b => {
      if (b.lunas) return false;
      
      const bYear = b.tahun || 2026;
      const bMonthIndex = monthNamesLow.indexOf(b.bulan.toLowerCase());
      
      if (bYear < nowYear) return true;
      if (bYear === nowYear) return bMonthIndex <= nowMonthIndex;
      return false;
    }).length;
  };

  const getUnpaidMonthsCountRombong = (r: RombongBill) => {
    if (r.statusKeaktifan && r.statusKeaktifan !== 'aktif') {
      return 0; // frozen / cannot be billed
    }
    const now = new Date();
    const nowYear = now.getFullYear();
    const nowMonthIndex = now.getMonth();
    
    const monthNamesLow = fullMonths.map(m => m.toLowerCase());
    
    return r.iuranRombong.filter(b => {
      if (b.lunas) return false;
      
      const bYear = b.tahun || 2026;
      const bMonthIndex = monthNamesLow.indexOf(b.bulan.toLowerCase());
      
      if (bYear < nowYear) return true;
      if (bYear === nowYear) return bMonthIndex <= nowMonthIndex;
      return false;
    }).length;
  };

  // Filter systems
  let filteredWarga = wargaList.filter(w => !w.isDeleted).filter(w => {
    if (currentUser?.role === 'rombong') {
      return false; // rombong users shouldn't see warga bills
    }
    if (currentUser?.role === 'warga') {
      return w.id === currentUser.wargaId; // only their own bill
    }

    // Keaktifan filter
    const keaktifan = w.statusKeaktifan || 'aktif';
    if (selectedKeaktifan !== 'semua' && keaktifan !== selectedKeaktifan) {
      return false;
    }

    const matchesSearch = w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          `${w.blok}-${w.noRumah}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlock = selectedBlock === 'Semua' || w.blok === selectedBlock;
    
    if (selectedStatus === 'Semua') {
      return matchesSearch && matchesBlock;
    }

    const defaultMonths = fullMonths;
    const hasOutstanding = defaultMonths.some(m => {
      const slot = w.iuranRT.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      return !slot || !slot.lunas;
    });

    if (selectedStatus === 'Lunas') {
      return matchesSearch && matchesBlock && !hasOutstanding;
    } else if (selectedStatus === 'Tunggakan2Bulan') {
      return matchesSearch && matchesBlock && getUnpaidMonthsCountWarga(w) > 2;
    } else {
      return matchesSearch && matchesBlock && hasOutstanding;
    }
  });

  filteredWarga = [...filteredWarga].sort((a, b) => {
    const aInactive = !!(a.statusKeaktifan && a.statusKeaktifan !== 'aktif');
    const bInactive = !!(b.statusKeaktifan && b.statusKeaktifan !== 'aktif');
    if (aInactive && !bInactive) return 1;
    if (!aInactive && bInactive) return -1;
    return 0; // maintain relative order
  });

  let filteredRombong = rombongList.filter(r => !r.isDeleted).filter(r => {
    if (currentUser?.role === 'warga') {
      return false; // warga users shouldn't see rombong bills
    }
    if (currentUser?.role === 'rombong') {
      return r.id === currentUser.rombongId; // only their own lapak bill
    }

    // Keaktifan filter
    const keaktifan = r.statusKeaktifan || 'aktif';
    if (selectedKeaktifan !== 'semua' && keaktifan !== selectedKeaktifan) {
      return false;
    }

    const matchesSearch = r.namaPemilik.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.noLapak.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStatus === 'Semua') {
      return matchesSearch;
    }

    const defaultMonths = fullMonths;
    const hasOutstanding = defaultMonths.some(m => {
      const slot = r.iuranRombong.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      return !slot || !slot.lunas;
    });

    if (selectedStatus === 'Lunas') {
      return matchesSearch && !hasOutstanding;
    } else if (selectedStatus === 'Tunggakan2Bulan') {
      return matchesSearch && getUnpaidMonthsCountRombong(r) > 2;
    } else {
      return matchesSearch && hasOutstanding;
    }
  });

  filteredRombong = [...filteredRombong].sort((a, b) => {
    const aInactive = !!(a.statusKeaktifan && a.statusKeaktifan !== 'aktif');
    const bInactive = !!(b.statusKeaktifan && b.statusKeaktifan !== 'aktif');
    if (aInactive && !bInactive) return 1;
    if (!aInactive && bInactive) return -1;
    return 0; // maintain relative order
  });

  // Report collections (includes soft-deleted citizens/rombongs with payments in the selected billing year)
  const reportWarga = wargaList.filter(w => {
    if (w.statusKeaktifan && w.statusKeaktifan !== 'aktif') {
      return false; // frozen/inactive warga is not in the print report list
    }
    if (w.isDeleted) {
      const hasAnyPaidInYear = w.iuranRT.some(b => 
        b.lunas && (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      if (!hasAnyPaidInYear) return false;
    }

    const matchesSearch = w.nama.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          `${w.blok}-${w.noRumah}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBlock = selectedBlock === 'Semua' || w.blok === selectedBlock;
    
    if (selectedStatus === 'Semua') {
      return matchesSearch && matchesBlock;
    }

    const defaultMonths = fullMonths;
    const hasOutstanding = defaultMonths.some(m => {
      const slot = w.iuranRT.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      return !slot || !slot.lunas;
    });

    if (selectedStatus === 'Lunas') {
      return matchesSearch && matchesBlock && !hasOutstanding;
    } else if (selectedStatus === 'Tunggakan2Bulan') {
      return matchesSearch && matchesBlock && getUnpaidMonthsCountWarga(w) > 2;
    } else {
      return matchesSearch && matchesBlock && hasOutstanding;
    }
  });

  const reportRombong = rombongList.filter(r => {
    if (r.statusKeaktifan && r.statusKeaktifan !== 'aktif') {
      return false; // frozen/inactive rombong is not in the print report list
    }
    if (r.isDeleted) {
      const hasAnyPaidInYear = r.iuranRombong.some(b => 
        b.lunas && (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      if (!hasAnyPaidInYear) return false;
    }

    const matchesSearch = r.namaPemilik.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.noLapak.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          r.lokasi.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (selectedStatus === 'Semua') {
      return matchesSearch;
    }

    const defaultMonths = fullMonths;
    const hasOutstanding = defaultMonths.some(m => {
      const slot = r.iuranRombong.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      return !slot || !slot.lunas;
    });

    if (selectedStatus === 'Lunas') {
      return matchesSearch && !hasOutstanding;
    } else if (selectedStatus === 'Tunggakan2Bulan') {
      return matchesSearch && getUnpaidMonthsCountRombong(r) > 2;
    } else {
      return matchesSearch && hasOutstanding;
    }
  });

  // Analytics calculation
  const totalWargaCount = wargaList.filter(w => !w.isDeleted && (!w.statusKeaktifan || w.statusKeaktifan === 'aktif')).length;
  const totalRombongCount = rombongList.filter(r => !r.isDeleted && (!r.statusKeaktifan || r.statusKeaktifan === 'aktif')).length;

  const outstandingWargaBillsCount = wargaList.filter(w => !w.isDeleted && (!w.statusKeaktifan || w.statusKeaktifan === 'aktif')).reduce((acc, w) => {
    const defaultMonths = fullMonths;
    let count = 0;
    
    defaultMonths.forEach(m => {
      const slot = w.iuranRT.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      if ((!slot || !slot.lunas) && isMonthDue(m, selectedBillingYear)) {
        count++;
      }
    });
    
    const priorYears = yearsList.filter(y => y < selectedBillingYear);
    priorYears.forEach(yr => {
      defaultMonths.forEach(m => {
        const slot = w.iuranRT.find(b => 
          b.bulan.toLowerCase() === m.toLowerCase() && 
          (b.tahun === yr || (!b.tahun && yr === 2026))
        );
        if (!slot || !slot.lunas) {
          count++;
        }
      });
    });
    
    return acc + count;
  }, 0);

  const outstandingRombongBillsCount = rombongList.filter(r => !r.isDeleted && (!r.statusKeaktifan || r.statusKeaktifan === 'aktif')).reduce((acc, r) => {
    const defaultMonths = fullMonths;
    let count = 0;
    
    defaultMonths.forEach(m => {
      const slot = r.iuranRombong.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      if ((!slot || !slot.lunas) && isMonthDue(m, selectedBillingYear)) {
        count++;
      }
    });
    
    const priorYears = yearsList.filter(y => y < selectedBillingYear);
    priorYears.forEach(yr => {
      defaultMonths.forEach(m => {
        const slot = r.iuranRombong.find(b => 
          b.bulan.toLowerCase() === m.toLowerCase() && 
          (b.tahun === yr || (!b.tahun && yr === 2026))
        );
        if (!slot || !slot.lunas) {
          count++;
        }
      });
    });
    
    return acc + count;
  }, 0);

  const copyToClipboard = (text: string, id: string) => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        })
        .catch(() => {
          fallbackCopyText(text, id);
        });
    } else {
      fallbackCopyText(text, id);
    }
  };

  const fallbackCopyText = (text: string, id: string) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Fallback: Oops, unable to copy', err);
    }
    document.body.removeChild(textArea);
  };

  // WhatsApp annual payment history book formatter for citizen
  const getWhatsAppHistoryMessageText = (warga: WargaBill, targetYear: number) => {
    let message = `*BUKU CATATAN TAGIHAN TAHUNAN RT 08 PERUMTAS 3*\n`;
    message += `Tahun Buku: *${targetYear}*\n`;
    message += `Nama Warga: *${warga.nama}*\n`;
    message += `Alamat: *Blok ${warga.blok} No. ${warga.noRumah}*\n\n`;
    message += `*Rincian Status Pembayaran Iuran RT (Jan - Des):*\n`;
    
    fullMonths.forEach((m, idx) => {
      const shortM = m.slice(0, 3);
      const slot = warga.iuranRT.find(b => 
        (b.tahun === targetYear || (!b.tahun && targetYear === 2026)) &&
        (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
      );
      
      if (slot && slot.lunas) {
        const timeStr = slot.tanggalBayar ? ` (Tgl: ${slot.tanggalBayar}${slot.jamBayar ? ` ${slot.jamBayar}` : ''})` : '';
        message += `${idx + 1}. *${m}*: Lunas - Rp ${slot.nominal.toLocaleString('id-ID')}${timeStr} ✓\n`;
      } else {
        message += `${idx + 1}. *${m}*: Belum Bayar (Rp ${rateRT.toLocaleString('id-ID')}) ✗\n`;
      }
    });
    
    const totalPaid = warga.iuranRT
      .filter(b => b.lunas && (b.tahun === targetYear || (!b.tahun && targetYear === 2026)))
      .reduce((sum, b) => sum + b.nominal, 0);
    message += `\n*Total Terbayar: Rp ${totalPaid.toLocaleString('id-ID')}*\n\n`;
    message += `Dicetak otomatis real-time dari Sistem Pembukuan Digital RT 08 Perumtas 3. ✨\n`;
    message += `Keamanan, Kemudahan, dan Keterbukaan RT 08 Perumtas 3. 🙏`;
    return message;
  };

  // WhatsApp annual payment history book formatter for rombong
  const getWhatsAppRombongHistoryMessageText = (rombong: RombongBill, targetYear: number) => {
    let message = `*BUKU CATATAN SEWA LAHAN & ROMBONG RT 08 PERUMTAS 3*\n`;
    message += `Tahun Buku: *${targetYear}*\n`;
    message += `Pemilik Lapak: *${rombong.namaPemilik}*\n`;
    message += `No. Lapak: *${rombong.noLapak} (${rombong.lokasi})*\n\n`;
    message += `*Rincian Status Pembayaran Sewa (Jan - Des):*\n`;
    
    fullMonths.forEach((m, idx) => {
      const shortM = m.slice(0, 3);
      const slot = rombong.iuranRombong.find(b => 
        (b.tahun === targetYear || (!b.tahun && targetYear === 2026)) &&
        (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
      );
      
      if (slot && slot.lunas) {
        const timeStr = slot.tanggalBayar ? ` (Tgl: ${slot.tanggalBayar}${slot.jamBayar ? ` ${slot.jamBayar}` : ''})` : '';
        message += `${idx + 1}. *${m}*: Lunas - Rp ${slot.nominal.toLocaleString('id-ID')}${timeStr} ✓\n`;
      } else {
        message += `${idx + 1}. *${m}*: Belum Bayar (Rp ${rateRombong.toLocaleString('id-ID')}) ✗\n`;
      }
    });
    
    const totalPaid = rombong.iuranRombong
      .filter(b => b.lunas && (b.tahun === targetYear || (!b.tahun && targetYear === 2026)))
      .reduce((sum, b) => sum + b.nominal, 0);
    message += `\n*Total Terbayar: Rp ${totalPaid.toLocaleString('id-ID')}*\n\n`;
    message += `Dicetak otomatis real-time dari Sistem Pembukuan Digital RT 08 Perumtas 3. ✨\n`;
    message += `Terima kasih banyak atas kerjasamanya demi kemajuan lingkungan RT 08. 🙏`;
    return message;
  };

  // WhatsApp helper for warga
  const getWhatsAppMessageText = (warga: WargaBill) => {
    const defaultMonths = fullMonths;
    const unpaidRT: string[] = [];
    defaultMonths.forEach(m => {
      const slot = warga.iuranRT.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      if ((!slot || !slot.lunas) && isMonthDue(m, selectedBillingYear)) {
        unpaidRT.push(m);
      }
    });
    
    const priorArrears = getWargaArrearsBeforeYear(warga, selectedBillingYear);

    const currentYearNum = new Date().getFullYear();
    const currentMonthName = fullMonths[new Date().getMonth()] || '';
    const isSelYearCurrent = selectedBillingYear === currentYearNum;

    const hasUnpaidCurrentMonth = isSelYearCurrent && unpaidRT.includes(currentMonthName);
    const unpaidCurrentMonthName = hasUnpaidCurrentMonth ? currentMonthName : null;
    const unpaidPriorMonths = isSelYearCurrent 
      ? unpaidRT.filter(m => m !== currentMonthName)
      : unpaidRT;

    const displayCurrentMonth = waIncludeCurrent && unpaidCurrentMonthName;
    const displayPriorArrears = waIncludeArrears && (unpaidPriorMonths.length > 0 || priorArrears > 0);

    let message = `*TAGIHAN IURAN BULANAN RT 08 PERUMTAS 3*\n`;
    message += `Kepada Yth. Bapak/Ibu: *${warga.nama}*\n`;
    message += `Alamat: *Blok ${warga.blok} No. ${warga.noRumah}*\n\n`;

    if (!displayCurrentMonth && !displayPriorArrears) {
      const isActuallyLunas = unpaidRT.length === 0 && priorArrears === 0;
      if (isActuallyLunas) {
        message += `Selamat! Saat ini Anda *Bebas Tunggakan* (Lunas seluruh iuran). Terima kasih banyak atas partisipasi aktif Bapak/Ibu! 🎉`;
      } else {
        message += `Saat ini tidak ada rincian tagihan sesuai filter penagihan terpilih yang perlu dikirimkan.`;
      }
    } else {
      message += `Berikut rincian tagihan iuran bulanan Anda:\n`;
      let grandTotalAccumulated = 0;

      if (displayCurrentMonth) {
        const rate = getDefaultRtRate(selectedBillingYear, unpaidCurrentMonthName, rateRT);
        grandTotalAccumulated += rate;
        message += `• *Tagihan Bulan Ini (${unpaidCurrentMonthName} ${selectedBillingYear})*: Rp ${rate.toLocaleString('id-ID')}\n`;
      }

      if (displayPriorArrears) {
        if (unpaidPriorMonths.length > 0) {
          let sub = 0;
          unpaidPriorMonths.forEach(m => {
            sub += getDefaultRtRate(selectedBillingYear, m, rateRT);
          });
          grandTotalAccumulated += sub;
          const firstMonthRate = getDefaultRtRate(selectedBillingYear, unpaidPriorMonths[0], rateRT);
          let monthLabel = `Tunggakan Bulan Sebelumnya`;
          if (!isSelYearCurrent) {
            monthLabel = `Tunggakan Tahun ${selectedBillingYear}`;
          }
          message += `• *${monthLabel}* (${unpaidPriorMonths.join(', ')} @ Rp ${firstMonthRate.toLocaleString('id-ID')}): Rp ${sub.toLocaleString('id-ID')}\n`;
        }

        if (priorArrears > 0) {
          grandTotalAccumulated += priorArrears;
          message += `• *Tunggakan Tahun Sebelumnya*: Rp ${priorArrears.toLocaleString('id-ID')}\n`;
        }
      }

      message += `\n*Total Tagihan: Rp ${grandTotalAccumulated.toLocaleString('id-ID')}*\n\n`;
      message += `Mohon untuk dapat melakukan pembayaran melalui Pengurus RT ${adminNameFormatted} / ${bendaharaNameFormatted}.\n`;
      message += `Terima kasih banyak atas perhatian dan partisipasi Bapak/Ibu demi kenyamanan lingkungan Perumtas 3 RT 08. 🙏`;
    }
    return message;
  };

  const handleOpenWhatsAppLink = (warga: WargaBill) => {
    const rawMsg = getWhatsAppMessageText(warga);
    const cleanedPhone = targetPhone.replace(/\D/g, '');
    let formattedPhone = cleanedPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    const finalUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMsg)}`;
    window.open(finalUrl, '_blank');
    setSelectedWargaForWhatsApp(null);
    setTargetPhone('');
  };

  // WhatsApp helper for rombong
  const getWhatsAppRombongMessageText = (rombong: RombongBill) => {
    const defaultMonths = fullMonths;
    const unpaidRombong: string[] = [];
    defaultMonths.forEach(m => {
      const slot = rombong.iuranRombong.find(b => 
        b.bulan.toLowerCase() === m.toLowerCase() && 
        (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
      );
      if ((!slot || !slot.lunas) && isMonthDue(m, selectedBillingYear)) {
        unpaidRombong.push(m);
      }
    });

    const priorArrears = getRombongArrearsBeforeYear(rombong, selectedBillingYear);

    const currentYearNum = new Date().getFullYear();
    const currentMonthName = fullMonths[new Date().getMonth()] || '';
    const isSelYearCurrent = selectedBillingYear === currentYearNum;

    const hasUnpaidCurrentMonth = isSelYearCurrent && unpaidRombong.includes(currentMonthName);
    const unpaidCurrentMonthName = hasUnpaidCurrentMonth ? currentMonthName : null;
    const unpaidPriorMonths = isSelYearCurrent 
      ? unpaidRombong.filter(m => m !== currentMonthName)
      : unpaidRombong;

    const displayCurrentMonth = waIncludeCurrent && unpaidCurrentMonthName;
    const displayPriorArrears = waIncludeArrears && (unpaidPriorMonths.length > 0 || priorArrears > 0);

    let message = `*TAGIHAN KETERTIBAN & SEWA LAHAN ROMBONG RT 08 PERUMTAS 3*\n`;
    message += `Kepada Yth. Bapak/Ibu Pemilik: *${rombong.namaPemilik}*\n`;
    message += `Lapak: *${rombong.noLapak} (${rombong.lokasi})*\n\n`;

    if (!displayCurrentMonth && !displayPriorArrears) {
      const isActuallyLunas = unpaidRombong.length === 0 && priorArrears === 0;
      if (isActuallyLunas) {
        message += `Selamat! Saat ini usaha Anda *Bebas Tunggakan* (Lunas sewa dan iuran). Terima kasih atas kerja samanya! 🎉`;
      } else {
        message += `Saat ini tidak ada rincian tagihan sesuai filter penagihan terpilih yang perlu dikirimkan.`;
      }
    } else {
      message += `Berikut rincian tagihan sewa & iuran untuk rombong kuliner Anda:\n`;
      let grandTotalAccumulated = 0;

      if (displayCurrentMonth) {
        const rate = getDefaultRombongRate(selectedBillingYear, unpaidCurrentMonthName, rateRombong);
        grandTotalAccumulated += rate;
        message += `• *Sewa Lahan Bulan Ini (${unpaidCurrentMonthName} ${selectedBillingYear})*: Rp ${rate.toLocaleString('id-ID')}\n`;
      }

      if (displayPriorArrears) {
        if (unpaidPriorMonths.length > 0) {
          let sub = 0;
          unpaidPriorMonths.forEach(m => {
            sub += getDefaultRombongRate(selectedBillingYear, m, rateRombong);
          });
          grandTotalAccumulated += sub;
          const firstMonthRate = getDefaultRombongRate(selectedBillingYear, unpaidPriorMonths[0], rateRombong);
          let monthLabel = `Tunggakan Bulan Sebelumnya`;
          if (!isSelYearCurrent) {
            monthLabel = `Tunggakan Tahun ${selectedBillingYear}`;
          }
          message += `• *${monthLabel}* (${unpaidPriorMonths.join(', ')} @ Rp ${firstMonthRate.toLocaleString('id-ID')}): Rp ${sub.toLocaleString('id-ID')}\n`;
        }

        if (priorArrears > 0) {
          grandTotalAccumulated += priorArrears;
          message += `• *Tunggakan Tahun Sebelumnya*: Rp ${priorArrears.toLocaleString('id-ID')}\n`;
        }
      }

      message += `\n*Total Tagihan: Rp ${grandTotalAccumulated.toLocaleString('id-ID')}*\n\n`;
      message += `Mohon pembayaran dapat dikoordinasikan dengan Pengurus RT ${adminNameFormatted} / ${bendaharaNameFormatted}.\n`;
      message += `Sukses selalu untuk usahanya! Terima kasih banyak atas kerjasamanya. 🙏`;
    }
    return message;
  };

  const handleOpenWhatsAppRombongLink = (rombong: RombongBill) => {
    const rawMsg = getWhatsAppRombongMessageText(rombong);
    const cleanedPhone = targetPhone.replace(/\D/g, '');
    let formattedPhone = cleanedPhone;
    if (formattedPhone.startsWith('0')) {
      formattedPhone = '62' + formattedPhone.slice(1);
    }
    const finalUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMsg)}`;
    window.open(finalUrl, '_blank');
    setSelectedRombongForWhatsApp(null);
    setTargetPhone('');
  };

  return (
    <div className="space-y-6">

      {/* Top Selector Panel: Sub-Tabs for Warga vs Rombong */}
      {(!currentUser || (currentUser.role !== 'warga' && currentUser.role !== 'rombong')) && (
        <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 gap-1 animate-in fade-in duration-300">
          <button
            onClick={() => {
              setActiveSubTab('warga');
              setSearchTerm('');
              setSelectedBlock('Semua');
              setSelectedStatus('Semua');
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSubTab === 'warga'
                ? 'bg-white text-sky-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Users className="w-4.5 h-4.5" />
            Iuran Bulanan {labelWargaSingular}
          </button>
          <button
            onClick={() => {
              setActiveSubTab('rombong');
              setSearchTerm('');
              setSelectedBlock('Semua');
              setSelectedStatus('Semua');
            }}
            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition cursor-pointer ${
              activeSubTab === 'rombong'
                ? 'bg-white text-emerald-600 shadow-xs border border-slate-200'
                : 'text-slate-600 hover:text-slate-800 hover:bg-white/40'
            }`}
          >
            <Store className="w-4.5 h-4.5" />
            Iuran {labelRombongPlural}
          </button>
        </div>
      )}

      {/* Welcome Card for Warga and Rombong roles */}
      {currentUser && (currentUser.role === 'warga' || currentUser.role === 'rombong') && (
        <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-150 p-6 rounded-3xl mb-4 relative overflow-hidden">
          <div className="absolute right-0 bottom-0 translate-y-4 translate-x-4 opacity-5 text-sky-900 pointer-events-none">
            {currentUser.role === 'warga' ? <Home className="w-48 h-48" /> : <Store className="w-48 h-48" />}
          </div>
          <p className="text-[10px] font-black tracking-wider uppercase text-sky-600 font-mono mb-1">Informasi Akun Warga</p>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Selamat Datang, {currentUser.nama}!</h2>
          <p className="text-xs text-slate-600 mt-1 leading-relaxed">
            {currentUser.role === 'warga' && wargaList.find(w => w.id === currentUser?.wargaId) && (
              <span>Anda terdaftar sebagai warga di <strong className="text-slate-800 font-bold">Blok {wargaList.find(w => w.id === currentUser?.wargaId)?.blok} No. {wargaList.find(w => w.id === currentUser?.wargaId)?.noRumah}</strong>.</span>
            )}
            {currentUser.role === 'rombong' && rombongList.find(r => r.id === currentUser?.rombongId) && (
              <span>Anda terdaftar sebagai pemilik lapak rombong <strong className="text-slate-800 font-bold">No. {rombongList.find(r => r.id === currentUser?.rombongId)?.noLapak}</strong> di lokasi <strong className="text-slate-850 font-bold">{rombongList.find(r => r.id === currentUser?.rombongId)?.lokasi}</strong>.</span>
            )}
            <span> Berikut adalah rincian tagihan iuran bulanan Anda saat ini. Silakan hubungi pengurus RT untuk melakukan pembayaran jika ada iuran yang belum lunas.</span>
          </p>
          <div className="mt-4 flex items-center gap-3 bg-white/85 border border-sky-100 rounded-2xl p-2.5 max-w-xs">
            <span className="text-[11px] font-bold text-slate-500 font-sans shrink-0">Tampilkan Tahun Tagihan:</span>
            <select
              value={selectedBillingYear}
              onChange={(e) => setSelectedBillingYear(parseInt(e.target.value, 10))}
              className="bg-transparent border-0 font-extrabold text-xs text-sky-700 focus:outline-none focus:ring-0 cursor-pointer"
            >
              {[2024, 2025, 2026, 2027, 2028].map((yr) => (
                <option key={yr} value={yr}>Tahun {yr}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Stats Board */}
      {(!currentUser || (currentUser.role !== 'warga' && currentUser.role !== 'rombong')) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in duration-350">
          <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-slate-500 font-semibold font-mono">
                {activeSubTab === 'warga' ? 'Daftar Warga Terdaftar' : 'Daftar Lapak Terdaftar'}
              </p>
              <p className="text-xl font-extrabold text-slate-900 mt-1">
                {activeSubTab === 'warga' ? `${totalWargaCount} Kepala Keluarga` : `${totalRombongCount} Lapak Rombong`}
              </p>
            </div>
            <div className="p-3 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
              {activeSubTab === 'warga' ? <Home className="w-5 h-5" /> : <Store className="w-5 h-5" />}
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-slate-500 font-semibold font-mono">Tagihan Belum Lunas</p>
              <p className="text-xl font-extrabold text-amber-600 mt-1">
                {activeSubTab === 'warga' 
                  ? `${outstandingWargaBillsCount} Pos Dues` 
                  : `${outstandingRombongBillsCount} Bulan Dues`
                }
              </p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          <div className="bg-white border border-slate-200 p-4 rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <p className="text-xs text-slate-500 font-semibold font-mono">Sistem Pendataan Dues</p>
              <p className="text-sm font-semibold text-emerald-600 mt-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" />
                Sesuai SK RT 08
              </p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <CreditCard className="w-5 h-5" />
            </div>
          </div>
        </div>
      )}

      {/* Control Panel: Search & Adding */}
      {(!currentUser || (currentUser.role !== 'warga' && currentUser.role !== 'rombong')) && (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs animate-in fade-in duration-400">
          <div className="flex flex-col xl:flex-row gap-3 items-stretch xl:items-center justify-between">
            
            <div className="flex flex-col md:flex-row flex-wrap gap-2 w-full xl:flex-1 items-stretch md:items-center">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    activeSubTab === 'warga' 
                      ? `Cari nama atau blok...` 
                      : `Cari nama / lapak / lokasi...`
                  }
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg pl-8.5 pr-3 py-2 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-400"
                />
              </div>

              {/* Block Filter - Only shown for warga */}
              {activeSubTab === 'warga' && (
                <div className="w-full md:w-32 shrink-0">
                  <select
                    value={selectedBlock}
                    onChange={(e) => setSelectedBlock(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  >
                    <option value="Semua">Blok: Semua</option>
                    {blocksList.map(b => (
                      <option key={b} value={b}>Blok {b}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Status Filter */}
              <div className="relative w-full md:w-36 shrink-0">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                >
                  <option value="Semua">Status: Semua</option>
                  <option value="Lunas">Bebas Tunggakan</option>
                  <option value="Belum Lunas">Ada Tunggakan</option>
                  <option value="Tunggakan2Bulan">⚠️ Tunggakan &gt; 2 Bln</option>
                </select>
              </div>

              {/* Keaktifan / Status Hunian Filter */}
              <div className="relative w-full md:w-36 shrink-0">
                <select
                  value={selectedKeaktifan}
                  onChange={(e) => setSelectedKeaktifan(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold"
                  title="Pilih Status Keaktifan / Hunian"
                >
                  <option value="aktif">Hunian: Aktif</option>
                  <option value="nonaktif">Hunian: Nonaktif</option>
                  <option value="pindah_sementara">Hunian: Pindah</option>
                  <option value="semua">Hunian: Semua</option>
                </select>
              </div>

              {/* Year Filter */}
              <div className="relative w-full md:w-28 shrink-0">
                <select
                  value={selectedBillingYear}
                  onChange={(e) => setSelectedBillingYear(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-205 rounded-lg px-2.5 py-2 text-xs text-slate-850 focus:outline-none focus:ring-2 focus:ring-sky-500 font-extrabold font-mono"
                  title="Pilih Tahun Anggaran/Tagihan"
                >
                  {yearsList.map(yr => (
                    <option key={yr} value={yr}>Tahun {yr}</option>
                  ))}
                </select>
              </div>

              {/* Month View Toggle */}
              <div className="bg-slate-55 border border-slate-205 p-0.5 rounded-lg flex items-center w-full md:w-auto shrink-0 select-none">
                <button
                  type="button"
                  onClick={() => setShowCurrentMonthOnly(true)}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-extrabold transition cursor-pointer flex-1 md:flex-initial whitespace-nowrap leading-none ${
                    showCurrentMonthOnly
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-150'
                  }`}
                  title="Hanya tampilkan tagihan bulan ini saja"
                >
                  Bulan Ini Saja
                </button>
                <button
                  type="button"
                  onClick={() => setShowCurrentMonthOnly(false)}
                  className={`px-2 py-1.5 rounded-md text-[11px] font-extrabold transition cursor-pointer flex-1 md:flex-initial whitespace-nowrap leading-none ${
                    !showCurrentMonthOnly
                      ? 'bg-sky-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-150'
                  }`}
                  title="Tampilkan 12 bulan penuh"
                >
                  Semua Bulan
                </button>
              </div>
            </div>

            {/* Add triggers for logged in admins & general actions (Print Buku Tagihan) */}
            <div className="w-full xl:w-auto flex flex-col md:flex-row items-stretch xl:items-center gap-2 shrink-0">
              <button
                onClick={() => setShowPrintBillingModal(true)}
                className="bg-slate-50 hover:bg-slate-100 text-slate-700 font-extrabold px-3 py-2 rounded-lg transition duration-200 text-xs whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 border border-slate-205 w-full md:w-auto active:scale-95"
                title="Cetak format Buku Rekapitulasi Tagihan dan Status Bulanan"
              >
                <Printer className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                Cetak Buku Tagihan
              </button>

              {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'sekretaris' || currentUser?.role === 'bendahara') && (
                <button
                  onClick={() => activeSubTab === 'warga' ? setShowAddModal(true) : setShowAddRombongModal(true)}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-2 rounded-lg transition duration-200 text-xs whitespace-nowrap cursor-pointer flex items-center justify-center gap-1 w-full md:w-auto active:scale-95 shadow-xs"
                  title={activeSubTab === 'warga' ? "Daftarkan Kepala Keluarga Warga Baru Baru" : "Daftarkan Lapak Rombong Kuliner Baru"}
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span>Registrasi Baru</span>
                </button>
              )}
            </div>

          </div>
        </div>
      )}

      {/* Add Resident Form Inline Modal */}
      {showAddModal && (
        <div className="bg-white border-2 border-sky-100 rounded-2xl p-6 shadow-lg relative animate-in fade-in duration-300">
          <button 
            onClick={() => setShowAddModal(false)}
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
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Blok Rumah</label>
              <select
                value={newWarga.blok}
                onChange={e => setNewWarga({...newWarga, blok: e.target.value})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
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
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor WhatsApp (Penagihan)</label>
              <input 
                type="text"
                placeholder="cth: 08123456789"
                value={newWarga.noWa}
                onChange={e => setNewWarga({...newWarga, noWa: e.target.value})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Status Kepemilikan Rumah</label>
              <select
                value={newWarga.statusRumah || 'milik_sendiri'}
                onChange={e => setNewWarga({...newWarga, statusRumah: e.target.value as any})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
              >
                <option value="milik_sendiri">Milik Sendiri (Tidak Sewa)</option>
                <option value="sewa_kontrak">Sewa / Kontrak</option>
                <option value="lainnya">Lainnya / Menumpang</option>
              </select>
            </div>

            {newWarga.statusRumah === 'sewa_kontrak' && (
              <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/55 border border-amber-150 rounded-2xl animate-in fade-in slide-in-from-top-1">
                <div>
                  <label className="block text-[10.5px] font-bold text-amber-900 mb-1 font-mono">Tgl Mulai Sewa</label>
                  <input 
                    type="date"
                    value={newWarga.tglAwalSewa || ''}
                    onChange={e => setNewWarga({...newWarga, tglAwalSewa: e.target.value})}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[10.5px] font-bold text-amber-900 mb-1 font-mono">Tgl Akhir Sewa</label>
                  <input 
                    type="date"
                    value={newWarga.tglAkhirSewa || ''}
                    onChange={e => setNewWarga({...newWarga, tglAkhirSewa: e.target.value})}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold font-mono"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor KTP (16 Digit - Opsional)</label>
              <input 
                type="text"
                maxLength={16}
                placeholder="cth: 3515XXXXXXXXXXXX"
                value={newWarga.noKtp || ''}
                onChange={e => setNewWarga({...newWarga, noKtp: e.target.value.replace(/\D/g, '')})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
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
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
              />
            </div>

            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Alamat Lengkap Asal KTP (Opsional - Untuk Cek KTP Asli/Luar Daerah)</label>
              <textarea 
                placeholder="cth: Jl. Gajah Mada No. 45, RT 01 RW 02, Kec. Jetis, Sidoarjo (Sesuai KTP Asal)"
                value={newWarga.alamatKtpAsal || ''}
                onChange={e => setNewWarga({...newWarga, alamatKtpAsal: e.target.value})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans"
                rows={2}
              />
            </div>

            {/* Unggah KTP */}
            <div className="md:col-span-1.5 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">FC / Foto Scan KTP</label>
                <div className="flex items-center gap-3">
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
                  <label htmlFor="add-new-ktp-file" className="bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 cursor-pointer text-xs font-extrabold px-3.5 py-2 rounded-xl border border-sky-200/60 transition inline-block text-center shadow-xs">
                    {newWarga.ktpBase64 ? 'Ganti Foto KTP' : 'Pilih Foto KTP'}
                  </label>
                  <span className="text-[11px] text-slate-500 truncate max-w-[150px]" title={newWarga.ktpNamaFile}>
                    {newWarga.ktpNamaFile || (newWarga.ktpBase64 ? 'Foto_KTP.jpg' : 'Belum diunggah')}
                  </span>
                </div>
              </div>
              {newWarga.ktpBase64 && (
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 shrink-0">
                  <div className="w-12 h-8 bg-slate-100 rounded-lg border overflow-hidden">
                    <img src={newWarga.ktpBase64} alt="KTP Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setNewWarga({...newWarga, ktpBase64: '', ktpNamaFile: ''})}
                    className="text-red-500 hover:text-red-700 text-xs font-bold font-mono transition"
                  >
                    Hapus Berkas
                  </button>
                </div>
              )}
            </div>

            {/* Unggah KK */}
            <div className="md:col-span-1.5 bg-slate-50/50 border border-slate-200 rounded-xl p-3.5 flex flex-col justify-between">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">FC / Foto Scan KK</label>
                <div className="flex items-center gap-3">
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
                  <label htmlFor="add-new-kk-file" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 cursor-pointer text-xs font-extrabold px-3.5 py-2 rounded-xl border border-emerald-200/60 transition inline-block text-center shadow-xs">
                    {newWarga.kkBase64 ? 'Ganti Foto KK' : 'Pilih Foto KK'}
                  </label>
                  <span className="text-[11px] text-slate-500 truncate max-w-[150px]" title={newWarga.kkNamaFile}>
                    {newWarga.kkNamaFile || (newWarga.kkBase64 ? 'Foto_KK.jpg' : 'Belum diunggah')}
                  </span>
                </div>
              </div>
              {newWarga.kkBase64 && (
                <div className="mt-2.5 flex items-center justify-between border-t border-slate-100 pt-2 shrink-0">
                  <div className="w-12 h-8 bg-slate-100 rounded-lg border overflow-hidden">
                    <img src={newWarga.kkBase64} alt="KK Preview" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setNewWarga({...newWarga, kkBase64: '', kkNamaFile: ''})}
                    className="text-red-500 hover:text-red-700 text-xs font-bold font-mono transition"
                  >
                    Hapus Berkas
                  </button>
                </div>
              )}
            </div>

            {/* Fitur Warga Baru (Bebas Iuran Sebelum Menempati) */}
            <div className="md:col-span-3 bg-sky-50/40 border border-sky-100/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-2.5">
                <input 
                  type="checkbox"
                  id="checkbox-warga-baru"
                  checked={newWarga.isWargaBaru}
                  onChange={e => setNewWarga({...newWarga, isWargaBaru: e.target.checked})}
                  className="mt-1 w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 focus:outline-none cursor-pointer"
                />
                <div>
                  <label htmlFor="checkbox-warga-baru" className="block text-xs font-bold text-slate-800 cursor-pointer font-sans select-none">
                    Tandai Sebagai "Warga Baru" (Baru Pindah/Menempati)
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Aktifkan opsi ini untuk otomatis membebaskan/menggratiskan iuran pada bulan-bulan sebelum masa penempatan.
                  </p>
                </div>
              </div>

              {newWarga.isWargaBaru && (
                <div className="flex flex-wrap items-center gap-2 bg-white border border-sky-100 p-2 rounded-lg shrink-0 animate-in fade-in slide-in-from-right duration-200">
                  <span className="text-xs font-bold text-slate-600 font-sans">Mulai Tagihan:</span>
                  
                  <select
                    value={newWarga.mulaiBulan}
                    onChange={e => setNewWarga({...newWarga, mulaiBulan: e.target.value})}
                    className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs text-slate-800 focus:outline-none font-semibold cursor-pointer"
                  >
                    {fullMonths.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>

                  <select
                    value={newWarga.mulaiTahun}
                    onChange={e => setNewWarga({...newWarga, mulaiTahun: Number(e.target.value)})}
                    className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs text-slate-800 focus:outline-none font-semibold cursor-pointer"
                  >
                    {yearsList.map(yr => (
                      <option key={yr} value={yr}>{yr}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

              {/* Bagian Anggota Keluarga */}
              <div className="md:col-span-3 border-t border-slate-100 pt-4 mt-2">
                <h5 className="text-xs font-bold text-slate-700 font-sans uppercase mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600 animate-pulse" />
                  Anggota Keluarga Serumah ({newWarga.anggotaKeluarga?.length || 0})
                </h5>
                
                {/* List of currently added members */}
                <div className="space-y-2 mb-3">
                  {(!newWarga.anggotaKeluarga || newWarga.anggotaKeluarga.length === 0) ? (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-150">
                      Belum ada anggota keluarga serumah yang ditambahkan.
                    </p>
                  ) : (
                    <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                      {newWarga.anggotaKeluarga.map((member, i) => (
                        <div key={member.id || i} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-extrabold text-slate-850">{member.nama}</div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-semibold mt-0.5">
                              <span>Hubungan: <span className="text-slate-700 font-extrabold">{member.hubungan}</span></span>
                              {member.nik && <span>• NIK: <span className="font-mono text-slate-600">{member.nik}</span></span>}
                              {member.noHape && <span>• WA: <span className="font-mono text-emerald-600">{member.noHape}</span></span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(member.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 rounded-lg cursor-pointer transition active:scale-95"
                            title="Hapus anggota keluarga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form inline to add a member */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-[11px] font-extrabold text-slate-550 tracking-wider uppercase flex items-center gap-1">
                    <UserPlus className="w-3.5 h-3.5" />
                    Tambah Anggota Keluarga
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Nama Anggota</label>
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={tempMember.nama}
                        onChange={e => setTempMember({...tempMember, nama: e.target.value})}
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Hubungan</label>
                      <select
                        value={tempMember.hubungan}
                        onChange={e => setTempMember({...tempMember, hubungan: e.target.value})}
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
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
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">WhatsApp (Opsional)</label>
                      <input
                        type="text"
                        placeholder="08XXXXXXXXXX"
                        value={tempMember.noHape}
                        onChange={e => setTempMember({...tempMember, noHape: e.target.value})}
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!tempMember.nama.trim()}
                      onClick={addFamilyMemberToList}
                      className="px-3 py-1.5 bg-sky-55 enabled:hover:bg-sky-100 border border-sky-150 text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Sematkan Anggota
                    </button>
                  </div>
                </div>
              </div>

              <div className="md:col-span-3 flex justify-end gap-2 pt-2">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-850 text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md shadow-sky-600/10 cursor-pointer"
                >
                  Simpan Warga
                </button>
              </div>
          </form>
        </div>
      )}

      {/* Add Rombong Form Inline Modal */}
      {showAddRombongModal && (
        <div className="bg-white border-2 border-emerald-100 rounded-2xl p-6 shadow-lg relative animate-in fade-in duration-300">
          <button 
            onClick={() => setShowAddRombongModal(false)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
          <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
            <Store className="w-5 h-5 text-emerald-600" />
            Pendaftaran Lapak Rombong Baru RT 08
          </h4>
          <form onSubmit={handleAddRombong} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nama Pemilik / Usaha</label>
              <input 
                required
                type="text"
                placeholder="cth: Suryono (Martabak Bangka)"
                value={newRombong.namaPemilik}
                onChange={e => setNewRombong({...newRombong, namaPemilik: e.target.value})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
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
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Lokasi Rombong</label>
              <input 
                type="text"
                placeholder="cth: Samping Gapura Perumahan"
                value={newRombong.lokasi}
                onChange={e => setNewRombong({...newRombong, lokasi: e.target.value})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1 font-mono">Nomor WhatsApp (Penagihan)</label>
              <input 
                type="text"
                placeholder="cth: 08123456789"
                value={newRombong.noWa}
                onChange={e => setNewRombong({...newRombong, noWa: e.target.value})}
                className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
              />
            </div>

            <div className="md:col-span-3 flex justify-end gap-2 pt-2">
              <button 
                type="button"
                onClick={() => setShowAddRombongModal(false)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-850 text-sm transition cursor-pointer"
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
      )}

      {/* Edit Resident (Warga) Overlay Dialog */}
      {editingWarga && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[92vh] overflow-y-auto">
            <button 
              onClick={() => setEditingWarga(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
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
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Blok Rumah</label>
                  <select
                    value={editingWarga.blok}
                    onChange={e => setEditingWarga({...editingWarga, blok: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
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
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
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
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Status Kepemilikan Rumah</label>
                <select
                  value={editingWarga.statusRumah || 'milik_sendiri'}
                  onChange={e => setEditingWarga({...editingWarga, statusRumah: e.target.value as any})}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-semibold"
                >
                  <option value="milik_sendiri">Milik Sendiri (Tidak Sewa)</option>
                  <option value="sewa_kontrak">Sewa / Kontrak</option>
                  <option value="lainnya">Lainnya / Menumpang</option>
                </select>
              </div>

              {editingWarga.statusRumah === 'sewa_kontrak' && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-amber-50/55 border border-amber-150 rounded-2xl animate-in fade-in slide-in-from-top-1">
                  <div>
                    <label className="block text-[10.5px] font-bold text-amber-900 mb-1 font-mono">Tgl Mulai Sewa</label>
                    <input 
                      type="date"
                      value={editingWarga.tglAwalSewa || ''}
                      onChange={e => setEditingWarga({...editingWarga, tglAwalSewa: e.target.value})}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[10.5px] font-bold text-amber-900 mb-1 font-mono">Tgl Akhir Sewa</label>
                    <input 
                      type="date"
                      value={editingWarga.tglAkhirSewa || ''}
                      onChange={e => setEditingWarga({...editingWarga, tglAkhirSewa: e.target.value})}
                      className="w-full bg-white border border-amber-200 rounded-xl p-2 text-xs text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none font-semibold font-mono"
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor KTP (16 Digit - Opsional)</label>
                  <input 
                    type="text"
                    maxLength={16}
                    placeholder="Masukkan 16 digit KTP"
                    value={editingWarga.noKtp || ''}
                    onChange={e => setEditingWarga({...editingWarga, noKtp: e.target.value.replace(/\D/g, '')})}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
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
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Alamat Lengkap Asal KTP (Opsional - Cek KTP Asli/Luar Daerah)</label>
                <textarea 
                  placeholder="Masukkan alamat lengkap asal sesuai KTP"
                  value={editingWarga.alamatKtpAsal || ''}
                  onChange={e => setEditingWarga({...editingWarga, alamatKtpAsal: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-sky-500 focus:outline-none font-sans"
                  rows={2}
                />
              </div>

              {/* Fitur Warga Baru (Bebas Iuran Sebelum Menempati) */}
              <div className="bg-sky-50/40 border border-sky-100/60 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-2.5">
                  <input 
                    type="checkbox"
                    id="edit-checkbox-warga-baru"
                    checked={editingWarga.isWargaBaru || false}
                    onChange={e => setEditingWarga({
                      ...editingWarga, 
                      isWargaBaru: e.target.checked,
                      mulaiBulan: e.target.checked ? (editingWarga.mulaiBulan || 'Maret') : undefined,
                      mulaiTahun: e.target.checked ? (editingWarga.mulaiTahun || 2026) : undefined
                    })}
                    className="mt-1 w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 focus:outline-none cursor-pointer"
                  />
                  <div>
                    <label htmlFor="edit-checkbox-warga-baru" className="block text-xs font-bold text-slate-800 cursor-pointer font-sans select-none">
                      Tandai Sebagai "Warga Baru" (Baru Pindah/Menempati)
                    </label>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Aktifkan opsi ini untuk otomatis membebaskan/menggratiskan iuran pada bulan-bulan sebelum masa penempatan.
                    </p>
                  </div>
                </div>

                {editingWarga.isWargaBaru && (
                  <div className="flex flex-wrap items-center gap-2 bg-white border border-sky-100 p-2 rounded-lg shrink-0 animate-in fade-in slide-in-from-right duration-205">
                    <span className="text-xs font-bold text-slate-600 font-sans">Mulai Tagihan:</span>
                    
                    <select
                      value={editingWarga.mulaiBulan || 'Maret'}
                      onChange={e => setEditingWarga({...editingWarga, mulaiBulan: e.target.value})}
                      className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs text-slate-800 focus:outline-none font-semibold cursor-pointer"
                    >
                      {fullMonths.map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>

                    <select
                      value={editingWarga.mulaiTahun || 2026}
                      onChange={e => setEditingWarga({...editingWarga, mulaiTahun: Number(e.target.value)})}
                      className="bg-slate-50 border border-slate-200 rounded-md py-1 px-2 text-xs text-slate-800 focus:outline-none font-semibold cursor-pointer"
                    >
                      {yearsList.map(yr => (
                        <option key={yr} value={yr}>{yr}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Edit Uploader KTP */}
              <div className="bg-slate-50/50 border border-slate-200 rounded-xl p-3 flex flex-col justify-between">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">FC / Foto Scan KTP</label>
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
                    <label htmlFor="edit-ktp-file-input" className="bg-sky-50 hover:bg-sky-100 text-sky-700 hover:text-sky-800 cursor-pointer text-xs font-extrabold px-3 py-1.5 rounded-lg border border-sky-200/50 transition shadow-xs">
                      {editingWarga.ktpBase64 ? 'Ganti Foto KTP' : 'Unggah Foto KTP'}
                    </label>
                    <span className="text-[11px] text-slate-500 truncate max-w-[150px]" title={editingWarga.ktpNamaFile}>
                      {editingWarga.ktpNamaFile || (editingWarga.ktpBase64 ? 'Foto_KTP.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {editingWarga.ktpBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 pb-0.5">
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5 font-mono">FC / Foto Scan KK</label>
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
                    <label htmlFor="edit-kk-file-input" className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 hover:text-emerald-800 cursor-pointer text-xs font-extrabold px-3 py-1.5 rounded-lg border border-emerald-200/50 transition shadow-xs">
                      {editingWarga.kkBase64 ? 'Ganti Foto KK' : 'Unggah Foto KK'}
                    </label>
                    <span className="text-[11px] text-slate-500 truncate max-w-[150px]" title={editingWarga.kkNamaFile}>
                      {editingWarga.kkNamaFile || (editingWarga.kkBase64 ? 'Foto_KK.jpg' : 'Belum diunggah')}
                    </span>
                  </div>
                </div>
                {editingWarga.kkBase64 && (
                  <div className="mt-2 flex items-center justify-between border-t border-slate-100 pt-2 pb-0.5">
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

              {/* Bagian Anggota Keluarga */}
              <div className="border-t border-slate-100 pt-4 mt-2">
                <h5 className="text-xs font-bold text-slate-705 font-sans uppercase mb-3 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-sky-600 animate-pulse" />
                  Anggota Keluarga Serumah ({editingWarga.anggotaKeluarga?.length || 0})
                </h5>
                
                {/* List of currently added members */}
                <div className="space-y-2 mb-3">
                  {(!editingWarga.anggotaKeluarga || editingWarga.anggotaKeluarga.length === 0) ? (
                    <p className="text-[11px] text-slate-500 italic bg-slate-50 p-3 rounded-xl border border-slate-150">
                      Belum ada anggota keluarga serumah yang ditambahkan.
                    </p>
                  ) : (
                    <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
                      {editingWarga.anggotaKeluarga.map((member, i) => (
                        <div key={member.id || i} className="bg-slate-50 border border-slate-150 rounded-xl p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-extrabold text-slate-850">{member.nama}</div>
                            <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 font-semibold mt-0.5">
                              <span>Hubungan: <span className="text-slate-700 font-extrabold">{member.hubungan}</span></span>
                              {member.nik && <span>• NIK: <span className="font-mono text-slate-600">{member.nik}</span></span>}
                              {member.noHape && <span>• WA: <span className="font-mono text-emerald-600">{member.noHape}</span></span>}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(member.id)}
                            className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-650 rounded-lg cursor-pointer transition active:scale-95"
                            title="Hapus anggota keluarga"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Form inline to add a member */}
                <div className="bg-slate-50/50 border border-slate-200 rounded-2xl p-4 space-y-3">
                  <div className="text-[11px] font-extrabold text-slate-550 tracking-wider uppercase flex items-center gap-1">
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
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">Hubungan</label>
                      <select
                        value={tempMember.hubungan}
                        onChange={e => setTempMember({...tempMember, hubungan: e.target.value})}
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-semibold cursor-pointer"
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
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-1">WhatsApp (Opsional)</label>
                      <input
                        type="text"
                        placeholder="08XXXXXXXXXX"
                        value={tempMember.noHape}
                        onChange={e => setTempMember({...tempMember, noHape: e.target.value})}
                        className="w-full bg-white border border-slate-205 rounded-lg p-2 text-xs focus:ring-1 focus:ring-sky-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      disabled={!tempMember.nama.trim()}
                      onClick={addFamilyMemberToList}
                      className="px-3 py-1.5 bg-sky-55 enabled:hover:bg-sky-100 border border-sky-150 text-sky-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
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
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Rombong Overlay Dialog */}
      {editingRombong && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800">
            <button 
              onClick={() => setEditingRombong(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-slate-900 text-base mb-4 flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-emerald-600" />
              Edit Informasi Rombong Lapak Kuliner
            </h4>
            <form onSubmit={handleEditRombongSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nama Pemilik / Usaha</label>
                <input 
                  required
                  type="text"
                  value={editingRombong.namaPemilik}
                  onChange={e => setEditingRombong({...editingRombong, namaPemilik: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor Lapak</label>
                  <input 
                    required
                    type="text"
                    value={editingRombong.noLapak}
                    onChange={e => setEditingRombong({...editingRombong, noLapak: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Lokasi Rombong</label>
                  <input 
                    required
                    type="text"
                    value={editingRombong.lokasi}
                    onChange={e => setEditingRombong({...editingRombong, lokasi: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nomor WhatsApp (Penagihan)</label>
                <input 
                  type="text"
                  value={editingRombong.noWa || ''}
                  placeholder="Format: 08123456789"
                  onChange={e => setEditingRombong({...editingRombong, noWa: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-sm text-slate-950 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button"
                  onClick={() => setEditingRombong(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-sm transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md cursor-pointer"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Citizens Deletion Confirmation Modal */}
      {wargaToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-150 text-center relative border-t-4 border-t-rose-500 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setWargaToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Batal"
              id="cancel-del-warga"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-base mb-2">Kelola Hunian / Hapus Warga</h3>
            <p className="text-slate-605 text-xs mb-4 leading-relaxed">
              Silakan pilih tindakan pengelolaan untuk warga <strong className="text-slate-900 font-semibold font-mono bg-slate-50 px-1.5 py-0.5 rounded-md">"{wargaToDelete.nama}"</strong>:
            </p>

            <div className="text-left bg-slate-50 border border-slate-150 p-4 rounded-2xl mb-5 space-y-3">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Pilihan Tindakan Hunian:</span>
              
              {wargaList.find(w => w.id === wargaToDelete.id)?.statusKeaktifan && wargaList.find(w => w.id === wargaToDelete.id)?.statusKeaktifan !== 'aktif' && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="delChoiceW" 
                    value="aktif" 
                    checked={deleteChoiceWarga === 'aktif'}
                    onChange={() => setDeleteChoiceWarga('aktif')}
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-emerald-700">🔄 Aktifkan Kembali Hunian</span>
                    <span className="block text-slate-500 leading-normal font-medium text-[10px]">Mengaktifkan kembali status warga agar pembukuan dan pembayaran iuran bulanan berjalan normal.</span>
                  </div>
                </label>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="delChoiceW" 
                  value="nonaktif" 
                  checked={deleteChoiceWarga === 'nonaktif'}
                  onChange={() => setDeleteChoiceWarga('nonaktif')}
                  className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-800">💤 Nonaktifkan Hunian (Arsip)</span>
                  <span className="block text-slate-500 leading-normal font-medium text-[10px]">Menandai warga tidak aktif menempati lagi. Riwayat transaksi tetap utuh dan profil dipindahkan ke daftar arsip.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="delChoiceW" 
                  value="pindah_sementara" 
                  checked={deleteChoiceWarga === 'pindah_sementara'}
                  onChange={() => setDeleteChoiceWarga('pindah_sementara')}
                  className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-800">🚚 Pindah Sementara</span>
                  <span className="block text-slate-500 leading-normal font-medium text-[10px]">Warga pindah keluar sementara waktu. Riwayat kas dan iuran bulanan tetap terjaga dan warga bisa diaktifkan kembali saat menempati lagi.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="delChoiceW" 
                  value="permanen" 
                  checked={deleteChoiceWarga === 'permanen'}
                  onChange={() => setDeleteChoiceWarga('permanen')}
                  className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="block font-bold text-rose-700">🗑️ Hapus Permanen seluruh riwayat</span>
                  <span className="block text-slate-500 leading-normal font-medium text-[10px]">Menghapus seluruh profil warga secara total dari database beserta semua rekap iurannya.</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setWargaToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs md:text-sm transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteChoiceWarga === 'permanen') {
                    updateWargaList(wargaList.filter(w => w.id !== wargaToDelete.id));
                  } else if (deleteChoiceWarga === 'aktif') {
                    updateWargaList(wargaList.map(w => w.id === wargaToDelete.id ? { ...w, statusKeaktifan: 'aktif' as any } : w));
                    setSelectedWargaHistory(prev => prev && prev.id === wargaToDelete.id ? { ...prev, statusKeaktifan: 'aktif' as any } : prev);
                    alert(`Warga "${wargaToDelete.nama}" berhasil diaktifkan kembali!`);
                  } else if (deleteChoiceWarga === 'nonaktif') {
                    updateWargaList(wargaList.map(w => w.id === wargaToDelete.id ? { ...w, statusKeaktifan: 'nonaktif' } : w));
                  } else {
                    updateWargaList(wargaList.map(w => w.id === wargaToDelete.id ? { ...w, statusKeaktifan: 'pindah_sementara' } : w));
                  }
                  setWargaToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs md:text-sm transition cursor-pointer shadow-md"
                id="confirm-del-warga"
              >
                Proses Tindakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rombong Deletion Confirmation Modal */}
      {rombongToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-150 text-center relative border-t-4 border-t-rose-500 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setRombongToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Batal"
              id="cancel-del-rombong"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-base mb-2">Kelola Hunian / Hapus Lapak Rombong</h3>
            <p className="text-slate-605 text-xs mb-4 leading-relaxed">
              Silakan pilih tindakan pengelolaan untuk lapak rombong milik <strong className="text-slate-900 font-semibold font-mono bg-slate-50 px-1.5 py-0.5 rounded-md">"{rombongToDelete.nama}"</strong>:
            </p>

            <div className="text-left bg-slate-50 border border-slate-150 p-4 rounded-2xl mb-5 space-y-3">
              <span className="block text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">Pilihan Tindakan Lapak:</span>
              
              {rombongList.find(r => r.id === rombongToDelete.id)?.statusKeaktifan && rombongList.find(r => r.id === rombongToDelete.id)?.statusKeaktifan !== 'aktif' && (
                <label className="flex items-start gap-2.5 cursor-pointer select-none">
                  <input 
                    type="radio" 
                    name="delChoiceR" 
                    value="aktif" 
                    checked={deleteChoiceRombong === 'aktif'}
                    onChange={() => setDeleteChoiceRombong('aktif')}
                    className="mt-1 h-4 w-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                  />
                  <div className="text-xs">
                    <span className="block font-bold text-emerald-700">🔄 Aktifkan Kembali Lapak</span>
                    <span className="block text-slate-500 leading-normal font-medium text-[10px]">Mengaktifkan kembali status lapak rombong agar pembukuan dan pembayaran sewa bulanan berjalan normal.</span>
                  </div>
                </label>
              )}

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="delChoiceR" 
                  value="nonaktif" 
                  checked={deleteChoiceRombong === 'nonaktif'}
                  onChange={() => setDeleteChoiceRombong('nonaktif')}
                  className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-800">💤 Nonaktifkan Rombong (Arsip)</span>
                  <span className="block text-slate-500 leading-normal font-medium text-[10px]">Menandai lapak tidak aktif berjualan lagi. Riwayat transaksi sewa tetap utuh dan profil dipindahkan ke daftar arsip.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="delChoiceR" 
                  value="pindah_sementara" 
                  checked={deleteChoiceRombong === 'pindah_sementara'}
                  onChange={() => setDeleteChoiceRombong('pindah_sementara')}
                  className="mt-1 h-4 w-4 text-sky-600 focus:ring-sky-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="block font-bold text-slate-800">🚚 Pindah Sementara</span>
                  <span className="block text-slate-500 leading-normal font-medium text-[10px]">Lapak pindah/tutup sementara waktu. Riwayat kas dan iuran rombong tetap terjagakan dan lapak bisa diaktifkan kembali saat ingin aktif lagi.</span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input 
                  type="radio" 
                  name="delChoiceR" 
                  value="permanen" 
                  checked={deleteChoiceRombong === 'permanen'}
                  onChange={() => setDeleteChoiceRombong('permanen')}
                  className="mt-1 h-4 w-4 text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <div className="text-xs">
                  <span className="block font-bold text-rose-700">🗑️ Hapus Permanen seluruh riwayat</span>
                  <span className="block text-slate-500 leading-normal font-medium text-[10px]">Menghapus seluruh profil lapak secara total dari database beserta semua rekap iurannya.</span>
                </div>
              </label>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setRombongToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs md:text-sm transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  if (deleteChoiceRombong === 'permanen') {
                    updateRombongList(rombongList.filter(r => r.id !== rombongToDelete.id));
                  } else if (deleteChoiceRombong === 'aktif') {
                    updateRombongList(rombongList.map(r => r.id === rombongToDelete.id ? { ...r, statusKeaktifan: 'aktif' as any } : r));
                    setSelectedRombongHistory(prev => prev && prev.id === rombongToDelete.id ? { ...prev, statusKeaktifan: 'aktif' as any } : prev);
                    alert(`Lapak Rombong "${rombongToDelete.nama}" berhasil diaktifkan kembali!`);
                  } else if (deleteChoiceRombong === 'nonaktif') {
                    updateRombongList(rombongList.map(r => r.id === rombongToDelete.id ? { ...r, statusKeaktifan: 'nonaktif' } : r));
                  } else {
                    updateRombongList(rombongList.map(r => r.id === rombongToDelete.id ? { ...r, statusKeaktifan: 'pindah_sementara' } : r));
                  }
                  setRombongToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs md:text-sm transition cursor-pointer shadow-md"
                id="confirm-del-rombong"
              >
                Proses Tindakan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Warga Payment Processing Confirmation Box (Floating Modal Overlay) */}
      {payingInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-lg w-full">
            <button 
              onClick={() => setPayingInfo(null)}
              className="absolute top-4 right-4 text-slate-450 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-105 transition"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-emerald-600 text-base mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Konfirmasi Pencatatan Pembayaran Iuran
            </h4>
            <p className="text-slate-650 text-sm mb-3 leading-relaxed">
              Mencatat pembayaran iuran <strong className="text-slate-900">{payingInfo.category}</strong> bulan <strong className="text-slate-900">{payingInfo.bulan}</strong> oleh warga <strong className="text-slate-900">{payingInfo.warga.nama}</strong> (Blok {payingInfo.warga.blok}-{payingInfo.warga.noRumah}) sebesar <strong className="text-emerald-605 font-mono font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded-lg">Rp {payingInfo.nominal.toLocaleString('id-ID')}</strong>.
            </p>
            <div className="bg-sky-50 border border-sky-150 rounded-xl p-3 mb-4 text-xs text-sky-800 leading-relaxed">
              💡 <strong>Ketentuan Kas:</strong> Uang tagihan ini dihitung sebagai <strong>Pendapatan Akrual / Kas Masuk</strong> dan langsung disetorkan ke Bank untuk keamanan dan pembukuan resmi, serta tetap terhitung dalam total saldo keseluruhan kas warga.
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-605 mb-1.5 font-mono">Target Penerimaan Kas Pelunasan (Iuran RT Tunai / Iuran RT Bank)</label>
                <select
                  value={paymentTargetKas}
                  onChange={(e) => setPaymentTargetKas(e.target.value as keyof Balance)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                >
                  <option value="rtTunai">Iuran RT Tunai (Sisa: Rp {kas.rtTunai.toLocaleString('id-ID')})</option>
                  <option value="rtBank">Iuran RT Bank (Sisa: Rp {kas.rtBank.toLocaleString('id-ID')})</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Pembayaran</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Jam Pembayaran</label>
                  <input
                    type="time"
                    required
                    value={paymentTime}
                    onChange={(e) => setPaymentTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-dashed border-slate-250 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 text-center w-full">Foto Nota / Bukti Transfer Pembayaran Warga</label>
                {paymentReceiptBase64 ? (
                  <div className="relative group w-32 h-32 border rounded-xl overflow-hidden shadow-xs bg-white">
                    <img src={paymentReceiptBase64} alt="Bukti Transfer" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentReceiptBase64('');
                        setPaymentReceiptNamaFile('');
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
                    <span className="text-[10px] text-slate-500 font-semibold mb-1 text-center max-w-[280px]">Unggah foto struk transfer ATM, struk M-Banking, atau nota lunas</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setPaymentReceiptBase64(compressed);
                            setPaymentReceiptNamaFile(file.name);
                          } catch (err) {
                            console.error(err);
                            alert('Gagal mengompres gambar.');
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer hidden"
                      id="upload-payment-struk-warga"
                    />
                    <label
                      htmlFor="upload-payment-struk-warga"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-705 border border-slate-205 hover:border-slate-305 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm transition animate-none"
                    >
                      Pilih Struk / Foto
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setPayingInfo(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button 
                  onClick={processPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-97 transition"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Selesaikan Pembayaran & Catat Kas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rombong Payment Processing Confirmation Box (Floating Modal Overlay) */}
      {payingRombongInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-lg w-full">
            <button 
              onClick={() => setPayingRombongInfo(null)}
              className="absolute top-4 right-4 text-slate-455 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-105 transition"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-emerald-600 text-base mb-2 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600" />
              Konfirmasi Penerimaan Sewa / Lapak Rombong
            </h4>
            <p className="text-slate-655 text-sm mb-3 leading-relaxed">
              Mencatat pembayaran <strong className="text-slate-900">{payingRombongInfo.category}</strong> bulan <strong className="text-slate-900">{payingRombongInfo.bulan}</strong> oleh pemilik <strong className="text-slate-900">{payingRombongInfo.rombong.namaPemilik}</strong> ({payingRombongInfo.rombong.noLapak}) sebesar <strong className="text-emerald-605 font-mono font-bold text-sm bg-emerald-50 px-2 py-0.5 rounded-lg">Rp {payingRombongInfo.nominal.toLocaleString('id-ID')}</strong>.
            </p>
            <div className="bg-emerald-50 border border-emerald-150 rounded-xl p-3 mb-4 text-xs text-emerald-800 leading-relaxed font-sans">
              💡 <strong>Ketentuan Kas:</strong> Pendapatan sewa rombong wajib disetorkan ke rekening Bank, serta tetap menjadi bagian dari representasi saldo keseluruhan kas Rombong RT 08.
            </div>

            <div className="space-y-4">
              {/* Kustomisasi Nominal */}
              <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-slate-400">
                  <input
                    type="checkbox"
                    id="enable-custom-rombong"
                    checked={isRombongCustomActive}
                    disabled={!isKolektor2}
                    onChange={(e) => {
                      setIsRombongCustomActive(e.target.checked);
                      if (!e.target.checked) {
                        setCustomRombongPayNominal(payingRombongInfo.nominal);
                        setAdminApprovalPin('');
                      }
                    }}
                    className={`rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 ${isKolektor2 ? 'cursor-pointer' : 'cursor-not-allowed text-slate-305'}`}
                  />
                  <label htmlFor="enable-custom-rombong" className={`text-xs font-bold ${isKolektor2 ? 'text-slate-700 cursor-pointer' : 'text-slate-400 cursor-not-allowed'}`}>
                    Kustomisasi Nominal Pembayaran (Custom Tagihan)
                  </label>
                </div>
                {!isKolektor2 && (
                  <p className="text-[10px] text-amber-600 pl-6 leading-relaxed font-semibold">
                    ⚠️ Kustomisasi nominal pembayaran sewa rombong hanya dapat diinput oleh Kolektor Rombong.
                  </p>
                )}

                {isRombongCustomActive && (
                  <div className="space-y-3 pl-6 animate-in slide-in-from-top-1 duration-150">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">Nominal Custom (Rp)</label>
                      <input
                        type="number"
                        min="100"
                        step="100"
                        value={customRombongPayNominal}
                        onChange={(e) => setCustomRombongPayNominal(Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {isRombongMacet(payingRombongInfo.rombong, payingRombongInfo.tahun, payingRombongInfo.bulan) && customRombongPayNominal !== payingRombongInfo.nominal && (
                      <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 space-y-2">
                        <div className="text-[10px] text-rose-700 font-semibold leading-relaxed flex items-start gap-1.5">
                          <ShieldAlert className="w-3.5 h-3.5 shrink-0 text-rose-500 mt-0.5" />
                          <span>
                            Sistem mendeteksi lapak rombong ini memiliki catatan <strong>sewa macet</strong> pada bulan-bulan sebelumnya. Kustomisasi nominal memerlukan persetujuan Admin!
                          </span>
                        </div>
                        
                        {currentUser?.role === 'admin' ? (
                          <div className="text-[10px] text-emerald-600 font-bold bg-emerald-50/75 border border-emerald-100 px-2.5 py-1 rounded-lg">
                            ✓ Anda login sebagai Admin. Otorisasi disetujui otomatis.
                          </div>
                        ) : (
                          <div>
                            <label className="block text-[10px] font-bold text-rose-800 mb-1">Masukkan PIN Admin untuk Approval:</label>
                            <input
                              type="password"
                              maxLength={6}
                              placeholder="PIN Admin"
                              value={adminApprovalPin}
                              onChange={(e) => setAdminApprovalPin(e.target.value)}
                              className="w-full bg-white border border-rose-200 rounded-xl px-2.5 py-1.5 text-xs font-mono text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-rose-400"
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-605 mb-1.5 font-mono">Target Penerimaan Akun Kas (Rekomendasi: Bank)</label>
                <select
                  value={paymentTargetKas}
                  onChange={(e) => setPaymentTargetKas(e.target.value as keyof Balance)}
                  className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                >
                  <option value="rombongTunai">[Rombong] Rombong Tunai (Sisa: Rp {kas.rombongTunai.toLocaleString('id-ID')})</option>
                  <option value="rombongBank">[Rombong] Rombong Bank / Setor Bank (Sisa: Rp {kas.rombongBank.toLocaleString('id-ID')})</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5 font-mono">Tanggal Pembayaran</label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1.5 font-mono">Jam Pembayaran</label>
                  <input
                    type="time"
                    required
                    value={paymentTime}
                    onChange={(e) => setPaymentTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div className="bg-slate-50 border border-dashed border-slate-250 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                <label className="block text-xs font-bold text-slate-700 font-mono mb-1 text-center w-full">Foto Nota / Bukti Bayar Sewa Rombong</label>
                {paymentReceiptBase64 ? (
                  <div className="relative group w-32 h-32 border rounded-xl overflow-hidden shadow-xs bg-white">
                    <img src={paymentReceiptBase64} alt="Bukti Transfer Sewa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => {
                        setPaymentReceiptBase64('');
                        setPaymentReceiptNamaFile('');
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
                    <span className="text-[10px] text-slate-500 font-semibold mb-1 text-center max-w-[280px]">Unggah foto kuitansi manual sewa lapak atau bukti transfer</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          try {
                            const compressed = await compressImage(file);
                            setPaymentReceiptBase64(compressed);
                            setPaymentReceiptNamaFile(file.name);
                          } catch (err) {
                            console.error(err);
                            alert('Gagal mengompres gambar.');
                          }
                        }
                      }}
                      className="absolute inset-0 opacity-0 cursor-pointer hidden"
                      id="upload-payment-struk-rombong"
                    />
                    <label
                      htmlFor="upload-payment-struk-rombong"
                      className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-705 border border-slate-205 hover:border-slate-305 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm transition animate-none"
                    >
                      Pilih Foto / Struk
                    </label>
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setPayingRombongInfo(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batalkan
                </button>
                <button 
                  onClick={processRombongPayment}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/10 cursor-pointer active:scale-97 transition"
                >
                  <Coins className="w-3.5 h-3.5" />
                  Selesaikan Pembayaran & Catat Kas
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL DETIL SUKSES VERIFIKASI PEMBAYARAN & WHATSAPP RECEIPT NOTIFIKASI */}
      {receiptSuccessInfo && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 z-[110] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-md w-full font-sans">
            <button 
              type="button"
              onClick={() => setReceiptSuccessInfo(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-705 cursor-pointer p-1.5 rounded-full hover:bg-slate-100 transition"
              title="Tutup Bukti"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Visual Header */}
            <div className="flex flex-col items-center text-center mt-2 mb-4">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-2.5 shadow-xs">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <h4 className="font-black text-slate-900 text-base leading-snug">
                Pembayaran Sukses Diverifikasi!
              </h4>
              <p className="text-[11px] text-emerald-600 font-extrabold tracking-wide uppercase font-mono block mt-0.5">
                Status: Lunas &amp; Dicatat Kas 🟢
              </p>
            </div>

            {/* Rincian Finansial Kuitansi */}
            <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 space-y-2.5 text-[11px]">
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Kategori Iuran</span>
                <span className="font-extrabold text-slate-900">{receiptSuccessInfo.category}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Nama Pembayar</span>
                <span className="font-extrabold text-slate-900">{receiptSuccessInfo.nama}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">
                  {receiptSuccessInfo.tipe === 'warga' ? 'Unit Rumah' : 'No Lapak'}
                </span>
                <span className="font-extrabold text-slate-900 font-mono">
                  {receiptSuccessInfo.tipe === 'warga' 
                    ? `Blok ${receiptSuccessInfo.blok}-${receiptSuccessInfo.noRumah}` 
                    : `Lapak ${receiptSuccessInfo.noLapak}`}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Periode Pembayaran</span>
                <span className="font-extrabold text-slate-900">{receiptSuccessInfo.bulan} {receiptSuccessInfo.tahun}</span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Metode Kas Masuk</span>
                <span className="font-extrabold text-slate-950 font-mono text-[10px] bg-slate-200/65 px-1.5 py-0.5 rounded uppercase">
                  {receiptSuccessInfo.kasPenerima}
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Tanggal &amp; Waktu</span>
                <span className="font-extrabold text-slate-800 font-mono">
                  {receiptSuccessInfo.tanggalBayar} ({receiptSuccessInfo.jamBayar})
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Petugas Kas</span>
                <span className="font-extrabold text-slate-800">{receiptSuccessInfo.petugas}</span>
              </div>
              {receiptSuccessInfo.catatan && (
                <div className="flex justify-between items-center border-b border-slate-200/60 pb-1.5">
                  <span className="text-slate-455 font-bold uppercase tracking-wider font-mono">Berkas Struk</span>
                  <span className="font-extrabold text-slate-500 truncate max-w-[200px]" title={receiptSuccessInfo.catatan}>
                    {receiptSuccessInfo.catatan}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center pt-0.5">
                <span className="text-slate-455 font-bold uppercase tracking-wider font-mono text-xs">Total Nominal</span>
                <span className="font-black text-emerald-600 text-sm font-mono">
                  Rp {receiptSuccessInfo.nominal.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            {/* Visual Kartu Ucapan Terima Kasih (Premium Gratitude Card) */}
            <div className="mt-3.5 bg-gradient-to-br from-emerald-500/10 to-teal-500/5 border border-emerald-250/60 rounded-2xl p-3.5 text-center relative overflow-hidden group shadow`xs border-dashed animate-in slide-in-from-bottom-2 duration-300">
              <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-100/30 rounded-bl-full pointer-events-none transition duration-500 group-hover:scale-110" />
              <div className="absolute -left-2 -bottom-2 text-3xl opacity-15 pointer-events-none select-none">🎉</div>
              <div className="absolute -right-2 -bottom-2 text-3xl opacity-15 pointer-events-none select-none">🌸</div>
              
              <div className="flex justify-center items-center gap-1.5 text-emerald-700 font-extrabold text-[11px] uppercase tracking-wider mb-1.5 font-mono">
                <span>💖 UCAPAN APRESIASI RT 08 💖</span>
              </div>
              
              <h5 className="text-xs font-black text-emerald-950 leading-snug">
                Terima Kasih Banyak Atas Pembayaran Anda! 🙏
              </h5>
              
              <p className="text-[10.5px] text-slate-650 leading-relaxed mt-2 font-medium font-sans">
                Terima kasih atas partisipasi aktif Bapak/Ibu <span className="font-extrabold text-emerald-800">{receiptSuccessInfo.nama}</span> dalam pelunasan <strong className="text-slate-805 font-bold">{receiptSuccessInfo.category} ({receiptSuccessInfo.bulan} {receiptSuccessInfo.tahun})</strong>.
              </p>
              
              <p className="text-[10px] text-slate-505 leading-relaxed mt-1.5 font-semibold italic bg-white/70 border border-slate-100 p-1.5 rounded-xl">
                "Kontribusi nyata Bapak/Ibu adalah wujud kepedulian berharga yang menguatkan tali kekeluargaan, menjaga kehangatan paguyuban warga, serta membawa kebaikan bersama di RT 08 Perumahan TAS 3."
              </p>
              
              <div className="flex justify-center gap-1 mt-2.5">
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
                <span className="text-xs select-none">⭐️</span>
              </div>
            </div>

            {/* Tombol-Tombol Aksi Utama */}
            <div className="space-y-2 mt-4">
              
              {/* WhatsApp Notification Share Button */}
              <button
                type="button"
                onClick={() => {
                  const noWaRaw = receiptSuccessInfo.noWa || '';
                  let noWaFmt = noWaRaw.replace(/[^\d]/g, '');
                  if (noWaFmt.startsWith('0')) {
                    noWaFmt = '62' + noWaFmt.substring(1);
                  } else if (noWaFmt.length > 0 && !noWaFmt.startsWith('62')) {
                    noWaFmt = '62' + noWaFmt;
                  }
                  
                  const detailLoc = receiptSuccessInfo.tipe === 'warga'
                    ? `Blok ${receiptSuccessInfo.blok}-${receiptSuccessInfo.noRumah}`
                    : `No Lapak ${receiptSuccessInfo.noLapak}`;

                  const textMessage = `*BUKTI PEMBAYARAN IURAN RT 08* ✅\n\nHalo Bapak/Ibu *${receiptSuccessInfo.nama}*,\nTerima kasih, pembayaran Iuran Anda telah sukses kami verifikasi.\n\n*Detail Pembayaran:*\n• Nama: ${receiptSuccessInfo.nama}\n• Unit: ${detailLoc}\n• Kategori: ${receiptSuccessInfo.category}\n• Periode: ${receiptSuccessInfo.bulan} ${receiptSuccessInfo.tahun}\n• Nominal: Rp ${receiptSuccessInfo.nominal.toLocaleString('id-ID')}\n• Tanggal: ${receiptSuccessInfo.tanggalBayar} ${receiptSuccessInfo.jamBayar}\n• Penerima: KAS ${receiptSuccessInfo.kasPenerima.toUpperCase()}\n• Petugas: ${receiptSuccessInfo.petugas}\n\n*Status:* LUNAS & TERVERIFIKASI 🟢\n\nTerima kasih atas partisipasi aktif Bapak/Ibu dalam mendukung program pembangunan lingkungan RT 08 Perumahan TAS 3.\n\nSalam hangat,\n*Pengurus RT 08 Perumahan TAS 3* 🙏`;
                  const url = `https://wa.me/${noWaFmt}?text=${encodeURIComponent(textMessage)}`;
                  window.open(url, '_blank');
                }}
                className="w-full bg-emerald-605 bg-emerald-650 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-2 active:scale-97 shadow-lg shadow-emerald-500/10"
              >
                <MessageSquare className="w-4 h-4 fill-white" />
                <span>Kirim Bukti via WhatsApp</span>
              </button>

              {/* Batalkan/Tutup */}
              <button
                type="button"
                onClick={() => setReceiptSuccessInfo(null)}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 rounded-xl cursor-pointer transition text-xs flex items-center justify-center gap-1.5 active:scale-97"
              >
                Tutup Monitor
              </button>
            </div>
            
            <p className="text-[9px] text-slate-400 font-sans leading-normal mt-3 text-center">
              ⚠️ Notifikasi WA akan otomatis membuka aplikasi WhatsApp Resmi untuk menyampaikan kuitansi digital pembayaran yang lunas kepada warga terdaftar.
            </p>
          </div>
        </div>
      )}

      {/* Warga Correction Modal */}
      {correctionWargaInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setCorrectionWargaInfo(null)}
              className="absolute top-4 right-4 text-slate-455 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-105 transition"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-sky-600 text-base mb-2 flex items-center gap-2 font-sans">
              <Settings className="w-5 h-5 text-sky-600" />
              Koreksi &amp; Edit Iuran RT
            </h4>
            <p className="text-slate-655 text-sm mb-4 leading-relaxed font-sans">
              Mengedit catatan iuran <strong className="text-slate-950">Iuran RT</strong> bulan <strong className="text-slate-950">{correctionWargaInfo.bulan}</strong> untuk warga <strong className="text-slate-950">{correctionWargaInfo.warga.nama}</strong> (Blok {correctionWargaInfo.warga.blok}-{correctionWargaInfo.warga.noRumah}).
            </p>

            <div className="border-b border-dashed border-slate-200 my-4"></div>

            <div className="space-y-4">
              {/* Option 1: Basic Status Adjustment */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">1. Ubah Informasi Tagihan Warga Ini</div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Pembayaran</label>
                  <select
                    value={corrStatusLunas ? 'true' : 'false'}
                    onChange={(e) => setCorrStatusLunas(e.target.value === 'true')}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                  >
                    <option value="true">Lunas (Selesai Dibayar)</option>
                    <option value="false">Belum Lunas (Batalkan Pembayaran)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 pt-1.5 pb-1">
                  <input
                    type="checkbox"
                    id="corrNoCashFlow"
                    checked={corrNoCashFlow}
                    onChange={(e) => setCorrNoCashFlow(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="corrNoCashFlow" className="text-xs font-semibold text-slate-700 cursor-pointer select-none leading-none">
                    Koreksi Administratif (Tanpa Aliran Kas Baru / Pendapatan)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">
                    Catatan Khusus (Koreksi / Bukti Pendukung)
                  </label>
                  <textarea
                    rows={2}
                    value={corrCatatan}
                    onChange={(e) => setCorrCatatan(e.target.value)}
                    placeholder="Contoh: Sudah bayar sejak sebelum aplikasi terbit, penyesuaian khusus lunas/belum lunas..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-sans text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {corrStatusLunas && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Iuran (Rp)</label>
                        <input
                          type="number"
                          value={corrNominal}
                          onChange={(e) => setCorrNominal(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Periode Tahun</label>
                        <select
                          value={corrTahun}
                          onChange={(e) => setCorrTahun(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        >
                          <option value="2025">Tahun 2025</option>
                          <option value="2026">Tahun 2026</option>
                          <option value="2027">Tahun 2027</option>
                          <option value="2028">Tahun 2028</option>
                          <option value="2029">Tahun 2029</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Akun Kas Pembukuan terkait</label>
                      <select
                        value={corrTargetKas}
                        onChange={(e) => setCorrTargetKas(e.target.value as keyof Balance)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                      >
                        <option value="rtTunai">Iuran RT Tunai</option>
                        <option value="rtBank">Iuran RT Bank</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Tanggal Pembayaran</label>
                        <input
                          type="date"
                          value={corrPaymentDate}
                          onChange={(e) => setCorrPaymentDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Jam Pembayaran</label>
                        <input
                          type="time"
                          value={corrPaymentTime}
                          onChange={(e) => setCorrPaymentTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Option 2: Salah Centang */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-150 space-y-3">
                <div className="text-[11px] font-extrabold text-amber-700 uppercase tracking-widest font-mono flex items-center gap-1">
                  💡 2. Pindahkan Pembayaran (Salah Centang Orang)
                </div>
                <p className="text-xs text-slate-600 leading-normal font-sans">
                  Jika Anda salah klik/salah centang nama orang lain, pilih warga yang seharusnya membayar di bawah ini. Catatan iuran lunas akan dipindahkan ke nama warga yang dipilih.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1 font-sans">Warga Penerima Sebenarnya</label>
                  <select
                    value={corrTransferTargetWargaId}
                    onChange={(e) => setCorrTransferTargetWargaId(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  >
                    <option value="">-- Tetap pada warga ini (Jangan dipindahkan) --</option>
                    {wargaList.filter(w => w.id !== correctionWargaInfo.warga.id).map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nama} (Blok {w.blok}-{w.noRumah})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setCorrectionWargaInfo(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={saveCorrection}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/10 cursor-pointer active:scale-97 transition refinement-button"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Simpan Koreksi Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rombong Correction Modal */}
      {correctionRombongInfo && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setCorrectionRombongInfo(null)}
              className="absolute top-4 right-4 text-slate-455 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-105 transition"
              title="Batal"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="font-extrabold text-sky-600 text-base mb-2 flex items-center gap-2 font-sans">
              <Settings className="w-5 h-5 text-sky-600" />
              Koreksi &amp; Edit Sewa Rombong
            </h4>
            <p className="text-slate-655 text-sm mb-4 leading-relaxed font-sans">
              Mengedit catatan sewa <strong className="text-slate-950">Iuran Rombong</strong> bulan <strong className="text-slate-950">{correctionRombongInfo.bulan}</strong> untuk pemilik <strong className="text-slate-950">{correctionRombongInfo.rombong.namaPemilik}</strong> ({correctionRombongInfo.rombong.noLapak}).
            </p>

            <div className="border-b border-dashed border-slate-200 my-4"></div>

            <div className="space-y-4">
              {/* Option 1: Basic Status Adjustment */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-150 space-y-3">
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-widest font-mono">1. Ubah Informasi Lapak Rombong Ini</div>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Status Sewa</label>
                  <select
                    value={corrRombongStatusLunas ? 'true' : 'false'}
                    onChange={(e) => setCorrRombongStatusLunas(e.target.value === 'true')}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
                  >
                    <option value="true">Lunas (Selesai Dibayar)</option>
                    <option value="false">Belum Lunas (Batalkan Sewa)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2.5 pt-1.5 pb-1">
                  <input
                    type="checkbox"
                    id="corrRombongNoCashFlow"
                    checked={corrRombongNoCashFlow}
                    onChange={(e) => setCorrRombongNoCashFlow(e.target.checked)}
                    className="w-4 h-4 text-sky-600 border-slate-300 rounded focus:ring-sky-500 cursor-pointer"
                  />
                  <label htmlFor="corrRombongNoCashFlow" className="text-xs font-semibold text-slate-700 cursor-pointer select-none leading-none">
                    Koreksi Administratif (Tanpa Aliran Kas Baru / Pendapatan)
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">
                    Catatan Khusus (Koreksi / Bukti Pendukung)
                  </label>
                  <textarea
                    rows={2}
                    value={corrRombongCatatan}
                    onChange={(e) => setCorrRombongCatatan(e.target.value)}
                    placeholder="Contoh: Sudah bayar sejak sebelum aplikasi terbit, penyesuaian khusus lunas/belum lunas..."
                    className="w-full bg-white border border-slate-200 rounded-xl p-2 font-sans text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                </div>

                {corrRombongStatusLunas && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Nominal Sewa (Rp)</label>
                        <input
                          type="number"
                          value={corrRombongNominal}
                          onChange={(e) => setCorrRombongNominal(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Periode Tahun</label>
                        <select
                          value={corrRombongTahun}
                          onChange={(e) => setCorrRombongTahun(Number(e.target.value))}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                        >
                          <option value="2025">Tahun 2025</option>
                          <option value="2026">Tahun 2026</option>
                          <option value="2027">Tahun 2027</option>
                          <option value="2028">Tahun 2028</option>
                          <option value="2029">Tahun 2029</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Akun Kas Pembukuan terkait</label>
                      <select
                        value={corrRombongTargetKas}
                        onChange={(e) => setCorrRombongTargetKas(e.target.value as keyof Balance)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                      >
                        <option value="rombongTunai">[Rombong] Tunai Rombong</option>
                        <option value="rombongBank">[Rombong] Bank Rombong</option>
                        <option value="rtBank">[RT] Bank RT</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Tanggal Pembayaran</label>
                        <input
                          type="date"
                          value={corrPaymentDate}
                          onChange={(e) => setCorrPaymentDate(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1 font-sans">Jam Pembayaran</label>
                        <input
                          type="time"
                          value={corrPaymentTime}
                          onChange={(e) => setCorrPaymentTime(e.target.value)}
                          className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Option 2: Salah Centang Rombong */}
              <div className="bg-amber-50/50 p-4 rounded-2xl border border-amber-150 space-y-3">
                <div className="text-[11px] font-extrabold text-amber-700 uppercase tracking-widest font-mono flex items-center gap-1">
                  💡 2. Pindahkan Pembayaran (Salah Centang Lapak Rombong)
                </div>
                <p className="text-xs text-slate-600 leading-normal font-sans">
                  Jika Anda salah klik/salah centang nama lapak rombong, pilih lapak/pemilik yang seharusnya di bawah ini. Catatan sewa lunas akan dipindahkan ke lapak yang baru.
                </p>
                <div>
                  <label className="block text-xs font-semibold text-slate-655 mb-1 font-sans">Lapak Penerima Sebenarnya</label>
                  <select
                    value={corrTransferTargetRombongId}
                    onChange={(e) => setCorrTransferTargetRombongId(e.target.value)}
                    className="w-full bg-white border border-amber-200 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-amber-500 font-sans"
                  >
                    <option value="">-- Tetap pada lapak ini (Jangan dipindahkan) --</option>
                    {rombongList.filter(r => r.id !== correctionRombongInfo.rombong.id).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.namaPemilik} ({r.noLapak} - {r.lokasi})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2 border-t border-slate-100">
                <button 
                  onClick={() => setCorrectionRombongInfo(null)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold transition cursor-pointer"
                >
                  Batal
                </button>
                <button 
                  onClick={saveRombongCorrection}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/10 cursor-pointer active:scale-97 transition refinement-button"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  Simpan Koreksi Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Bill Sharing Drawer / Modal (Warga) */}
      {selectedWargaForWhatsApp && (
        <div className="bg-white border-2 border-emerald-250 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-250 text-slate-800">
          <button 
            onClick={() => setSelectedWargaForWhatsApp(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">Generate Tagihan WhatsApp (Warga)</h4>
              <p className="text-xs text-slate-500">Draft tagihan bulanan untuk {selectedWargaForWhatsApp.nama}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">
              Nomor WhatsApp Warga (Opsional, gunakan awalan 08 / 62)
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="cth: 08123456789 atau kosongkan"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-205 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * Jika dikosongkan, WhatsApp akan meminta Anda memilih kontak setelah aplikasi WhatsApp terbuka.
            </p>
          </div>

          <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-xs text-slate-700">
            <p className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">Opsi Konten Pesan WA:</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={waIncludeCurrent} 
                  onChange={(e) => setWaIncludeCurrent(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-400 border-slate-300 rounded cursor-pointer mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-800">Tagihan Bulan Ini (Current)</span>
                  <p className="text-[10px] text-slate-500">Iuran bulan aktif berjalan</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={waIncludeArrears} 
                  onChange={(e) => setWaIncludeArrears(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-400 border-slate-300 rounded cursor-pointer mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-800">Tunggakan Sebelumnya (Arrears)</span>
                  <p className="text-[10px] text-slate-500">Tunggakan bulan/tahun sebelumnya jika ada</p>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Preview Pesan Tagihan:</label>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-line text-slate-700 leading-relaxed scrollbar">
              {getWhatsAppMessageText(selectedWargaForWhatsApp)}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                setSelectedWargaForWhatsApp(null);
                setTargetPhone('');
              }}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
            <button 
              onClick={() => handleOpenWhatsAppLink(selectedWargaForWhatsApp)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim via WhatsApp
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* WhatsApp Bill Sharing Drawer / Modal (Rombong) */}
      {selectedRombongForWhatsApp && (
        <div className="bg-white border-2 border-emerald-250 rounded-2xl p-6 shadow-xl relative animate-in zoom-in-95 duration-250 text-slate-800">
          <button 
            onClick={() => setSelectedRombongForWhatsApp(null)}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-2 mb-3">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-slate-900 text-base">Generate Tagihan WhatsApp (Rombong)</h4>
              <p className="text-xs text-slate-500">Draft rincian sewa & iuran untuk {selectedRombongForWhatsApp.namaPemilik}</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">
              Nomor WhatsApp Penyewa (Opsional, gunakan 08 / 62)
            </label>
            <div className="flex gap-2">
              <input 
                type="text"
                placeholder="cth: 08987654321 atau kosongkan"
                value={targetPhone}
                onChange={(e) => setTargetPhone(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-205 rounded-xl px-3.5 py-2 text-sm text-slate-900 focus:ring-1 focus:ring-emerald-500 focus:outline-none font-mono"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              * Jika dikosongkan, WhatsApp akan meminta Anda memilih kontak setelah aplikasi WhatsApp terbuka.
            </p>
          </div>

          <div className="mb-4 bg-slate-50 border border-slate-200 p-3 rounded-xl space-y-2.5 shadow-xs text-slate-700">
            <p className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider font-mono">Opsi Konten Pesan WA:</p>
            <div className="flex flex-col sm:flex-row gap-4">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={waIncludeCurrent} 
                  onChange={(e) => setWaIncludeCurrent(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-400 border-slate-300 rounded cursor-pointer mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-800">Tagihan Bulan Ini (Current)</span>
                  <p className="text-[10px] text-slate-500">Iuran bulan aktif berjalan</p>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs select-none">
                <input 
                  type="checkbox" 
                  checked={waIncludeArrears} 
                  onChange={(e) => setWaIncludeArrears(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-400 border-slate-300 rounded cursor-pointer mt-0.5 accent-emerald-600"
                />
                <div>
                  <span className="font-bold text-slate-800">Tunggakan Sebelumnya (Arrears)</span>
                  <p className="text-[10px] text-slate-500">Tunggakan bulan/tahun sebelumnya jika ada</p>
                </div>
              </label>
            </div>
          </div>

          <div className="mb-5">
            <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Preview Pesan Tagihan:</label>
            <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 text-xs font-mono max-h-48 overflow-y-auto whitespace-pre-line text-slate-700 leading-relaxed scrollbar">
              {getWhatsAppRombongMessageText(selectedRombongForWhatsApp)}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <button 
              onClick={() => {
                setSelectedRombongForWhatsApp(null);
                setTargetPhone('');
              }}
              className="px-4 py-2.5 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-semibold transition cursor-pointer"
            >
              Tutup
            </button>
            <button 
              onClick={() => handleOpenWhatsAppRombongLink(selectedRombongForWhatsApp)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/10 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              Kirim via WhatsApp
              <ExternalLink className="w-3 h-3 ml-0.5" />
            </button>
          </div>
        </div>
      )}

      {/* --- ANNUAL BOOKKEEPING & PAYMENT HISTORY (CITIZEN - WARGA) --- */}
      {selectedWargaHistory && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                setSelectedWargaHistory(null);
                setHistoryYear(2026);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header profile info */}
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4 shrink-0">
              {selectedWargaHistory.fotoBase64 ? (
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                    <img src={selectedWargaHistory.fotoBase64} alt="Foto Profil" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9.5px]/none text-slate-500 font-mono font-bold mt-1 bg-slate-50 border border-slate-150 px-1 py-0.5 rounded-sm">
                    {formatFileSize(getBase64SizeInBytes(selectedWargaHistory.fotoBase64))}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-sky-50 text-sky-600 rounded-2xl border border-sky-100 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm md:text-base">Buku Registry & Tagihan Tahunan</h4>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">{selectedWargaHistory.nama}</div>
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-1">
                  <Home className="w-3.5 h-3.5 text-sky-550 shrink-0" />
                  Blok {selectedWargaHistory.blok} No. {selectedWargaHistory.noRumah} — RT 08 Perumtas 3
                </div>
                {selectedWargaHistory.statusRumah === 'sewa_kontrak' ? (
                  <div className="flex flex-col gap-1.5">
                    <div className="text-xs text-amber-600 font-extrabold font-sans flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-amber-50 rounded-lg w-fit border border-amber-200/50">
                      <span>🏠 Status Rumah: Sewa / Kontrak</span>
                    </div>
                    {(selectedWargaHistory.tglAwalSewa || selectedWargaHistory.tglAkhirSewa) && (
                      <div className="text-[10.5px] text-amber-750 font-bold font-mono px-2 py-1 bg-amber-50/70 rounded-lg w-fit border border-amber-200/35">
                        <span>📅 Periode Sewa: {selectedWargaHistory.tglAwalSewa || '-'} s/d {selectedWargaHistory.tglAkhirSewa || '-'}</span>
                      </div>
                    )}
                  </div>
                ) : selectedWargaHistory.statusRumah === 'lainnya' ? (
                  <div className="text-xs text-slate-600 font-semibold font-sans flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-slate-100 rounded-lg w-fit border border-slate-200/50">
                    <span>🏠 Status Rumah: Lainnya / Menumpang</span>
                  </div>
                ) : (
                  <div className="text-xs text-sky-600 font-extrabold font-sans flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-sky-50 rounded-lg w-fit border border-sky-150/50">
                    <span>🏠 Status Rumah: Milik Sendiri (Tidak Sewa)</span>
                  </div>
                )}
                {selectedWargaHistory.noWa && (
                  <div className="text-xs text-emerald-600 font-semibold font-mono flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-50 rounded-lg w-fit border border-emerald-100/50">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 block bg-emerald-500 animate-ping"></span>
                    <span>No. WA Penagihan: {selectedWargaHistory.noWa}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable contents */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 scrollbar select-none">
              
              {/* Inactive Attention Banner */}
              {isWargaInactive && (
                <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3.5 shadow-xs text-left">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5 shrink-0">
                      <ShieldAlert className="w-5 h-5 animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider font-sans">
                        Pemberitahuan: Akun Hunian Ditangguhkan (Frozen)
                      </h5>
                      <p className="text-[11px] text-amber-900 leading-relaxed font-semibold mt-0.5">
                        Warga ini berstatus <strong className="font-mono bg-amber-100/60 px-1 py-0.5 rounded text-amber-950 font-bold">{selectedWargaHistory.statusKeaktifan === 'nonaktif' ? '❌ Nonaktif / Arsip' : '🚚 Pindah Sementara'}</strong>. 
                        Pembayaran dan koreksi iuran bulanan dibekukan. {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') ? 'Klik tanda gerigi ⚙️ di samping nama warga di atas untuk mengaktifkan kembali.' : 'Hubungi pengurus RT untuk mengaktifkan kembali.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Year options selector bar & Monthly filter buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center bg-slate-50 p-2.5 rounded-2xl border border-slate-150">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600 pl-1">Tahun Buku:</span>
                  <div className="flex gap-1 text-slate-800">
                    {yearsList.map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setHistoryYear(yr);
                          setIsBatchEdit(false);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                          historyYear === yr
                            ? 'bg-sky-600 text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200 bg-white border border-slate-200'
                        }`}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap justify-between text-slate-800">
                  <span className="text-xs font-bold text-slate-600 pl-1">Format Preview:</span>
                  <div className="bg-white border border-slate-200 p-0.5 rounded-xl flex">
                    <button
                      onClick={() => setPreviewOnlyCurrentMonth(true)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-extrabold font-sans transition shrink-0 cursor-pointer ${
                        previewOnlyCurrentMonth
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-550 hover:bg-slate-100'
                      }`}
                    >
                      Bulan Ini Saja
                    </button>
                    <button
                      onClick={() => setPreviewOnlyCurrentMonth(false)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-extrabold font-sans transition shrink-0 cursor-pointer ${
                        !previewOnlyCurrentMonth
                          ? 'bg-sky-600 text-white'
                          : 'text-slate-550 hover:bg-slate-100'
                      }`}
                    >
                      Semua Bulan
                    </button>
                  </div>
                </div>
              </div>

              {/* Annual statistics summary block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Terbayar ({historyYear})</div>
                  <div className="text-[10px] text-slate-400 font-medium">Iuran RT Selesai</div>
                  <div className="text-lg font-black font-mono text-emerald-800 mt-1">
                    Rp {selectedWargaHistory.iuranRT
                      .filter(b => b.lunas && (b.tahun === historyYear || (!b.tahun && historyYear === 2026)))
                      .reduce((sum, b) => sum + b.nominal, 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/45 border border-amber-100 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">Tunggakan ({historyYear})</div>
                    <div className="text-[10px] text-slate-400 font-medium font-mono">Tahun {historyYear}</div>
                    <div className="text-lg font-black font-mono text-amber-850 mt-1">
                      Rp {(() => {
                        let totalTunggakan = 0;
                        fullMonths.forEach(m => {
                          const shortM = m.slice(0, 3);
                          const slot = selectedWargaHistory.iuranRT.find(b => 
                            b.lunas &&
                            (b.tahun === historyYear || (!b.tahun && historyYear === 2026)) &&
                            (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
                          );
                          if (!slot && isMonthDue(m, historyYear)) {
                            totalTunggakan += getDefaultRtRate(historyYear, m, rateRT);
                          }
                        });
                        return totalTunggakan;
                      })().toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-amber-200/40 text-[9px] text-amber-805 leading-relaxed font-medium italic">
                    Tunggakan iuran RT adalah keterlambatan atau kelalaian warga dalam membayarkan iuran bulanan dalam waktu bulan berjalan
                  </div>
                </div>
              </div>

              {/* Berkas & Identitas Legalitas Warga (KTP & KK) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4.5 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/65 pb-2.5">
                  <h5 className="text-xs font-extrabold text-slate-700 uppercase flex items-center gap-2 font-mono tracking-wider">
                    <FileText className="w-4 h-4 text-slate-500" />
                    Berkas Identitas & Alamat Asal KTP
                  </h5>
                  <button
                    onClick={() => exportWargaData(selectedWargaHistory)}
                    className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-black px-3.5 py-1.5 rounded-xl transition cursor-pointer shadow-xs font-mono uppercase shrink-0"
                    title="Cetak Berkas Dossier Warga"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Cetak Dossier / PDF
                  </button>
                </div>

                {/* Alamat Asal KTP & Status Wilayah */}
                <div className="bg-white border border-slate-200 rounded-xl p-3.5 shadow-xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">Alamat Asal Resmi (Sesuai KTP)</span>
                    {selectedWargaHistory.alamatKtpAsal || selectedWargaHistory.noKtp ? (
                      (() => {
                        const isLokal = (selectedWargaHistory.noKtp?.startsWith('3515')) || 
                                        (selectedWargaHistory.alamatKtpAsal ? /sidoarjo/i.test(selectedWargaHistory.alamatKtpAsal) : false);
                        return isLokal ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-emerald-200 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            KTP LOKAL (SIDOARJO)
                          </span>
                        ) : (
                          <span className="bg-amber-50 text-amber-700 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-amber-200 flex items-center gap-1 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                            KTP LUAR DAERAH
                          </span>
                        );
                      })()
                    ) : (
                      <span className="bg-slate-50 text-slate-400 text-[10px] font-extrabold px-2 py-0.5 rounded-md border border-slate-200/60 font-mono">
                        BELUM DIISI
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold text-slate-800">
                    {selectedWargaHistory.alamatKtpAsal || (
                      <span className="text-slate-400 italic text-xs font-normal">Alamat lengkap asal KTP belum diisi. Silakan edit informasi warga jika diperlukan.</span>
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div className="space-y-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">No. KTP (NIK)</span>
                    <strong className="text-sm font-black text-slate-900 font-mono tracking-wide">
                      {selectedWargaHistory.noKtp ? selectedWargaHistory.noKtp.replace(/(\d{4})/g, '$1 ').trim() : 'Belum Diisi'}
                    </strong>
                    <div className="mt-2 text-xs text-slate-600">
                      {selectedWargaHistory.ktpBase64 ? (
                        <div className="space-y-2">
                          <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative group">
                            <img src={selectedWargaHistory.ktpBase64} alt="KTP Scan" className="w-full h-full object-cover transition group-hover:scale-105" />
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 py-1 flex items-center justify-center transition duration-200">
                              <button 
                                onClick={() => setDocumentPreviewUrl({ url: selectedWargaHistory.ktpBase64!, title: `KTP - ${selectedWargaHistory.nama}` })}
                                className="text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-white" />
                                Memperbesar
                              </button>
                            </div>
                          </div>
                           <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                            <span className="text-slate-500 truncate max-w-[150px]" title={selectedWargaHistory.ktpNamaFile || 'Foto_KTP.jpg'}>
                              {selectedWargaHistory.ktpNamaFile || 'Foto_KTP.jpg'} ({formatFileSize(getBase64SizeInBytes(selectedWargaHistory.ktpBase64))})
                            </span>
                            <a 
                              href={selectedWargaHistory.ktpBase64} 
                              download={selectedWargaHistory.ktpNamaFile || `KTP_${selectedWargaHistory.nama}.jpg`}
                              className="text-sky-600 hover:text-sky-800 flex items-center gap-0.5"
                            >
                              <Download className="w-3 h-3" />
                              Unduh
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs italic bg-slate-50/50">
                          Buku arsip KTP belum diunggah.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1 bg-white border border-slate-200 rounded-xl p-3 shadow-xs">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono block">No. Kartu Keluarga (KK)</span>
                    <strong className="text-sm font-black text-slate-900 font-mono tracking-wide">
                      {selectedWargaHistory.noKk ? selectedWargaHistory.noKk.replace(/(\d{4})/g, '$1 ').trim() : 'Belum Diisi'}
                    </strong>
                    <div className="mt-2 text-xs text-slate-600">
                      {selectedWargaHistory.kkBase64 ? (
                        <div className="space-y-2">
                          <div className="w-full h-24 bg-slate-100 rounded-lg border border-slate-200 overflow-hidden relative group">
                            <img src={selectedWargaHistory.kkBase64} alt="KK Scan" className="w-full h-full object-cover transition group-hover:scale-105" />
                            <div className="absolute inset-x-0 bottom-0 bg-slate-950/70 py-1 flex items-center justify-center transition duration-200">
                              <button 
                                onClick={() => setDocumentPreviewUrl({ url: selectedWargaHistory.kkBase64!, title: `Kartu Keluarga - ${selectedWargaHistory.nama}` })}
                                className="text-white text-[10px] font-extrabold flex items-center gap-1 cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-white" />
                                Memperbesar
                              </button>
                            </div>
                          </div>
                           <div className="flex items-center justify-between text-[11px] font-bold font-mono">
                            <span className="text-slate-500 truncate max-w-[150px]" title={selectedWargaHistory.kkNamaFile || 'Foto_KK.jpg'}>
                              {selectedWargaHistory.kkNamaFile || 'Foto_KK.jpg'} ({formatFileSize(getBase64SizeInBytes(selectedWargaHistory.kkBase64))})
                            </span>
                            <a 
                              href={selectedWargaHistory.kkBase64} 
                              download={selectedWargaHistory.kkNamaFile || `KK_${selectedWargaHistory.nama}.jpg`}
                              className="text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5"
                            >
                              <Download className="w-3 h-3" />
                              Unduh
                            </a>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 border border-dashed border-slate-200 rounded-lg text-center text-slate-400 text-xs italic bg-slate-50/50">
                          Buku arsip KK belum diunggah.
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Anggota Keluarga Serumah Panel */}
                <div className="bg-slate-50/80 rounded-2xl border border-slate-150 p-4 mt-4">
                  <h5 className="text-xs font-extrabold text-slate-700 font-sans uppercase mb-2.5 flex items-center gap-1.5 font-mono tracking-wider">
                    <Users className="w-4 h-4 text-sky-500" />
                    Anggota Keluarga Serumah ({selectedWargaHistory.anggotaKeluarga?.length || 0})
                  </h5>
                  
                  {!selectedWargaHistory.anggotaKeluarga || selectedWargaHistory.anggotaKeluarga.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic bg-white p-3 rounded-xl border border-slate-100">
                      Belum ada anggota keluarga terdaftar tinggal di rumah ini.
                    </p>
                  ) : (
                    <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-0.5">
                      {selectedWargaHistory.anggotaKeluarga.map((member, i) => (
                        <div key={member.id || i} className="bg-white border border-slate-150/75 rounded-xl p-2.5 flex justify-between items-center text-xs">
                          <div>
                            <div className="font-extrabold text-slate-800">{member.nama}</div>
                            <div className="flex flex-wrap gap-2 text-[9.5px] text-slate-500 font-semibold mt-0.5">
                              <span>Hubungan: <span className="text-slate-700 font-extrabold">{member.hubungan}</span></span>
                              {member.nik && <span>• NIK: <span className="font-mono text-slate-600">{member.nik}</span></span>}
                              {member.noHape && <span>• WA: <span className="font-mono text-emerald-600">{member.noHape}</span></span>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {!selectedWargaHistory.ktpBase64 && !selectedWargaHistory.kkBase64 && isWargaOfficer && (
                  <p className="text-[10px] text-amber-600 font-medium italic mt-2 text-center">
                    Petunjuk: Anda dapat mengunggah berkas KTP & KK ini dengan mengklik tombol "Edit" pada baris data warga di tabel utama.
                  </p>
                )}
              </div>

              {/* 12 Months layout grid */}
              <div className="space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-2">
                  <h5 className="text-xs font-extrabold text-slate-700 font-sans uppercase flex items-center gap-1.5 font-mono tracking-wider">
                    <Calendar className="w-4 h-4 text-slate-500" />
                    Lembar Buku Tagihan {previewOnlyCurrentMonth && !isBatchEdit ? 'Bulan Ini' : 'Setahun'}
                  </h5>
                  
                  {isLoggedIn && currentUser?.role === 'admin' && !isWargaInactive && (
                    <button
                      onClick={() => {
                        const initialStatus: {[key: string]: boolean} = {};
                        fullMonths.forEach(m => {
                          const shortM = m.slice(0, 3);
                          const slot = selectedWargaHistory.iuranRT.find(b => 
                            (b.tahun === historyYear || (!b.tahun && historyYear === 2026)) &&
                            (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
                          );
                          initialStatus[m] = slot ? slot.lunas : false;
                        });
                        setBatchMonthsPaidStatus(initialStatus);
                        setIsBatchEdit(!isBatchEdit);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10.5px] font-black tracking-wide transition cursor-pointer select-none border font-sans uppercase shrink-0 ${
                        isBatchEdit
                          ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100'
                          : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100 shadow-xs'
                      }`}
                    >
                      {isBatchEdit ? (
                        <>✕ Batalkan Koreksi</>
                      ) : (
                        <>⚡ Koreksi Cepat Sekaligus</>
                      )}
                    </button>
                  )}
                </div>

                {isBatchEdit && (
                  <div className="bg-sky-50 border border-sky-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3.5 shadow-xs">
                    <div className="text-left w-full sm:w-auto">
                      <h6 className="text-[10px] font-bold text-sky-700 uppercase tracking-widest font-mono">Mode Koreksi Cepat Aktif ({historyYear})</h6>
                      <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-semibold">
                        Klik iuran bulan di bawah untuk mencentang/menghapus status bayar, lalu klik Simpan.
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto justify-end">
                      <button
                        onClick={() => {
                          const allLunasStatus: {[key: string]: boolean} = {};
                          fullMonths.forEach(m => {
                            allLunasStatus[m] = true;
                          });
                          setBatchMonthsPaidStatus(allLunasStatus);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition active:scale-95"
                      >
                        Lunas Semua
                      </button>
                      <button
                        onClick={() => {
                          const allBelumStatus: {[key: string]: boolean} = {};
                          fullMonths.forEach(m => {
                            allBelumStatus[m] = false;
                          });
                          setBatchMonthsPaidStatus(allBelumStatus);
                        }}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-[10px] font-black uppercase tracking-wider cursor-pointer transition active:scale-95"
                      >
                        Batal Semua
                      </button>
                      <button
                        onClick={handleSaveBatchCorrection}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-[10px] font-black uppercase tracking-wider shadow-sm cursor-pointer transition active:scale-95 flex items-center gap-1"
                      >
                        💾 Simpan
                      </button>
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {fullMonths
                    .filter((IndoMonth) => {
                      if (isBatchEdit) return true;
                      if (!previewOnlyCurrentMonth) return true;
                      const curMonthIndex = new Date().getMonth();
                      const curMonthName = fullMonths[curMonthIndex] || 'Juni';
                      return IndoMonth.toLowerCase() === curMonthName.toLowerCase();
                    })
                    .map((IndoMonth) => {
                      const idx = fullMonths.indexOf(IndoMonth);
                      const shortMonth = IndoMonth.slice(0, 3);
                      
                      const matchedSlot = selectedWargaHistory.iuranRT.find(
                        slot => (slot.tahun === historyYear || (!slot.tahun && historyYear === 2026)) &&
                                (slot.bulan.toLowerCase() === IndoMonth.toLowerCase() || 
                                 slot.bulan.toLowerCase() === shortMonth.toLowerCase())
                      );

                      const isLunas = matchedSlot ? matchedSlot.lunas : false;
                      const nominalValue = matchedSlot ? matchedSlot.nominal : getDefaultRtRate(historyYear, IndoMonth, rateRT);
                      const displayBulan = matchedSlot ? matchedSlot.bulan : IndoMonth;

                      if (isBatchEdit) {
                        const isLunasBatch = batchMonthsPaidStatus[IndoMonth];
                        return (
                          <div 
                            key={IndoMonth}
                            onClick={() => {
                              setBatchMonthsPaidStatus(prev => ({
                                ...prev,
                                [IndoMonth]: !prev[IndoMonth]
                              }));
                            }}
                            className={`p-3 rounded-xl border flex items-center justify-between min-h-[4.5rem] h-auto cursor-pointer transition duration-150 select-none ${
                              isLunasBatch
                                ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                                : 'bg-amber-50/20 border-amber-200 hover:border-amber-300'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input 
                                type="checkbox"
                                checked={isLunasBatch}
                                onChange={() => {}} // click handled by parent div
                                className="w-4 h-4 text-sky-600 rounded-sm border-slate-300 focus:ring-sky-500 cursor-pointer shrink-0"
                              />
                              <div className="flex flex-col text-left">
                                <span className="text-xs font-extrabold text-slate-850">{IndoMonth}</span>
                                <span className="text-[9.5px] font-mono font-medium text-slate-500 mt-0.5">Rp {nominalValue.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                            
                            <span className={`text-[8.5px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md border leading-none shrink-0 ${
                              isLunasBatch ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-amber-100/50 text-amber-600 border-amber-150'
                            }`}>
                              {isLunasBatch ? 'Lunas' : 'Belum'}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div 
                          key={IndoMonth}
                          className={`p-3 rounded-xl border flex flex-col justify-between min-h-[5.5rem] h-auto pb-1.5 transition duration-150 ${
                            isLunas
                              ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-350/20 shadow-sm'
                              : 'bg-amber-50/30 border-amber-200'
                          }`}
                        >
                          <div>
                            <div className="flex justify-between items-start">
                              <span className={`text-xs font-extrabold ${isLunas ? 'text-emerald-900 font-black' : 'text-slate-705'}`}>{IndoMonth}</span>
                              <span className="text-[9px] text-slate-400 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                            </div>
                            {matchedSlot?.catatan && (
                              <div className="text-[9px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md mt-1.5 italic font-sans break-words border border-sky-100 text-left" title={matchedSlot.catatan}>
                                📝 {matchedSlot.catatan}
                              </div>
                            )}
                          </div>

                          <div className="mt-1 flex justify-between items-end bg-transparent">
                            <div className={`text-[10px] font-mono self-end ${isLunas ? 'text-emerald-705 font-bold' : 'text-slate-500'}`}>
                              Rp {nominalValue.toLocaleString('id-ID')}
                            </div>
                            
                            {/* Payment status badge */}
                            {isLunas ? (
                              <div className="flex flex-col items-end gap-0.5 bg-transparent">
                                <span className="text-[9.5px] text-white bg-emerald-600 border border-emerald-750/10 px-2 py-0.5 rounded-md font-black flex items-center gap-0.5 whitespace-nowrap shadow-xs uppercase tracking-wider">
                                  Lunas ✓
                                </span>
                                {matchedSlot?.tanggalBayar && (
                                  <span className="text-[7.5px] text-slate-500 font-mono text-right leading-none scale-[0.9] origin-right">
                                    {(() => {
                                      const p = matchedSlot.tanggalBayar.split('-');
                                      const datePart = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : matchedSlot.tanggalBayar;
                                      return matchedSlot.jamBayar ? `${datePart} ${matchedSlot.jamBayar}` : datePart;
                                    })()}
                                  </span>
                                )}
                                {matchedSlot?.fotoBase64 && (
                                  <button
                                    onClick={() => setDocumentPreviewUrl({ url: matchedSlot.fotoBase64!, title: `Bukti Bayar RT - ${displayBulan} ${historyYear} - ${selectedWargaHistory.nama}` })}
                                    className="text-[9px] text-emerald-600 hover:text-emerald-800 font-bold hover:underline cursor-pointer active:scale-95 leading-none mt-1 flex items-center gap-0.5"
                                  >
                                    <Receipt className="w-2.5 h-2.5 pointer-events-none" /> Lihat Bukti ({formatFileSize(getBase64SizeInBytes(matchedSlot.fotoBase64))})
                                  </button>
                                )}
                                {isLoggedIn && currentUser?.role === 'admin' && !isWargaInactive && (
                                  <button
                                    onClick={() => {
                                      openCorrectionModal(selectedWargaHistory, 'Iuran RT', displayBulan, nominalValue, 'iuranRT', historyYear);
                                    }}
                                    className="text-[9px] text-sky-600 hover:text-sky-850 font-bold hover:underline cursor-pointer active:scale-95 leading-none mt-1"
                                  >
                                    Koreksi ⚙
                                  </button>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-end gap-1 font-sans">
                                {isWargaOfficer && !isWargaInactive ? (
                                  <button
                                    onClick={() => {
                                      openPaymentModal(selectedWargaHistory, 'Iuran RT', displayBulan, nominalValue, 'iuranRT', historyYear);
                                    }}
                                    className="text-[10px] font-extrabold px-1.5 py-0.5 rounded transition bg-amber-100 hover:bg-amber-250 text-amber-700 cursor-pointer active:scale-95 text-center leading-none"
                                  >
                                    Bayar ❯
                                  </button>
                                ) : (
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50/70 text-amber-600 border border-amber-100/50 select-none text-right">
                                    Belum Lunas
                                  </span>
                                )}
                                {isLoggedIn && currentUser?.role === 'admin' && !isWargaInactive && (
                                  <button
                                    onClick={() => {
                                      openCorrectionModal(selectedWargaHistory, 'Iuran RT', displayBulan, nominalValue, 'iuranRT', historyYear);
                                    }}
                                    className="text-[9px] text-sky-600 hover:text-sky-850 font-bold hover:underline cursor-pointer active:scale-95 leading-none mt-1"
                                  >
                                    Koreksi ⚙
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Payment History timeline search match of ledger */}
              <div>
                <h5 className="text-xs font-extrabold text-slate-750 font-mono uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                  <Clock className="w-4 h-4 text-sky-600" />
                  Riwayat Transaksi Kas Warga ({historyYear})
                </h5>
                
                {(() => {
                  const matchingTxs = filterLedgerForWarga(selectedWargaHistory, historyYear);
                  if (matchingTxs.length === 0) {
                    return (
                      <div className="p-6 text-center bg-slate-55 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-500 font-bold">Belum ada rincian riwayat transaksi kas tercatat di Buku Kas RT untuk tahun {historyYear}.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-slate-50/50 border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                      {matchingTxs.map((tx) => (
                        <div key={tx.id} className="p-3.5 flex justify-between items-center hover:bg-slate-100/50 transition">
                          <div>
                            <div className="text-xs font-extrabold text-slate-800 leading-snug">{tx.deskripsi}</div>
                            <div className="text-[10px] text-slate-450 font-mono mt-0.5">
                              Tanggal: {tx.tanggal} • Kas: <span className="text-slate-555 font-bold">{tx.sumberKas}</span> • Oleh: {tx.petugas}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100/70 px-2 py-1 rounded-lg">
                              + Rp {tx.jumlah.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 italic">
                * Sinkronisasi data real-time dengan Buku Kas & Keamanan RT
              </span>
              <div className="flex gap-2">
                {isWargaOfficer && (
                  <button
                    onClick={() => {
                      const rawMsg = getWhatsAppHistoryMessageText(selectedWargaHistory, historyYear);
                      const cleanedPhone = (selectedWargaHistory.noWa || '').replace(/\D/g, '');
                      let formattedPhone = cleanedPhone;
                      if (formattedPhone.startsWith('0')) {
                        formattedPhone = '62' + formattedPhone.slice(1);
                      }
                      const finalUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMsg)}`;
                      window.open(finalUrl, '_blank');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition cursor-pointer active:scale-97"
                    title="Kirim Catatan Buku Tagihan per Warga ini ke WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim Buku Ke WA</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedWargaHistory(null);
                    setHistoryYear(2026);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup Buku
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- ANNUAL BOOKKEEPING & PAYMENT HISTORY (ROMBONG - LAPAK SEWA) --- */}
      {selectedRombongHistory && (
        <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-h-[90vh] flex flex-col">
            <button 
              onClick={() => {
                setSelectedRombongHistory(null);
                setHistoryYear(2026);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header profile info */}
            <div className="flex items-start gap-3 border-b border-slate-100 pb-4 shrink-0">
              {selectedRombongHistory.fotoBase64 ? (
                <div className="flex flex-col items-center shrink-0">
                  <div className="w-14 h-14 rounded-2xl border border-slate-200 shadow-sm overflow-hidden shrink-0">
                    <img src={selectedRombongHistory.fotoBase64} alt="Foto Lapak" className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[9.5px]/none text-slate-500 font-mono font-bold mt-1 bg-slate-50 border border-slate-150 px-1 py-0.5 rounded-sm">
                    {formatFileSize(getBase64SizeInBytes(selectedRombongHistory.fotoBase64))}
                  </span>
                </div>
              ) : (
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-105 shrink-0">
                  <BookOpen className="w-6 h-6" />
                </div>
              )}
              <div>
                <h4 className="font-extrabold text-slate-900 text-sm md:text-base">Buku Registry & Riwayat Rombong</h4>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">{selectedRombongHistory.namaPemilik}</div>
                <div className="text-xs text-slate-500 font-mono flex items-center gap-1 mt-1">
                  <Store className="w-3.5 h-3.5 text-emerald-650 shrink-0" />
                  {selectedRombongHistory.noLapak} • {selectedRombongHistory.lokasi} • Kuliner RT 08
                </div>
                {selectedRombongHistory.noWa && (
                  <div className="text-xs text-emerald-600 font-semibold font-mono flex items-center gap-1 mt-1.5 px-2 py-0.5 bg-emerald-50 rounded-lg w-fit border border-emerald-100/50">
                    <span className="w-1.5 h-1.5 rounded-full shrink-0 block bg-emerald-500 animate-ping"></span>
                    <span>No. WA Penagihan: {selectedRombongHistory.noWa}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Scrollable contents */}
            <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1 scrollbar select-none">
              
              {/* Inactive Attention Banner for Rombong */}
              {isRombongInactive && (
                <div className="bg-amber-50 border border-amber-250 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3.5 shadow-xs text-left">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-amber-100 text-amber-700 rounded-xl mt-0.5 shrink-0">
                      <ShieldAlert className="w-5 h-5 animate-bounce" style={{ animationDuration: '2s' }} />
                    </div>
                    <div>
                      <h5 className="text-xs font-extrabold text-amber-800 uppercase tracking-wider font-sans">
                        Pemberitahuan: Akun Lapak Ditangguhkan (Frozen)
                      </h5>
                      <p className="text-[11px] text-amber-900 leading-relaxed font-semibold mt-0.5">
                        Lapak Rombong ini berstatus <strong className="font-mono bg-amber-100/60 px-1 py-0.5 rounded text-amber-950 font-bold">{selectedRombongHistory.statusKeaktifan === 'nonaktif' ? '❌ Nonaktif / Arsip' : '🚚 Pindah Sementara'}</strong>. 
                        Pembayaran dan koreksi sewa dibekukan. {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') ? 'Klik tanda gerigi ⚙️ di samping nama lapak di atas untuk mengaktifkan kembali.' : 'Hubungi pengurus RT untuk mengaktifkan kembali.'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Year options selector bar */}
              <div className="flex items-center justify-between bg-slate-50 p-2 rounded-2xl border border-slate-150">
                <span className="text-xs font-bold text-slate-655 pl-1.5">Tahun Buku / Anggaran:</span>
                <div className="flex gap-1.5 flex-wrap justify-end">
                  {yearsList.map((yr) => (
                    <button
                      key={yr}
                      onClick={() => setHistoryYear(yr)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition cursor-pointer ${
                        historyYear === yr
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-650 hover:bg-slate-100'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>

              {/* Annual statistics summary block */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100">
                  <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider font-mono">Terbayar ({historyYear})</div>
                  <div className="text-[10px] text-slate-405 font-medium">Sewa & Iuran Lapak Selesai</div>
                  <div className="text-lg font-black font-mono text-emerald-800 mt-1">
                    Rp {selectedRombongHistory.iuranRombong
                      .filter(b => b.lunas && (b.tahun === historyYear || (!b.tahun && historyYear === 2026)))
                      .reduce((sum, b) => sum + b.nominal, 0).toLocaleString('id-ID')}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/45 border border-amber-104 flex flex-col justify-between">
                  <div>
                    <div className="text-[10px] font-bold text-amber-700 uppercase tracking-wider font-mono">Tunggakan ({historyYear})</div>
                    <div className="text-[10px] text-slate-405 font-medium font-mono">Tahun {historyYear}</div>
                    <div className="text-lg font-black font-mono text-amber-850 mt-1">
                      Rp {(() => {
                        let totalTunggakan = 0;
                        fullMonths.forEach(m => {
                          const shortM = m.slice(0, 3);
                          const slot = selectedRombongHistory.iuranRombong.find(b => 
                            b.lunas &&
                            (b.tahun === historyYear || (!b.tahun && historyYear === 2026)) &&
                            (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
                          );
                          if (!slot && isMonthDue(m, historyYear)) {
                            totalTunggakan += getDefaultRombongRate(historyYear, m, rateRombong);
                          }
                        });
                        return totalTunggakan;
                      })().toLocaleString('id-ID')}
                    </div>
                  </div>
                  <div className="mt-2 pt-1.5 border-t border-amber-200/40 text-[9px] text-amber-805 leading-relaxed font-medium italic">
                    Tunggakan sewa rombong adalah keterlambatan atau kelalaian dalam membayarkan sewa bulanan dalam waktu bulan berjalan
                  </div>
                </div>
              </div>

              {/* 12 Months layout grid */}
              <div>
                <h5 className="text-xs font-extrabold text-slate-700 font-sans uppercase mb-3 flex items-center gap-1.5 font-mono tracking-wider">
                  <Calendar className="w-4 h-4 text-slate-500" />
                  Lembar Buku Tagihan Setahun (Jan s.d. Des)
                </h5>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                  {fullMonths.map((IndoMonth, idx) => {
                    const shortMonth = IndoMonth.slice(0, 3);
                    const matchedSlot = selectedRombongHistory.iuranRombong.find(
                      slot => (slot.tahun === historyYear || (!slot.tahun && historyYear === 2026)) &&
                              (slot.bulan.toLowerCase() === IndoMonth.toLowerCase() || 
                               slot.bulan.toLowerCase() === shortMonth.toLowerCase())
                    );

                    const isLunas = matchedSlot ? matchedSlot.lunas : false;
                    const isPendingApp = isLunas && (matchedSlot as any).isCustom && !(matchedSlot as any).approved;
                    const nominalValue = matchedSlot ? matchedSlot.nominal : getDefaultRombongRate(historyYear, IndoMonth, rateRombong);
                    const displayBulan = matchedSlot ? matchedSlot.bulan : IndoMonth;

                    return (
                      <div 
                        key={IndoMonth}
                        className={`p-3 rounded-xl border flex flex-col justify-between min-h-[5.5rem] h-auto pb-1.5 transition duration-150 ${
                          isPendingApp
                            ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-350/20 shadow-sm animate-pulse'
                            : isLunas
                            ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-350/20 shadow-sm'
                            : 'bg-amber-50/30 border-amber-200'
                        }`}
                      >
                        <div>
                          <div className="flex justify-between items-start">
                            <span className={`text-xs font-extrabold ${isPendingApp ? 'text-amber-900 font-extrabold' : isLunas ? 'text-emerald-900 font-black' : 'text-slate-705'}`}>{IndoMonth}</span>
                            <span className="text-[9px] text-slate-400 font-mono">#{String(idx + 1).padStart(2, '0')}</span>
                          </div>
                          {matchedSlot?.catatan && (
                            <div className="text-[9px] text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded-md mt-1.5 italic font-sans break-words border border-sky-100" title={matchedSlot.catatan}>
                              📝 {matchedSlot.catatan}
                            </div>
                          )}
                        </div>

                        <div className="mt-1 flex justify-between items-end bg-transparent">
                          <div className={`text-[10px] font-mono self-end ${isPendingApp ? 'text-amber-705 font-bold' : isLunas ? 'text-emerald-705 font-bold' : 'text-slate-500'}`}>
                            Rp {nominalValue.toLocaleString('id-ID')}
                          </div>
                          
                          {/* Payment status badge */}
                          {isLunas ? (
                            <div className="flex flex-col items-end gap-0.5 bg-transparent">
                              {isPendingApp ? (
                                <span className="text-[9.5px] text-white bg-amber-500 border border-amber-750/10 px-2 py-0.5 rounded-md font-black flex items-center gap-0.5 whitespace-nowrap shadow-xs uppercase tracking-wider">
                                  Pending ⌛
                                </span>
                              ) : (
                                <span className="text-[9.5px] text-white bg-emerald-600 border border-emerald-750/10 px-2 py-0.5 rounded-md font-black flex items-center gap-0.5 whitespace-nowrap shadow-xs uppercase tracking-wider">
                                  Lunas ✓
                                </span>
                              )}
                              {matchedSlot?.tanggalBayar && (
                                <span className="text-[7.5px] text-slate-500 font-mono text-right leading-none scale-[0.9] origin-right">
                                  {(() => {
                                    const p = matchedSlot.tanggalBayar.split('-');
                                    const datePart = p.length === 3 ? `${p[2]}/${p[1]}/${p[0]}` : matchedSlot.tanggalBayar;
                                    return matchedSlot.jamBayar ? `${datePart} ${matchedSlot.jamBayar}` : datePart;
                                  })()}
                                </span>
                              )}
                               {matchedSlot?.fotoBase64 && (
                                <button
                                  onClick={() => setDocumentPreviewUrl({ url: matchedSlot.fotoBase64!, title: `Bukti Bayar Sewa - ${displayBulan} ${historyYear} - ${selectedRombongHistory.namaPemilik}` })}
                                  className="text-[9px] text-emerald-600 hover:text-emerald-800 font-bold hover:underline cursor-pointer active:scale-95 leading-none mt-1 flex items-center gap-0.5"
                                >
                                  <Receipt className="w-2.5 h-2.5 pointer-events-none" /> Lihat Bukti ({formatFileSize(getBase64SizeInBytes(matchedSlot.fotoBase64))})
                                </button>
                              )}
                              {isLoggedIn && currentUser?.role === 'admin' && !isRombongInactive && (
                                <button
                                  onClick={() => {
                                    openRombongCorrectionModal(selectedRombongHistory, 'Iuran Rombong', displayBulan, nominalValue, 'iuranRombong', historyYear);
                                  }}
                                  className="text-[9px] text-sky-600 hover:text-sky-850 font-bold hover:underline cursor-pointer active:scale-95 leading-none mt-1"
                                >
                                  Koreksi ⚙
                                </button>
                              )}
                            </div>
                          ) : (
                            <div className="flex flex-col items-end gap-1">
                              {isOfficer && !isRombongInactive ? (
                                <button
                                  onClick={() => {
                                    openRombongPaymentModal(selectedRombongHistory, 'Iuran Rombong', displayBulan, nominalValue, 'iuranRombong', historyYear);
                                  }}
                                  className="text-[10px] font-bold px-1.5 py-0.5 rounded transition bg-amber-100 hover:bg-amber-200 text-amber-700 cursor-pointer active:scale-95"
                                >
                                  Bayar ❯
                                </button>
                              ) : (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-50/70 text-amber-600 border border-amber-100/50 select-none text-right">
                                  Belum Lunas
                                </span>
                              )}
                              {isLoggedIn && currentUser?.role === 'admin' && !isRombongInactive && (
                                <button
                                  onClick={() => {
                                    openRombongCorrectionModal(selectedRombongHistory, 'Iuran Rombong', displayBulan, nominalValue, 'iuranRombong', historyYear);
                                  }}
                                  className="text-[9px] text-sky-600 hover:text-sky-850 font-bold hover:underline cursor-pointer active:scale-95 leading-none mt-1"
                                >
                                  Koreksi ⚙
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Payment History timeline search match of ledger for Rombong */}
              <div>
                <h5 className="text-xs font-extrabold text-slate-750 font-mono uppercase mb-3 flex items-center gap-1.5 tracking-wider">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  Riwayat Transaksi Kas Rombong ({historyYear})
                </h5>
                
                {(() => {
                  const matchingTxs = filterLedgerForRombong(selectedRombongHistory, historyYear);
                  if (matchingTxs.length === 0) {
                    return (
                      <div className="p-6 text-center bg-slate-55 border border-dashed border-slate-200 rounded-2xl">
                        <p className="text-xs text-slate-500 font-bold">Belum ada rincian riwayat transaksi sewa/lapak tercatat di Buku Kas RT untuk tahun {historyYear}.</p>
                      </div>
                    );
                  }
                  return (
                    <div className="bg-slate-50/50 border border-slate-150 rounded-2xl divide-y divide-slate-100 overflow-hidden">
                      {matchingTxs.map((tx) => (
                        <div key={tx.id} className="p-3.5 flex justify-between items-center hover:bg-slate-100/50 transition">
                          <div>
                            <div className="text-xs font-extrabold text-slate-800 leading-snug">{tx.deskripsi}</div>
                            <div className="text-[10px] text-slate-450 font-mono mt-0.5">
                              Tanggal: {tx.tanggal} • Kas: <span className="text-slate-555 font-bold">{tx.sumberKas}</span> • Oleh: {tx.petugas}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-100/70 px-2 py-1 rounded-lg">
                              + Rp {tx.jumlah.toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>

            </div>

            {/* Footer buttons */}
            <div className="border-t border-slate-100 pt-4 flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
              <span className="text-[10px] text-slate-400 italic">
                * Sinkronisasi data real-time dengan Buku Kas & Keamanan RT
              </span>
              <div className="flex gap-2">
                {isOfficer && (
                  <button
                    onClick={() => {
                      const rawMsg = getWhatsAppRombongHistoryMessageText(selectedRombongHistory, historyYear);
                      const cleanedPhone = (selectedRombongHistory.noWa || '').replace(/\D/g, '');
                      let formattedPhone = cleanedPhone;
                      if (formattedPhone.startsWith('0')) {
                        formattedPhone = '62' + formattedPhone.slice(1);
                      }
                      const finalUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMsg)}`;
                      window.open(finalUrl, '_blank');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/10 transition cursor-pointer active:scale-97"
                    title="Kirim Catatan Buku Tagihan per Rombong ini ke WhatsApp"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Kirim Buku Ke WA</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setSelectedRombongHistory(null);
                    setHistoryYear(2026);
                  }}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer"
                >
                  Tutup Buku
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Registry Table Grid based on Sub-Tab selection */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-in duration-300">
        
        {/* Table header with search count info */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-800 text-sm font-mono flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-500" />
            {activeSubTab === 'warga' 
              ? `Buku Iuran Bulanan Warga (${filteredWarga.length} Temuan)`
              : `Buku Registry Lapak Rombong (${filteredRombong.length} Temuan)`
            }
          </h3>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            
            {isLoggedIn && currentUser?.role === 'admin' && activeSubTab === 'rombong' && (
              <button
                onClick={exportRombongToExcel}
                className="flex items-center gap-1.5 bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-650 text-xs font-bold px-3.5 py-2 rounded-xl border border-slate-250 hover:border-emerald-300 transition duration-155 cursor-pointer shadow-xs font-sans active:scale-95 animate-in fade-in"
                title="Ekspor seluruh data lapak rombong ke file Excel (.xlsx)"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                Ekspor Excel Rombong
              </button>
            )}

            {/* Excel Import Button (Writable only for Admin, only shown if subtab is rombong) */}
            {isLoggedIn && currentUser?.role === 'admin' && activeSubTab === 'rombong' && (
              <div className="relative animate-in fade-in">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={importRombongFromExcel}
                  className="hidden"
                  id="excel-import-file-input"
                />
                <label
                  htmlFor="excel-import-file-input"
                  className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-xl cursor-pointer transition duration-155 shadow-xs font-sans active:scale-95"
                  title="Impor / Bulk Upload data dari Excel untuk pendataan bertenaga instan"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Impor Excel (Rombong)
                </label>
              </div>
            )}

            {!isLoggedIn && (
              <span className="text-[10px] text-amber-700 font-semibold font-mono bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-100 uppercase tracking-wide">
                Hanya Baca (Login untuk edit)
              </span>
            )}
          </div>
        </div>

        {/* --- CITIZEN REGISTER VIEW --- */}
        {activeSubTab === 'warga' && (
          filteredWarga.length === 0 ? (
            <div className="p-12 text-center bg-white">
              <Search className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Buku registry warga kosong atau hasil cari tidak ditemukan</p>
              <p className="text-slate-400 text-xs mt-1">Gunakan kata pencarian lain atau klik "Tambah Warga" saat login.</p>
            </div>
          ) : (
            <div>
              <div className="block md:hidden bg-sky-50 text-sky-700 border border-sky-100 rounded-xl px-4 py-2.5 mb-2.5 text-[10px] sm:text-xs font-semibold">
                💡 Geser tabel ke kanan untuk melihat status iuran lengkap Januari - Desember, tombol cetak, dan kelola.
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[850px] text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-600 text-xs font-extrabold font-mono border-b border-slate-150 uppercase tracking-wider relative">
                      <th className="p-2.5 sm:p-3 min-w-[175px] sm:min-w-[230px] w-[175px] sm:w-[230px] sticky left-0 bg-slate-50 md:bg-slate-100 z-10 md:z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Warga &amp; Rumah</th>
                      <th className="p-2.5 sm:p-3 text-center">Iuran RT<br/><span className="text-[10px] lowercase text-slate-400 font-normal">(rp ${(rateRT / 1000).toLocaleString('id-ID')}k / bln)</span></th>
                      <th className="p-2.5 sm:p-3 text-center w-[120px]">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredWarga.map((w) => {
                      const unpaidMonthsCount = getUnpaidMonthsCountWarga(w);
                      const isOverdue = unpaidMonthsCount > 2;
                      const isInactive = !!(w.statusKeaktifan && w.statusKeaktifan !== 'aktif');

                      return (
                        <tr 
                          key={w.id} 
                          className={`group transition duration-150 border-b border-slate-100 ${
                            isInactive 
                              ? 'bg-slate-100/40 opacity-70 hover:bg-slate-100/60'
                              : isOverdue 
                                ? 'bg-rose-50/50 hover:bg-rose-100/50 border-l-[3.5px] border-l-rose-500' 
                                : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className={`p-2.5 sm:p-3 min-w-[175px] sm:min-w-[230px] w-[175px] sm:w-[230px] sticky left-0 z-5 md:z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition duration-150 ${
                            isInactive 
                              ? 'bg-[#f1f5f9] group-hover:bg-[#e2e8f0]'
                              : isOverdue 
                                ? 'bg-[#fff1f2] group-hover:bg-[#ffe4e6]' 
                                : 'bg-white group-hover:bg-slate-50'
                          }`}>
                          <div className="flex items-center gap-2">
                            {w.fotoBase64 ? (
                              <div className="w-8 h-8 rounded-full border border-slate-200 shadow-xs overflow-hidden shrink-0">
                                <img src={w.fotoBase64} alt="Warga" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                <User className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => {
                                    setSelectedWargaHistory(w);
                                    setHistoryYear(2026);
                                  }}
                                  className={`${
                                    isInactive 
                                      ? 'font-mono italic font-normal text-slate-500 hover:text-sky-600' 
                                      : 'font-extrabold text-slate-900 hover:text-sky-600'
                                  } transition text-sm cursor-pointer border-b border-dashed border-slate-300 hover:border-sky-500 text-left focus:outline-none focus:ring-0 select-all`}
                                  title="Klik untuk cek buku tagihan setahun & riwayat"
                                >
                                  {w.nama}
                                </button>

                                {isOverdue && (
                                  <span 
                                    className="text-[9.5px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/90 border border-rose-200/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 select-none font-sans animate-pulse"
                                    title={`Warga ini belum melunasi iuran bulanan sebanyak ${unpaidMonthsCount} bulan`}
                                  >
                                    <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
                                    Tunggakan {unpaidMonthsCount} bln
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-xs font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                                <Home className="w-3.5 h-3.5 text-sky-550 shrink-0" />
                                <span>Blok {w.blok} No. {w.noRumah}</span>
                                {w.statusRumah === 'sewa_kontrak' ? (
                                  <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200/65 flex items-center gap-0.5 whitespace-nowrap" title="Status: Rumah Sewa / Kontrak">
                                    🏢 Sewa
                                  </span>
                                ) : w.statusRumah === 'lainnya' ? (
                                  <span className="text-[10px] text-slate-500 font-semibold bg-slate-100 px-1.5 py-0.5 rounded-md border border-slate-200/70 flex items-center gap-0.5 whitespace-nowrap" title="Status: Lainnya / Menumpang">
                                    🏠 Menumpang
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-sky-600 font-extrabold bg-sky-50 px-1.5 py-0.5 rounded-md border border-sky-200/65 flex items-center gap-0.5 whitespace-nowrap" title="Status: Rumah Milik Sendiri (Tidak Sewa)">
                                    🏠 Milik Sendiri
                                  </span>
                                )}

                                {w.statusKeaktifan === 'nonaktif' && (
                                  <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-0.5 whitespace-nowrap animate-in fade-in" title="Status Hunian: Tidak Aktif / Arsip">
                                    💤 Tidak Aktif (Arsip)
                                  </span>
                                )}
                                {w.statusKeaktifan === 'pindah_sementara' && (
                                  <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-300 flex items-center gap-0.5 whitespace-nowrap animate-in fade-in" title="Status Hunian: Pindah Sementara">
                                    🚚 Pindah Sementara
                                  </span>
                                )}
                              </div>
                              
                              <div className="flex flex-col mt-1.5 pl-0.5 gap-1 border-t border-slate-100/50 pt-1">
                                {w.noWa && (
                                  <span className="text-[10.5px] text-emerald-600 font-semibold bg-emerald-50/70 px-1.5 py-0.5 rounded border border-emerald-100/40 flex items-center gap-1 w-fit select-all">
                                    <span className="text-emerald-500 font-bold shrink-0">📞 WA:</span> {w.noWa}
                                  </span>
                                )}
                                {w.anggotaKeluarga && w.anggotaKeluarga.length > 0 && (
                                  <span className="text-[10.5px] text-sky-600 font-semibold bg-sky-50/70 px-1.5 py-0.5 rounded border border-sky-100/40 flex items-center gap-1 w-fit">
                                    <Users className="w-3 h-3 text-sky-550 shrink-0" />
                                    <span>{w.anggotaKeluarga.length} Anggota KK</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                      {/* RT Month Grid */}
                      <td className="p-2.5 sm:p-3 text-center align-middle">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(() => {
                            const defaultMonths = showCurrentMonthOnly
                              ? [fullMonths[new Date().getMonth()] || 'Juni']
                              : fullMonths;
                            return defaultMonths.map((m) => {
                              const slot = w.iuranRT.find(b => 
                                b.bulan.toLowerCase() === m.toLowerCase() && 
                                (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
                              ) || { bulan: m, lunas: false, nominal: getDefaultRtRate(selectedBillingYear, m, rateRT), tahun: selectedBillingYear };

                              return (
                                <button
                                  key={m}
                                  onClick={() => !slot.lunas && isWargaOfficer && openPaymentModal(w, 'Iuran RT', slot.bulan, slot.nominal, 'iuranRT', selectedBillingYear)}
                                  disabled={slot.lunas || !isWargaOfficer}
                                  className={`px-1.5 py-0.5 rounded-lg text-[10px] md:text-[11px] font-bold font-mono text-center transition flex flex-col items-center justify-center min-w-[62px] ${
                                    slot.lunas
                                      ? 'bg-emerald-600 text-white border border-emerald-700 shadow-sm cursor-default'
                                      : isWargaOfficer
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/70 cursor-pointer font-sans'
                                      : 'bg-slate-50 text-slate-450 border border-slate-150 cursor-default font-sans'
                                  }`}
                                >
                                  <span className="text-[9px] font-black">{slot.bulan} <span className={`text-[7.5px] font-normal ${slot.lunas ? 'text-emerald-200' : 'opacity-75'}`}>'{String(selectedBillingYear).slice(-2)}</span></span>
                                  {slot.lunas ? (
                                    <>
                                      <span className="text-[8px] mt-0.5 block text-white font-extrabold bg-emerald-750/30 px-1 py-0.2 rounded">LUNAS ✓</span>
                                      {slot.tanggalBayar && (
                                        <span className="text-[7px] text-emerald-100 font-mono mt-0.5 leading-none whitespace-nowrap scale-[0.85]">
                                          {(() => {
                                            const p = slot.tanggalBayar.split('-');
                                            const datePart = p.length === 3 ? `${p[2]}/${p[1]}` : slot.tanggalBayar;
                                            return slot.jamBayar ? `${datePart} ${slot.jamBayar}` : datePart;
                                          })()}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[7.5px] mt-0.5 block opacity-95">
                                      Bayar ❯
                                    </span>
                                  )}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </td>

                      {/* Actions unified dropdown menu */}
                      <td className="p-2.5 sm:p-3 text-center align-middle relative">
                        <div className="relative inline-block text-left">
                          <button
                            id={`warga-actions-btn-${w.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownWarga(activeDropdownWarga === w.id ? null : w.id);
                              setActiveDropdownRombong(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-800 text-xs font-bold border border-slate-205 cursor-pointer shadow-3xs transition"
                            title="Pilih Tindakan / Aksi"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span>Pilih</span>
                          </button>
                          
                          {activeDropdownWarga === w.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  printWargaInvoice(w, selectedBillingYear);
                                  setActiveDropdownWarga(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition text-left font-semibold cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span>Unduh PDF</span>
                              </button>

                              {isWargaOfficer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedWargaForWhatsApp(w);
                                    setTargetPhone(w.noWa || '');
                                    setActiveDropdownWarga(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 transition text-left font-semibold cursor-pointer border-t border-slate-105"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Kirim WA</span>
                                </button>
                              )}

                              {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingWarga(w);
                                      setActiveDropdownWarga(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition text-left font-semibold cursor-pointer border-t border-slate-105"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit Data Warga</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteWarga(w.id, w.nama);
                                      setActiveDropdownWarga(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-650 hover:bg-rose-50 transition border-t border-slate-105 text-left font-semibold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Kelola / Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )
        )}

        {/* --- ROMBONG LAPAK KULINER VIEW --- */}
        {activeSubTab === 'rombong' && (
          filteredRombong.length === 0 ? (
            <div className="p-12 text-center bg-white">
              <Search className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Buku lapak rombong kosong atau hasil cari tidak ditemukan</p>
              <p className="text-slate-400 text-xs mt-1">Gunakan kata pencarian lain atau klik "Tambah Rombong Baru" saat login.</p>
            </div>
          ) : (
            <div>
              <div className="block md:hidden bg-sky-50 text-sky-700 border border-sky-100 rounded-xl px-4 py-2.5 mb-2.5 text-[10px] sm:text-xs font-semibold">
                💡 Geser tabel ke kanan untuk melihat status sewa Rombong lengkap, tombol cetak, dan kelola.
              </div>
              <div className="overflow-x-auto animate-in fade-in duration-200">
                <table className="w-full min-w-[800px] text-left border-collapse table-auto">
                  <thead>
                    <tr className="bg-slate-50/70 text-slate-600 text-xs font-extrabold font-mono border-b border-slate-150 uppercase tracking-wider relative">
                      <th className="p-2.5 sm:p-3 min-w-[175px] sm:min-w-[230px] w-[175px] sm:w-[230px] sticky left-0 bg-slate-50 md:bg-slate-100 z-10 md:z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">Pemilik &amp; Lapak Rombong</th>
                      <th className="p-2.5 sm:p-3 text-center">Iuran Rombong<br/><span className="text-[10px] lowercase text-slate-400 font-normal">(rp ${(rateRombong / 1000).toLocaleString('id-ID')}k / bln)</span></th>
                      <th className="p-2.5 sm:p-3 text-center w-[120px]">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRombong.map((r) => {
                      const unpaidMonthsCount = getUnpaidMonthsCountRombong(r);
                      const isOverdue = unpaidMonthsCount > 2;
                      const isInactive = !!(r.statusKeaktifan && r.statusKeaktifan !== 'aktif');

                      return (
                        <tr 
                          key={r.id} 
                          className={`group transition duration-155 border-b border-slate-100 ${
                            isInactive 
                              ? 'bg-slate-100/40 opacity-70 hover:bg-slate-100/60'
                              : isOverdue 
                                ? 'bg-rose-50/50 hover:bg-rose-100/50 border-l-[3.5px] border-l-rose-500' 
                                : 'hover:bg-slate-50/80'
                          }`}
                        >
                          <td className={`p-2.5 sm:p-3 min-w-[175px] sm:min-w-[230px] w-[175px] sm:w-[230px] sticky left-0 z-5 md:z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.08)] transition duration-150 ${
                            isInactive 
                              ? 'bg-[#f1f5f9] group-hover:bg-[#e2e8f0]'
                              : isOverdue 
                                ? 'bg-[#fff1f2] group-hover:bg-[#ffe4e6]' 
                                : 'bg-white group-hover:bg-slate-50'
                          }`}>
                          <div className="flex items-center gap-2">
                            {r.fotoBase64 ? (
                              <div className="w-8 h-8 rounded-full border border-slate-200 shadow-xs overflow-hidden shrink-0">
                                <img src={r.fotoBase64} alt="Rombong" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                                <Store className="w-3.5 h-3.5 text-slate-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <button
                                  onClick={() => {
                                    setSelectedRombongHistory(r);
                                    setHistoryYear(2026);
                                  }}
                                  className={`${
                                    isInactive 
                                      ? 'font-mono italic font-normal text-slate-500 hover:text-emerald-700' 
                                      : 'font-extrabold text-slate-900 hover:text-emerald-700'
                                  } transition text-sm cursor-pointer border-b border-dashed border-slate-300 hover:border-emerald-600 text-left focus:outline-none focus:ring-0 select-all`}
                                  title="Klik untuk cek buku tagihan setahun & riwayat"
                                >
                                  {r.namaPemilik}
                                </button>

                                {isOverdue && (
                                  <span 
                                    className="text-[9.5px] font-black uppercase tracking-wider text-rose-700 bg-rose-100/90 border border-rose-200/60 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0 select-none font-sans animate-pulse"
                                    title={`Lapak ini belum melunasi iuran bulanan sebanyak ${unpaidMonthsCount} bulan`}
                                  >
                                    <span className="w-1.5 h-1.5 bg-rose-600 rounded-full animate-ping" />
                                    Tunggakan {unpaidMonthsCount} bln
                                  </span>
                                )}
                              </div>
                              <div className="text-slate-500 text-xs font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                                <Store className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>{r.noLapak} — <span className="opacity-90">{r.lokasi}</span></span>
                                {r.statusKeaktifan === 'nonaktif' && (
                                  <span className="text-[10px] text-amber-600 font-extrabold bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-300 flex items-center gap-0.5 whitespace-nowrap animate-in fade-in" title="Status Lapak: Tidak Aktif / Arsip">
                                    💤 Tidak Aktif (Arsip)
                                  </span>
                                )}
                                {r.statusKeaktifan === 'pindah_sementara' && (
                                  <span className="text-[10px] text-indigo-600 font-extrabold bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-300 flex items-center gap-0.5 whitespace-nowrap animate-in fade-in" title="Status Lapak: Pindah Sementara">
                                    🚚 Pindah Sementara
                                  </span>
                                )}
                              </div>
                              
                              {r.noWa && (
                                <div className="flex flex-col mt-1.5 pl-0.5 gap-1 border-t border-slate-100/50 pt-1">
                                  <span className="text-[10.5px] text-emerald-600 font-semibold bg-emerald-50/70 px-1.5 py-0.5 rounded border border-emerald-100/40 flex items-center gap-1 w-fit select-all">
                                    <span className="text-emerald-500 font-bold shrink-0">📞 WA:</span> {r.noWa}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </td>

                      {/* Rombong Month Grid */}
                      <td className="p-2.5 sm:p-3 text-center align-middle">
                        <div className="flex flex-wrap gap-1 justify-center">
                          {(() => {
                            const defaultMonths = showCurrentMonthOnly
                              ? [fullMonths[new Date().getMonth()] || 'Juni']
                              : fullMonths;
                            return defaultMonths.map((m) => {
                              const slot = r.iuranRombong.find(b => 
                                b.bulan.toLowerCase() === m.toLowerCase() && 
                                (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026))
                              ) || { bulan: m, lunas: false, nominal: getDefaultRombongRate(selectedBillingYear, m, rateRombong), tahun: selectedBillingYear };

                              const isPendingApp = slot.lunas && (slot as any).isCustom && !(slot as any).approved;

                              return (
                                <button
                                  key={m}
                                  onClick={() => !slot.lunas && isOfficer && openRombongPaymentModal(r, 'Iuran Rombong', slot.bulan, slot.nominal, 'iuranRombong', selectedBillingYear)}
                                  disabled={slot.lunas || !isOfficer}
                                  className={`px-1.5 py-0.5 rounded-lg text-[10px] md:text-[11px] font-bold font-mono text-center transition flex flex-col items-center justify-center min-w-[62px] ${
                                    isPendingApp
                                      ? 'bg-amber-500 text-white border border-amber-600 shadow-sm cursor-default animate-pulse'
                                      : slot.lunas
                                      ? 'bg-emerald-600 text-white border border-emerald-700 shadow-sm cursor-default'
                                      : isOfficer
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/70 cursor-pointer font-sans'
                                      : 'bg-slate-50 text-slate-450 border border-slate-150 cursor-default font-sans'
                                  }`}
                                >
                                  <span className="text-[9px] font-black">{slot.bulan} <span className={`text-[7.5px] font-normal ${isPendingApp ? 'text-amber-100' : slot.lunas ? 'text-emerald-200' : 'opacity-75'}`}>'{String(selectedBillingYear).slice(-2)}</span></span>
                                  {slot.lunas ? (
                                    <>
                                      {isPendingApp ? (
                                        <span className="text-[8.5px] mt-0.5 block text-white font-extrabold bg-amber-600/30 px-1 py-0.1 rounded">PENDING ⌛</span>
                                      ) : (
                                        <span className="text-[8px] mt-0.5 block text-white font-extrabold bg-emerald-750/30 px-1 py-0.2 rounded">LUNAS ✓</span>
                                      )}
                                      {slot.tanggalBayar && (
                                        <span className={`text-[7px] font-mono mt-0.5 leading-none whitespace-nowrap scale-[0.85] ${isPendingApp ? 'text-amber-100' : 'text-emerald-100'}`}>
                                          {(() => {
                                            const p = slot.tanggalBayar.split('-');
                                            const datePart = p.length === 3 ? `${p[2]}/${p[1]}` : slot.tanggalBayar;
                                            return slot.jamBayar ? `${datePart} ${slot.jamBayar}` : datePart;
                                          })()}
                                        </span>
                                      )}
                                    </>
                                  ) : (
                                    <span className="text-[7.5px] mt-0.5 block opacity-95">
                                      Bayar ❯
                                    </span>
                                  )}
                                </button>
                              );
                            });
                          })()}
                        </div>
                      </td>

                      {/* Actions unified dropdown menu */}
                      <td className="p-2.5 sm:p-3 text-center align-middle relative">
                        <div className="relative inline-block text-left">
                          <button
                            id={`rombong-actions-btn-${r.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveDropdownRombong(activeDropdownRombong === r.id ? null : r.id);
                              setActiveDropdownWarga(null);
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-slate-800 text-xs font-bold border border-slate-205 cursor-pointer shadow-3xs transition"
                            title="Pilih Tindakan / Aksi"
                          >
                            <Settings className="w-3.5 h-3.5 text-slate-500" />
                            <span>Pilih</span>
                          </button>
                          
                          {activeDropdownRombong === r.id && (
                            <div className="absolute right-0 mt-1 w-48 bg-white border border-slate-200 rounded-lg shadow-lg z-50 py-1 text-left animate-in fade-in slide-in-from-top-1 duration-150">
                              <button
                                type="button"
                                onClick={() => {
                                  printRombongInvoice(r, selectedBillingYear);
                                  setActiveDropdownRombong(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-sky-700 hover:bg-sky-50 transition text-left font-semibold cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5 text-sky-600" />
                                <span>Unduh PDF</span>
                              </button>

                              {isOfficer && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedRombongForWhatsApp(r);
                                    setTargetPhone(r.noWa || '');
                                    setActiveDropdownRombong(null);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-700 hover:bg-emerald-50 transition text-left font-semibold cursor-pointer border-t border-slate-105"
                                >
                                  <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Kirim WA</span>
                                </button>
                              )}

                              {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingRombong(r);
                                      setActiveDropdownRombong(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition text-left font-semibold cursor-pointer border-t border-slate-105"
                                  >
                                    <Edit2 className="w-3.5 h-3.5 text-slate-500" />
                                    <span>Edit Data Lapak</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      handleDeleteRombong(r.id, r.namaPemilik);
                                      setActiveDropdownRombong(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-650 hover:bg-rose-50 transition border-t border-slate-105 text-left font-semibold cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Kelola / Hapus</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                  })}
                </tbody>
              </table>
            </div>
          </div>
          )
        )}

      {/* Dynamic Billing Book Print Preview (Buku Tagihan) */}
      {showPrintBillingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[98] overflow-y-auto no-print">
          <style>{`
            @media print {
              body {
                background-color: white !important;
                color: black !important;
                font-family: 'Inter', system-ui, sans-serif !important;
              }
              header, footer, nav, .no-print, button, select, input, #tab-dashboard, #tab-tagihan, #tab-buku_kas, .pb-32, .pb-8 {
                display: none !important;
                visibility: hidden !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-billing-area, #printable-billing-area * {
                visibility: visible;
              }
              #printable-billing-area {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                background-color: white !important;
                padding: 0 !important;
                margin: 0 !important;
                box-shadow: none !important;
                border: none !important;
              }
            }
          `}</style>

          <div className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl relative max-w-6xl w-full my-8 flex flex-col max-h-[90vh]">
            {/* Top Toolbar (Invisible in General Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6 no-print">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 font-sans">
                  <Printer className="w-5 h-5 text-sky-600" />
                  Pratinjau Buku Tagihan RT.008 RW.004
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">Sesuai dengan sub-tab dan filter aktif ({activeSubTab === 'warga' ? 'Kategori Warga' : 'Kategori Rombong Kuliner'}, Tahun: {selectedBillingYear}).</p>
              </div>

              {/* Format Selector and Toolbar Actions */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs no-print">
                  <button
                    onClick={() => setPrintFormatType('table')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      printFormatType === 'table'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5 text-slate-500" />
                    Format Kertas (Tabel)
                  </button>
                  <button
                    onClick={() => setPrintFormatType('whatsapp')}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 cursor-pointer ${
                      printFormatType === 'whatsapp'
                        ? 'bg-white text-emerald-700 shadow-sm'
                        : 'text-slate-500 hover:text-emerald-700'
                    }`}
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                    Format WhatsApp (WA)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowPrintBillingModal(false)}
                    className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                  >
                    Tutup
                  </button>
                  {printFormatType === 'table' && (
                    <button
                      onClick={() => {
                        const printableArea = document.getElementById('printable-billing-area');
                        if (printableArea) {
                          const printDoc = {
                            write: (htmlContent: string) => {
                              printContentViaIframe(htmlContent);
                            },
                            close: () => {}
                          };
                          printDoc.write(`
                              <html>
                                <head>
                                  <title>Buku Rekapitulasi Tagihan RT.008 RW.004</title>
                                  <style>
                                    @page {
                                      size: landscape;
                                      margin: 10mm 12mm;
                                    }
                                    body {
                                      background-color: white !important;
                                      color: black !important;
                                      font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                                      padding: 10px;
                                      margin: 0;
                                    }
                                    table {
                                      width: 100%;
                                      border-collapse: collapse;
                                      margin-top: 15px;
                                      margin-bottom: 20px;
                                    }
                                    th, td {
                                      border: 1px solid #cbd5e1 !important;
                                      padding: 6px 8px !important;
                                      font-size: 11px !important;
                                      text-align: left;
                                    }
                                    th {
                                      background-color: #f1f5f9 !important;
                                      color: #0f172a !important;
                                      font-weight: bold !important;
                                      font-family: monospace !important;
                                      text-transform: uppercase !important;
                                    }
                                    .text-center { text-align: center !important; }
                                    .text-right { text-align: right !important; }
                                    .font-bold { font-weight: bold !important; }
                                    .text-xs { font-size: 0.75rem !important; }
                                    .text-sm { font-size: 0.875rem !important; }
                                    .text-lg { font-size: 1.125rem !important; }
                                    .text-xl { font-size: 1.25rem !important; }
                                    .uppercase { text-transform: uppercase !important; }
                                    .mb-4 { margin-bottom: 1rem !important; }
                                    .mb-6 { margin-bottom: 1.5rem !important; }
                                    .mt-4 { margin-top: 1rem !important; }
                                    .border-b-4 { border-bottom: 4px solid #000 !important; }
                                    .border-double { border-style: double !important; }
                                    .pb-4 { padding-bottom: 1rem !important; }
                                    .flex { display: flex !important; }
                                    .justify-between { justify-content: space-between !important; }
                                    .items-center { align-items: center !important; }
                                    .gap-1.5 { gap: 0.375rem !important; }
                                    .gap-4 { gap: 1rem !important; }
                                    .grid { display: grid !important; }
                                    .grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
                                    .grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)) !important; }
                                    .no-print, button, input, select {
                                      display: none !important;
                                      visibility: hidden !important;
                                    }
                                    @media print {
                                      * {
                                        visibility: visible !important;
                                      }
                                      .no-print, .no-print *, button, input, select {
                                        display: none !important;
                                        visibility: hidden !important;
                                      }
                                    }
                                  </style>
                                </head>
                                <body>
                                  ${printableArea.innerHTML}
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
                        }
                      }}
                      className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2.5 rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/15 cursor-pointer active:scale-95 transition"
                    >
                      <Printer className="w-4 h-4" />
                      Cetak Buku Sekarang
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Scrollable Document Area */}
            <div className="flex-1 overflow-y-auto pr-1">
              {printFormatType === 'table' ? (
                <div id="printable-billing-area" className="bg-white p-4 md:p-8 border border-slate-150 rounded-2xl shadow-xs text-slate-900 font-sans">
                  
                  {/* Letterhead Header */}
                  <div className="text-center border-b-4 border-double border-slate-900 pb-4 mb-6">
                    <h2 className="text-lg md:text-xl font-black font-sans tracking-wide text-slate-900 uppercase leading-tight">{rtTitle}</h2>
                    <h3 className="text-xs md:text-sm font-extrabold font-sans text-slate-800 tracking-wide uppercase leading-tight mt-1">{rtAddress}</h3>
                    {rtEmail && (
                      <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1 font-sans">
                        Email: {rtEmail}
                      </p>
                    )}
                  </div>

                  <div className="text-center mb-6">
                    <h4 className="text-base font-extrabold text-slate-900 uppercase tracking-wide">
                      {activeSubTab === 'warga' 
                        ? 'DAFTAR REKAPITULASI BUKU TAGIHAN IURAN WARGA'
                        : 'DAFTAR REKAPITULASI BUKU TAGIHAN SEWA LAPAK ROMBONG'
                      }
                    </h4>
                    <div className="text-sm font-semibold text-slate-700 mt-0.5 uppercase">
                      Tahun Anggaran: <span className="font-mono font-black">{selectedBillingYear}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono mt-1">
                      Dicetak Pada: {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>

                  {/* Main Data Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[1050px] text-left border-collapse border border-slate-400 table-auto text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-900 font-bold border-b border-slate-400">
                          <th className="border border-slate-400 p-2 text-center w-8">No</th>
                          {activeSubTab === 'warga' ? (
                            <>
                              <th className="border border-slate-400 p-2">Nama Warga</th>
                              <th className="border border-slate-400 p-2 text-center w-24">Blok &amp; Rumah</th>
                            </>
                          ) : (
                            <>
                              <th className="border border-slate-400 p-2">Pemilik Lapak</th>
                              <th className="border border-slate-400 p-2 text-center w-24 font-mono">No Lapak</th>
                            </>
                          )}
                          {fullMonths.map((m) => (
                            <th key={m} className="border border-slate-400 p-1 text-center font-mono text-[9px]">
                              {m.slice(0, 3)}
                            </th>
                          ))}
                          <th className="border border-slate-400 p-2 text-right w-24">Terbayar (Rp)</th>
                          <th className="border border-slate-400 p-2 text-right w-24">Tunggak (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSubTab === 'warga' ? (
                          reportWarga.map((w, idx) => {
                            let paidSum = 0;
                            let unpaidSum = 0;
                            
                            const monthlyStatus = fullMonths.map((m) => {
                              const shortM = m.slice(0, 3);
                              const matchedSlot = w.iuranRT.find(
                                slot => (slot.tahun === selectedBillingYear || (!slot.tahun && selectedBillingYear === 2026)) &&
                                        (slot.bulan.toLowerCase() === m.toLowerCase() || 
                                         slot.bulan.toLowerCase() === shortM.toLowerCase())
                              );
                              const isLunas = matchedSlot ? matchedSlot.lunas : false;
                              const nominal = matchedSlot ? matchedSlot.nominal : rateRT;
                              if (isLunas) {
                                paidSum += nominal;
                              } else if (isMonthDue(m, selectedBillingYear)) {
                                unpaidSum += rateRT;
                              }
                              return isLunas;
                            });

                            return (
                              <tr key={w.id} className="hover:bg-slate-50 transition border-b border-slate-350">
                                <td className="border border-slate-350 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-350 p-2 font-bold text-slate-900">
                                  {w.nama}
                                  {w.isDeleted && (
                                    <span className="text-[9px] text-rose-550 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 ml-1.5 inline-block tracking-wide font-sans">Non-Aktif</span>
                                  )}
                                </td>
                                <td className="border border-slate-350 p-2 text-center font-mono text-slate-800">{w.blok}-{w.noRumah}</td>
                                {monthlyStatus.map((isLunas, mIdx) => (
                                  <td 
                                    key={mIdx} 
                                    className={`border border-slate-350 p-1 text-center font-mono font-extrabold text-[10px] ${
                                      isLunas ? 'text-emerald-700 bg-emerald-50/20' : 'text-rose-600 bg-rose-50/10'
                                    }`}
                                  >
                                    {isLunas ? '✓' : '×'}
                                  </td>
                                ))}
                                <td className="border border-slate-350 p-2 text-right font-mono text-emerald-800 font-bold">{paidSum.toLocaleString('id-ID')}</td>
                                <td className={`border border-slate-350 p-2 text-right font-mono font-bold ${unpaidSum > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                                  {unpaidSum > 0 ? unpaidSum.toLocaleString('id-ID') : '0'}
                                  {w.isDeleted && unpaidSum > 0 && <span className="text-[8px] text-rose-500 font-normal block tracking-tight">(Diabaikan)</span>}
                                </td>
                              </tr>
                            );
                          })
                        ) : (
                          reportRombong.map((r, idx) => {
                            let paidSum = 0;
                            let unpaidSum = 0;
                            
                            const monthlyStatus = fullMonths.map((m) => {
                              const shortM = m.slice(0, 3);
                              const matchedSlot = r.iuranRombong.find(
                                slot => (slot.tahun === selectedBillingYear || (!slot.tahun && selectedBillingYear === 2026)) &&
                                        (slot.bulan.toLowerCase() === m.toLowerCase() || 
                                         slot.bulan.toLowerCase() === shortM.toLowerCase())
                              );
                              const isLunas = matchedSlot ? matchedSlot.lunas : false;
                              const nominal = matchedSlot ? matchedSlot.nominal : rateRombong;
                              if (isLunas) {
                                paidSum += nominal;
                              } else if (isMonthDue(m, selectedBillingYear)) {
                                unpaidSum += rateRombong;
                              }
                              return isLunas;
                            });

                            return (
                              <tr key={r.id} className="hover:bg-slate-50 transition border-b border-slate-350">
                                <td className="border border-slate-350 p-2 text-center">{idx + 1}</td>
                                <td className="border border-slate-350 p-2 font-bold text-slate-900">
                                  {r.namaPemilik}
                                  {r.isDeleted && (
                                    <span className="text-[9px] text-rose-550 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-100 ml-1.5 inline-block tracking-wide font-sans">Non-Aktif</span>
                                  )}
                                </td>
                                <td className="border border-slate-350 p-2 text-center font-mono text-slate-800">{r.noLapak}</td>
                                {monthlyStatus.map((isLunas, mIdx) => (
                                  <td 
                                    key={mIdx} 
                                    className={`border border-slate-350 p-1 text-center font-mono font-extrabold text-[10px] ${
                                      isLunas ? 'text-emerald-700 bg-emerald-50/20' : 'text-rose-600 bg-rose-50/10'
                                    }`}
                                  >
                                    {isLunas ? '✓' : '×'}
                                  </td>
                                ))}
                                <td className="border border-slate-350 p-2 text-right font-mono text-emerald-800 font-bold">{paidSum.toLocaleString('id-ID')}</td>
                                <td className={`border border-slate-350 p-2 text-right font-mono font-bold ${unpaidSum > 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                                  {unpaidSum > 0 ? unpaidSum.toLocaleString('id-ID') : '0'}
                                  {r.isDeleted && unpaidSum > 0 && <span className="text-[8px] text-rose-500 font-normal block tracking-tight">(Diabaikan)</span>}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Report Statistics Summary */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 p-4 rounded-xl border border-slate-300 bg-slate-50">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-505 block">Total Entitas</span>
                      <strong className="text-sm font-extrabold text-slate-900">
                        {activeSubTab === 'warga' ? `${reportWarga.length} Kepala Keluarga` : `${reportRombong.length} Lapak Rombong`}
                      </strong>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-505 block">Estimasi Kas Terbayar</span>
                      <strong className="text-sm font-extrabold text-emerald-800 font-mono">
                        Rp {((activeSubTab === 'warga' ? reportWarga : reportRombong) as any[]).reduce((total, item) => {
                          const billList = activeSubTab === 'warga' ? item.iuranRT : item.iuranRombong;
                          const paidTotal = billList
                            .filter((b: any) => b.lunas && (b.tahun === selectedBillingYear || (!b.tahun && selectedBillingYear === 2026)))
                            .reduce((s: number, b: any) => s + b.nominal, 0);
                          return total + paidTotal;
                        }, 0).toLocaleString('id-ID')}
                      </strong>
                    </div>
                    <div className="col-span-2 text-right hidden md:block">
                      <span className="text-[10px] italic text-slate-500 block">* Seluruh pembayaran terhitung dalam sistem akuntansi ganda RT 08</span>
                    </div>
                  </div>

                  {/* Signing Footer Block */}
                  <div className="grid grid-cols-2 gap-8 mt-12 text-center text-xs">
                    <div>
                      <p className="font-semibold text-slate-600 mb-16">Mengetahui,<br/>Ketua RT 008 RW 004</p>
                      <p className="font-black underline uppercase text-slate-900">{adminNameFormatted}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP. 24.08.004.008.01</p>
                    </div>
                    <div>
                      <p className="font-semibold text-slate-605 mb-16">Penanggung Jawab Keuangan,<br/>Bendahara RT 008</p>
                      <p className="font-black underline uppercase text-slate-900">{bendaharaNameFormatted}</p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">NIP. 24.08.004.008.02</p>
                    </div>
                  </div>

                </div>
              ) : (
                <div className="space-y-4 no-print select-none">
                  <div className="bg-emerald-50 border border-emerald-150 text-emerald-850 p-4 rounded-2xl text-xs flex items-start gap-2.5">
                    <MessageSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-extrabold text-[13px] text-emerald-950">Daftar Tagihan Format Teks WhatsApp (WA)</p>
                      <p className="text-emerald-800 font-medium mt-0.5 leading-relaxed">
                        Berikut adalah daftar draf tagihan untuk draf pesan WhatsApp per {activeSubTab === 'warga' ? 'warga' : 'rombong'} sesuai filter aktif.
                        Anda dapat menyalin (Copy) draf pesan dengan klik tombol <strong>Salin Format WA</strong>, atau buka chat instan dengan klik <strong>Kirim WA</strong> secara cepat.
                      </p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-205 p-4 rounded-2xl space-y-3.5 shadow-xs text-slate-700">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">🔧 Pengaturan Konten Pesan WhatsApp Masal / Batch:</p>
                        <p className="text-[11.5px] text-slate-550 mt-0.5">Atur apakah draf pesan akan menyertakan tagihan bulan aktif saat ini, tunggakan bulan sebelumnya, atau keduanya.</p>
                      </div>
                      
                      <div className="flex flex-wrap gap-4 shrink-0 bg-slate-50 p-2.5 border border-slate-200 rounded-xl">
                        <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                          <input 
                            type="checkbox" 
                            checked={waIncludeCurrent} 
                            onChange={(e) => setWaIncludeCurrent(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 focus:ring-emerald-400 border-slate-300 rounded cursor-pointer accent-emerald-600"
                          />
                          <span className="font-bold text-slate-800">Tagihan Bulan Berjalan (Current)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs select-none">
                          <input 
                            type="checkbox" 
                            checked={waIncludeArrears} 
                            onChange={(e) => setWaIncludeArrears(e.target.checked)}
                            className="w-4 h-4 text-emerald-650 focus:ring-emerald-400 border-slate-300 rounded cursor-pointer accent-emerald-600"
                          />
                          <span className="font-bold text-slate-800">Tunggakan Sebelumnya (Arrears)</span>
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeSubTab === 'warga' ? (
                      filteredWarga.map((w) => {
                        const rawMsg = getWhatsAppMessageText(w);
                        const isCopied = copiedId === w.id;
                        
                        return (
                          <div key={w.id} className="bg-slate-50 border border-slate-205 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h5 className="font-extrabold text-slate-900 text-sm leading-tight">{w.nama}</h5>
                                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-200 rounded text-slate-700 mt-1 inline-block">
                                    Blok {w.blok}-{w.noRumah}
                                  </span>
                                </div>
                                {w.noWa ? (
                                  <span className="text-[10px] font-mono text-slate-600 font-bold border border-slate-200 px-2 py-0.5 rounded bg-white shrink-0">
                                    📱 {w.noWa}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shrink-0">
                                    Belum ada WA
                                  </span>
                                )}
                              </div>

                              <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-[11px] font-mono whitespace-pre-line text-slate-700 leading-relaxed max-h-36 overflow-y-auto mt-2.5 shadow-inner select-text">
                                {rawMsg}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100 shrink-0">
                              <button
                                onClick={() => copyToClipboard(rawMsg, w.id)}
                                className={`flex-1 font-extrabold py-2 px-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                                    : 'bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-250'
                                }`}
                              >
                                {isCopied ? (
                                  <>Tersalin! ✓</>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    Salin Format WA
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  let cleanPhone = (w.noWa || '').replace(/\D/g, '');
                                  let formattedPhone = cleanPhone;
                                  if (formattedPhone.startsWith('0')) {
                                    formattedPhone = '62' + formattedPhone.slice(1);
                                  }
                                  const finalUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMsg)}`;
                                  window.open(finalUrl, '_blank');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center transition shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Kirim WA
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      filteredRombong.map((r) => {
                        const rawMsg = getWhatsAppRombongMessageText(r);
                        const isCopied = copiedId === r.id;

                        return (
                          <div key={r.id} className="bg-slate-50 border border-slate-205 rounded-2xl p-4 flex flex-col justify-between hover:shadow-xs transition">
                            <div>
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <div>
                                  <h5 className="font-extrabold text-slate-900 text-sm leading-tight">{r.namaPemilik}</h5>
                                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 bg-slate-250 rounded text-slate-700 mt-1 inline-block">
                                    Lapak: {r.noLapak} ({r.lokasi})
                                  </span>
                                </div>
                                {r.noWa ? (
                                  <span className="text-[10px] font-mono text-slate-600 font-bold border border-slate-200 px-2 py-0.5 rounded bg-white shrink-0">
                                    📱 {r.noWa}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-100 shrink-0">
                                    Belum ada WA
                                  </span>
                                )}
                              </div>

                              <div className="bg-white border border-slate-200/80 rounded-xl p-3 text-[11px] font-mono whitespace-pre-line text-slate-700 leading-relaxed max-h-36 overflow-y-auto mt-2.5 shadow-inner select-text">
                                {rawMsg}
                              </div>
                            </div>

                            <div className="flex gap-2 mt-4 pt-2 border-t border-slate-100 shrink-0">
                              <button
                                onClick={() => copyToClipboard(rawMsg, r.id)}
                                className={`flex-1 font-extrabold py-2 px-2.5 rounded-xl text-xs transition duration-150 flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 ${
                                  isCopied
                                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/10'
                                    : 'bg-slate-150 hover:bg-slate-200 text-slate-700 border border-slate-250'
                                }`}
                              >
                                {isCopied ? (
                                  <>Tersalin! ✓</>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                                    Salin Format WA
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  let cleanPhone = (r.noWa || '').replace(/\D/g, '');
                                  let formattedPhone = cleanPhone;
                                  if (formattedPhone.startsWith('0')) {
                                    formattedPhone = '62' + formattedPhone.slice(1);
                                  }
                                  const finalUrl = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(rawMsg)}`;
                                  window.open(finalUrl, '_blank');
                                }}
                                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 px-3.5 rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center transition shadow-xs"
                              >
                                <Send className="w-3.5 h-3.5" />
                                Kirim WA
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Footer and cancel buttons */}
            <div className="border-t border-slate-100 pt-4 flex justify-between items-center shrink-0 no-print">
              <span className="text-[10px] text-slate-400 italic font-sans">
                {printFormatType === 'table' 
                  ? '* Gunakan kombinasi tombol Ctrl + P pada keyboard jika dialog cetak browser Anda tidak muncul otomatis.'
                  : '* Klik Salin Format WA untuk langsung menyalin rincian tagihan per warga.'
                }
              </span>
              <button
                onClick={() => setShowPrintBillingModal(false)}
                className="bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dynamic System configuration Management Dialogue (Blok & Tahun) */}
      {showBlockManageModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[95] animate-in fade-in duration-250 no-print">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-805 max-w-2xl md:max-w-3xl w-full">
            <button 
              onClick={() => {
                setShowBlockManageModal(false);
                setNewBlockInput('');
                setNewYearInput('');
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-800 cursor-pointer p-1.5 rounded-full hover:bg-slate-50 transition"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 border-b border-slate-100 pb-3 mb-5">
              <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
                <Settings className="w-5 h-5 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Pengaturan Batasan &amp; Parameter RT 08</h3>
                <p className="text-xs text-slate-500">Kelola daftar wilayah Blok rumah dan daftar Tahun Anggaran aktif.</p>
              </div>
            </div>

            {/* Scrollable Container covering sections 1, 2, 3, 4, 5 */}
            <div className="max-h-[65vh] overflow-y-auto pr-2 space-y-6">

              {/* Split layout: Blok & Tahun */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 divide-y md:divide-y-0 md:divide-x divide-slate-100">
                
                {/* Left Column: Blocks management */}
                <div className="space-y-4 pb-4 md:pb-0">
                  <h4 className="text-xs font-black text-sky-700 uppercase tracking-wider">1. Wilayah Blok Rumah</h4>
                  
                  {/* List of current blocks */}
                  <div className="space-y-2.5 font-mono">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Daftar Blok Tersimpan</label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                      {blocksList.map(b => (
                        <div key={b} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-800 shadow-3xs">
                          <span>Blok {b}</span>
                          <button
                            onClick={() => {
                              const inUse = wargaList.some(w => w.blok === b);
                              if (inUse) {
                                alert(`Blok ${b} tidak bisa dihapus karena masih digunakan oleh warga!`);
                                return;
                              }
                              if (confirm(`Apakah Anda yakin ingin menghapus Blok ${b}?`)) {
                                if (updateBlocksList) {
                                  updateBlocksList(blocksList.filter(item => item !== b));
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
                      }
                    }}
                    className="space-y-2"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans">Sandi/Huruf Blok Baru</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          required
                          value={newBlockInput}
                          onChange={(e) => setNewBlockInput(e.target.value)}
                          placeholder="Contoh: B2, D1, E3"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 font-bold uppercase font-sans"
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
                <div className="space-y-4 pt-4 md:pt-0 md:pl-6">
                  <h4 className="text-xs font-black text-emerald-700 uppercase tracking-wider">2. Tahun Buku / Anggaran</h4>
                  
                  {/* List of current years */}
                  <div className="space-y-2.5 font-mono">
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">Daftar Tahun Aktif</label>
                    <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1 bg-slate-50 rounded-xl border border-slate-100">
                      {yearsList.map(yr => {
                        // Check if year is in use (warga bills, rombong bills, ledger entries)
                        const hasWargaMatch = wargaList.some(w => w.iuranRT.some(b => b.tahun === yr));
                        const hasRombongMatch = rombongList.some(r => r.iuranRombong.some(b => b.tahun === yr));
                        const hasLedgerMatch = ledger.some(l => {
                          const dateYear = l.tanggal ? Number(l.tanggal.split('-')[0]) : 0;
                          return dateYear === yr || l.deskripsi?.includes(String(yr));
                        });
                        const inUse = hasWargaMatch || hasRombongMatch || hasLedgerMatch;
                        const isLastYear = yearsList.length <= 1;
                        const deletable = !inUse && !isLastYear;

                        return (
                          <div key={yr} className="flex items-center gap-1.5 bg-white border border-slate-200 px-2.5 py-1 rounded-lg text-[11px] font-bold text-slate-800 shadow-3xs">
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
                                    // fallback selected billing year if deleted is currently selected
                                    if (selectedBillingYear === yr) {
                                      const nextAvail = yearsList.find(item => item !== yr);
                                      if (nextAvail) setSelectedBillingYear(nextAvail);
                                    }
                                  }
                                }
                              }}
                              className={`p-0.5 rounded transition ml-0.5 cursor-pointer ${deletable ? 'text-slate-400 hover:text-rose-600' : 'text-slate-200 hover:text-slate-300'}`}
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
                      }
                    }}
                    className="space-y-2"
                  >
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans">Masukan Tahun Masehi Baru</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          min="2000"
                          max="2100"
                          required
                          value={newYearInput}
                          onChange={(e) => setNewYearInput(e.target.value)}
                          placeholder="Contoh: 2028"
                          className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold font-mono"
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
              <div className="border-t border-slate-150 pt-5">
                <h4 className="text-xs font-black text-sky-700 uppercase tracking-wider mb-3">3. Besaran Acuan Iuran Bulanan</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Acuan Iuran RT (Sistem Standard) (Rp)</label>
                    <input
                      type="number"
                      disabled={currentUser?.role !== 'admin'}
                      value={rateRT}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        updateRateRT(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Diterapkan secara otomatis saat mendaftarkan warga baru / menghitung tunggakan RT.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5">Acuan Iuran Rombong (Sewa Lahan) (Rp)</label>
                    <input
                      type="number"
                      disabled={currentUser?.role !== 'admin'}
                      value={rateRombong}
                      onChange={(e) => {
                        const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                        updateRateRombong(val);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 font-bold"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Diterapkan secara otomatis saat mendaftarkan rombong baru / menghitung sewa rombong.</p>
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
              <div className="border-t border-slate-150 pt-5">
                <h4 className="text-xs font-black text-sky-700 uppercase tracking-wider mb-3">4. Identitas KOP Surat &amp; Buku Penagihan</h4>
                
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans">Judul KOP Utama (Nama Rukun Tetangga / Kas)</label>
                    <input
                      type="text"
                      disabled={currentUser?.role !== 'admin'}
                      value={rtTitle}
                      onChange={(e) => updateRtTitle(e.target.value)}
                      placeholder="Contoh: PENGURUS RUKUN TETANGGA 008 RUKUN WARGA 004"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Muncul sebagai tajuk paling utama (baris ke-1) di lembaran KOP laporan cetak.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans">Alamat Lengkap RT (KOP)</label>
                      <textarea
                        rows={2}
                        disabled={currentUser?.role !== 'admin'}
                        value={rtAddress}
                        onChange={(e) => updateRtAddress(e.target.value)}
                        placeholder="Contoh: PERUMTAS 3 RT.008 RW.004 DESA POPOH KEC WONOAYU KABUPATEN SIDOARJO 61261"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition resize-none leading-relaxed"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Muncul sebagai alamat fisik (baris ke-2) di lembaran KOP laporan cetak.</p>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1.5 font-sans">Alamat Email Resmi RT (KOP)</label>
                      <input
                        type="text"
                        disabled={currentUser?.role !== 'admin'}
                        value={rtEmail}
                        onChange={(e) => updateRtEmail(e.target.value)}
                        placeholder="Contoh: tas3.rt.08@gmail.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-100 disabled:text-slate-400 focus:bg-white transition"
                      />
                      <p className="text-[10px] text-slate-400 mt-1">Muncul sebagai sarana kontak surat resmi (baris ke-3) di lembaran KOP laporan cetak.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Pusat Pengosongan Data Keuangan (Admin Only) */}
              {isLoggedIn && currentUser?.role === 'admin' && (
                <div className="border-t border-rose-100 pt-5 bg-rose-50/40 p-4 rounded-2xl border border-rose-105">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-700 font-black text-xs uppercase tracking-wider">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        <span>5. Tindakan Berbahaya &amp; Reset Data</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed max-w-md font-medium">
                        Menghapus seluruh mutasi kas, iuran warga, iuran rombong, dan mengosongkan pembukuan kembali ke awal default.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowBlockManageModal(false);
                        onTriggerReset();
                      }}
                      className="bg-white hover:bg-rose-50 border border-rose-200 hover:border-rose-300 text-rose-600 font-extrabold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow-sm hover:shadow transition active:scale-95 duration-150 shrink-0 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kosongkan Seluruh Data</span>
                    </button>
                  </div>
                </div>
              )}

              {currentUser?.role !== 'admin' && (
                <div className="border-t border-slate-150 pt-4 font-semibold text-[11px] text-rose-600 bg-rose-50/50 p-3 rounded-xl border border-rose-100 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>Hak Akses Terbatas: Pengaturan iuran acuan, perubahan naskah KOP surat (Judul, Alamat, Email), serta Pengosongan sistem data hanya diperbolehkan untuk pengguna dengan peran Admin (Ketua RT).</span>
                </div>
              )}

            </div>

            <div className="flex justify-end mt-6 pt-4 border-t border-slate-100">
              <button
                onClick={() => {
                  setShowBlockManageModal(false);
                  setNewBlockInput('');
                  setNewYearInput('');
                }}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-705 font-bold rounded-xl text-xs cursor-pointer transition duration-150 active:scale-95"
              >
                Selesai / Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Preview Modal KTP / KK */}
      {documentPreviewUrl && (
        <div 
          className="fixed inset-0 z-[999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setDocumentPreviewUrl(null)}
        >
          <div 
            className="bg-white rounded-3xl overflow-hidden max-w-4xl w-full shadow-2xl relative flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 bg-slate-50 border-b border-slate-100 shrink-0">
              <h4 className="font-extrabold text-slate-900 text-sm md:text-base font-sans">{documentPreviewUrl.title}</h4>
              <button 
                onClick={() => setDocumentPreviewUrl(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1 rounded-full hover:bg-slate-200 transition"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 bg-slate-950/5 flex-1 flex items-center justify-center overflow-auto min-h-0">
              <img 
                src={documentPreviewUrl.url} 
                alt="Document Full View" 
                className="max-h-[65vh] max-w-full object-contain rounded-xl border border-slate-200 shadow-sm bg-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <a 
                href={documentPreviewUrl.url} 
                download={`${documentPreviewUrl.title.replace(/\s+/g, '_')}.jpg`}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition active:scale-95"
              >
                <Download className="w-4 h-4" />
                Unduh Gambar Berkas
              </a>
              <button 
                onClick={() => setDocumentPreviewUrl(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-750 font-bold rounded-xl text-xs cursor-pointer transition active:scale-95"
              >
                Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>

    </div>
  );
}
