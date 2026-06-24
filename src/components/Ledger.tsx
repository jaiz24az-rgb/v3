import React, { useState } from 'react';
import { LedgerEntry, Balance, AppUser } from '../types';
import { getBase64SizeInBytes, formatFileSize } from '../utils/fileSizeUtils';
import { compressImage } from '../utils/fileCompressor';
import { 
  FileText, 
  ArrowUpRight, 
  ArrowDownLeft, 
  User, 
  Tag, 
  Calendar, 
  Filter, 
  Search,
  BookOpen,
  Trash2,
  Printer,
  FileSpreadsheet,
  X,
  Camera,
  Receipt,
  Download,
  Eye,
  Edit2
} from 'lucide-react';

interface LedgerProps {
  ledger: LedgerEntry[];
  setLedger: (newLedger: LedgerEntry[]) => void;
  kas: Balance;
  updateKas: (newKas: Balance) => void;
  isLoggedIn: boolean;
  currentUser?: AppUser | null;
  usersList?: AppUser[];
  yearsList?: number[];
  rtTitle?: string;
  rtAddress?: string;
  rtEmail?: string;
  onTriggerLogin?: () => void;
}

export default function Ledger({ 
  ledger, 
  setLedger, 
  kas, 
  updateKas, 
  isLoggedIn, 
  currentUser = null, 
  usersList = [], 
  yearsList = [2024, 2025, 2026, 2027, 2028],
  rtTitle = 'PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04',
  rtAddress = 'PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.',
  rtEmail = '',
  onTriggerLogin
}: LedgerProps) {
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

  const [viewMode, setViewMode] = useState<'jurnal' | 'tabelaris'>('jurnal');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<'semua' | 'pemasukan' | 'pengeluaran'>('semua');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [selectedYear, setSelectedYear] = useState<string>('semua');
  const [selectedMonth, setSelectedMonth] = useState<string>('semua');
  const [showPrintPreview, setShowPrintPreview] = useState<boolean>(false);
  const [selectedReceipt, setSelectedReceipt] = useState<{ deskripsi: string; fotoBase64: string; fotoNamaFile: string } | null>(null);
  const [entryToDelete, setEntryToDelete] = useState<{ 
    id: string; 
    jumlah: number; 
    tipe: 'pemasukan' | 'pengeluaran'; 
    sumberKas: keyof Balance; 
    deskripsi: string; 
  } | null>(null);
  const [editingLedgerEntry, setEditingLedgerEntry] = useState<LedgerEntry | null>(null);

  const INDO_MONTHS = [
    { value: '01', name: 'Januari' },
    { value: '02', name: 'Februari' },
    { value: '03', name: 'Maret' },
    { value: '04', name: 'April' },
    { value: '05', name: 'Mei' },
    { value: '06', name: 'Juni' },
    { value: '07', name: 'Juli' },
    { value: '08', name: 'Agustus' },
    { value: '09', name: 'September' },
    { value: '10', name: 'Oktober' },
    { value: '11', name: 'November' },
    { value: '12', name: 'Desember' }
  ];

  const getLastDayOfMonth = (month: string, year: string): number => {
    const m = parseInt(month, 10);
    const y = parseInt(year, 10);
    if (isNaN(m) || isNaN(y)) return 31;
    return new Date(y, m, 0).getDate();
  };

  const cleanSignatureName = (nama: string) => {
    return nama.replace(/\s*\(.*\)\s*/g, '').trim();
  };

  const adminUser = usersList.find(u => u.role === 'admin');
  const bendaharaUser = usersList.find(u => u.role === 'bendahara');

  const adminName = adminUser ? cleanSignatureName(adminUser.nama) : 'Bp. Sutriadi';
  const bendaharaName = bendaharaUser ? cleanSignatureName(bendaharaUser.nama) : 'Heri Gunawan';

  const allowedPhotos = isLoggedIn && currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'bendahara' || 
    currentUser.role === 'sekretaris'
  );

  // Preprocess ledger to map 'Kas Kas Rombong' to 'Kas Rombong' and filter out certain corrections
  const processedLedger = React.useMemo(() => {
    return ledger
      .map(entry => {
        let kategori = entry.kategori;
        const originalKategori = entry.kategori;
        if (kategori === 'Kas Kas Rombong') {
          kategori = 'Kas Rombong';
        } else if (
          kategori === 'Operasional Petty Cash' ||
          kategori === 'Mutasi Bank-Petty' ||
          kategori === 'Petty Cash' ||
          kategori === 'Kas Kecil'
        ) {
          kategori = 'Kas Kecil';
        }
        return { ...entry, kategori, originalKategori };
      })
      .filter(entry => {
        if (entry.kategori === 'Koreksi Data') return false;
        const descLower = (entry.deskripsi || '').toLowerCase();
        if (descLower.includes('koreksi massal')) return false;
        if (descLower.includes('[koreksi administratif]')) return false;
        if (descLower.includes('modifikasi data warga')) return false;
        return true;
      });
  }, [ledger]);

  // Find unique categories for dropdown filter
  const categories = ['Semua', ...Array.from(new Set(processedLedger.map(entry => entry.kategori)))];

  const handleDeleteLedgerEntry = (id: string, jumlah: number, tipe: 'pemasukan' | 'pengeluaran', sumberKas: keyof Balance, deskripsi: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    setEntryToDelete({ id, jumlah, tipe, sumberKas, deskripsi });
  };

  const handleUpdateLedgerEntry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLedgerEntry) return;

    const updatedLedger = ledger.map(item => {
      if (item.id === editingLedgerEntry.id) {
        return {
          ...item,
          tanggal: editingLedgerEntry.tanggal,
          tanggalInput: editingLedgerEntry.tanggalInput || new Date().toISOString().split('T')[0],
          deskripsi: editingLedgerEntry.deskripsi,
          kategori: editingLedgerEntry.kategori,
          petugas: editingLedgerEntry.petugas
        };
      }
      return item;
    });

    setLedger(updatedLedger);
    setEditingLedgerEntry(null);
  };

  // Precompute running balances in ascending chronological order over EVERYTHING
  const tabularData = React.useMemo(() => {
    const sortedAll = [...processedLedger].sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return a.tanggal.localeCompare(b.tanggal);
      }
      return a.id.localeCompare(b.id);
    });

    const seqCounters: Record<string, { ksub: number; bsub: number }> = {};
    let rtTunaiRunning = 0;
    let rtPettyCashRunning = 0;
    let rtBankRunning = 0;
    let rbRunning = 0; // rombongTunai
    let bkRunning = 0; // rombongBank

    return sortedAll.map((item) => {
      const dateParts = item.tanggal.split('-');
      const year = dateParts[0] || '2026';
      const month = dateParts[1] || '01';
      const yy = year.substring(2);
      const mm = month;
      const monthKey = `${year}-${month}`;

      if (!seqCounters[monthKey]) {
        seqCounters[monthKey] = { ksub: 0, bsub: 0 };
      }

      const isBank = item.sumberKas === 'rtBank' || item.sumberKas === 'rombongBank';
      let noBukti = '';
      if (isBank) {
        seqCounters[monthKey].bsub += 1;
        noBukti = `BSUB.${yy}.${mm}.${String(seqCounters[monthKey].bsub).padStart(3, '0')}`;
      } else {
        seqCounters[monthKey].ksub += 1;
        noBukti = `KSUB.${yy}.${mm}.${String(seqCounters[monthKey].ksub).padStart(3, '0')}`;
      }

      let rtTunaiDebit = 0, rtTunaiKredit = 0;
      let rtPettyCashDebit = 0, rtPettyCashKredit = 0;
      let rtBankDebit = 0, rtBankKredit = 0;
      let rbDebit = 0, rbKredit = 0;
      let bkDebit = 0, bkKredit = 0;

      const val = item.jumlah;
      const isPemasukan = item.tipe === 'pemasukan';
      const isHandover = item.kategori === 'Penarikan Dana Kolektor';

      if (isHandover) {
        // Exclude from changing running balances or debit/credit to prevent double-counting citizen payments
      } else {
        if (item.sumberKas === 'rtTunai') {
          if (isPemasukan) {
            rtTunaiDebit = val;
            rtTunaiRunning += val;
          } else {
            rtTunaiKredit = val;
            rtTunaiRunning -= val;
          }
        } else if (item.sumberKas === 'rtPettyCash') {
          if (isPemasukan) {
            rtPettyCashDebit = val;
            rtPettyCashRunning += val;
          } else {
            rtPettyCashKredit = val;
            rtPettyCashRunning -= val;
          }
        } else if (item.sumberKas === 'rtBank') {
          if (isPemasukan) {
            rtBankDebit = val;
            rtBankRunning += val;
          } else {
            rtBankKredit = val;
            rtBankRunning -= val;
          }
        } else if (item.sumberKas === 'rombongTunai') {
          if (isPemasukan) {
            rbDebit = val;
            rbRunning += val;
          } else {
            rbKredit = val;
            rbRunning -= val;
          }
        } else if (item.sumberKas === 'rombongBank') {
          if (isPemasukan) {
            bkDebit = val;
            bkRunning += val;
          } else {
            bkKredit = val;
            bkRunning -= val;
          }
        }
      }

      return {
        ...item,
        noBukti,
        rtTunaiDebit,
        rtTunaiKredit,
        rtTunaiRunning,
        rtPettyCashDebit,
        rtPettyCashKredit,
        rtPettyCashRunning,
        rtBankDebit,
        rtBankKredit,
        rtBankRunning,
        rbDebit,
        rbKredit,
        rbRunning,
        bkDebit,
        bkKredit,
        bkRunning,
        totalRTRunning: rtTunaiRunning + rtPettyCashRunning + rtBankRunning,
        totalRombongRunning: rbRunning + bkRunning,
        totalRunning: rtTunaiRunning + rtPettyCashRunning + rtBankRunning + rbRunning + bkRunning
      };
    });
  }, [processedLedger]);

  // Find start boundary date based on standard filters
  const startBoundaryDate = React.useMemo(() => {
    if (selectedYear === 'semua') return null;
    if (selectedMonth === 'semua') {
      return `${selectedYear}-01-01`;
    }
    return `${selectedYear}-${selectedMonth}-01`;
  }, [selectedYear, selectedMonth]);

  // Calculate opening balances based strictly on transactions prior to the selected period
  const saldoAwal = React.useMemo(() => {
    if (!startBoundaryDate) {
      return { rtTunai: 0, rtPettyCash: 0, rtBank: 0, rb: 0, bk: 0, totalRT: 0, totalRombong: 0, total: 0 };
    }

    const priorEntries = tabularData.filter(e => e.tanggal < startBoundaryDate);
    if (priorEntries.length === 0) {
      return { rtTunai: 0, rtPettyCash: 0, rtBank: 0, rb: 0, bk: 0, totalRT: 0, totalRombong: 0, total: 0 };
    }

    const lastPrior = priorEntries[priorEntries.length - 1];
    return {
      rtTunai: lastPrior.rtTunaiRunning,
      rtPettyCash: lastPrior.rtPettyCashRunning,
      rtBank: lastPrior.rtBankRunning,
      rb: lastPrior.rbRunning,
      bk: lastPrior.bkRunning,
      totalRT: lastPrior.totalRTRunning,
      totalRombong: lastPrior.totalRombongRunning,
      total: lastPrior.totalRunning
    };
  }, [tabularData, startBoundaryDate]);

  // General Filtered Ledger list for the portrait mode "Jurnal"
  const filteredLedger = processedLedger.filter(entry => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const cat = (entry.kategori || '').toLowerCase();
    const pet = (entry.petugas || '').toLowerCase();
    const matchesSearch = desc.includes(searchTerm.toLowerCase()) ||
                          cat.includes(searchTerm.toLowerCase()) ||
                          pet.includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'semua' || entry.tipe === selectedType;
    const matchesCategory = selectedCategory === 'Semua' || entry.kategori === selectedCategory;

    let matchesDate = true;
    if (entry.tanggal) {
      const parts = entry.tanggal.split('-');
      if (parts.length >= 2) {
        const entryYear = parts[0];
        const entryMonth = parts[1];

        const yearMatch = selectedYear === 'semua' || entryYear === selectedYear;
        const monthMatch = selectedMonth === 'semua' || entryMonth === selectedMonth;
        matchesDate = yearMatch && monthMatch;
      }
    }

    return matchesSearch && matchesType && matchesCategory && matchesDate;
  });

  const totalPemasukan = filteredLedger
    .filter(e => 
      e.tipe === 'pemasukan' && 
      (e as any).originalKategori !== 'Setor Bank' && 
      (e as any).originalKategori !== 'Mutasi Bank-Petty' && 
      (e as any).originalKategori !== 'Penarikan Dana Kolektor'
    )
    .reduce((sum, e) => sum + e.jumlah, 0);

  const totalPengeluaran = filteredLedger
    .filter(e => 
      e.tipe === 'pengeluaran' && 
      (e as any).originalKategori !== 'Setor Bank' && 
      (e as any).originalKategori !== 'Mutasi Bank-Petty' && 
      (e as any).originalKategori !== 'Penarikan Dana Kolektor'
    )
    .reduce((sum, e) => sum + e.jumlah, 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  // Filtered tabular rows (sorted ascending) for the tabular spreadsheet display
  const visibleTabularRows = React.useMemo(() => {
    return tabularData.filter(entry => {
      const desc = (entry.deskripsi || '').toLowerCase();
      const cat = (entry.kategori || '').toLowerCase();
      const pet = (entry.petugas || '').toLowerCase();
      const matchesSearch = desc.includes(searchTerm.toLowerCase()) ||
                            cat.includes(searchTerm.toLowerCase()) ||
                            pet.includes(searchTerm.toLowerCase());
      const matchesType = selectedType === 'semua' || entry.tipe === selectedType;
      const matchesCategory = selectedCategory === 'Semua' || entry.kategori === selectedCategory;

      let matchesDate = true;
      if (entry.tanggal) {
        const parts = entry.tanggal.split('-');
        if (parts.length >= 2) {
          const entryYear = parts[0];
          const entryMonth = parts[1];

          const yearMatch = selectedYear === 'semua' || entryYear === selectedYear;
          const monthMatch = selectedMonth === 'semua' || entryMonth === selectedMonth;
          matchesDate = yearMatch && monthMatch;
        }
      }

      return matchesSearch && matchesType && matchesCategory && matchesDate;
    });
  }, [tabularData, searchTerm, selectedType, selectedCategory, selectedYear, selectedMonth]);

  // Sum periodic totals for the spreadsheet footer
  const totalsTabular = React.useMemo(() => {
    let sumRtTunaiDebit = 0, sumRtTunaiKredit = 0;
    let sumRtPettyCashDebit = 0, sumRtPettyCashKredit = 0;
    let sumRtBankDebit = 0, sumRtBankKredit = 0;
    let sumRbDebit = 0, sumRbKredit = 0;
    let sumBkDebit = 0, sumBkKredit = 0;

    visibleTabularRows.forEach(row => {
      sumRtTunaiDebit += row.rtTunaiDebit || 0;
      sumRtTunaiKredit += row.rtTunaiKredit || 0;
      sumRtPettyCashDebit += row.rtPettyCashDebit || 0;
      sumRtPettyCashKredit += row.rtPettyCashKredit || 0;
      sumRtBankDebit += row.rtBankDebit || 0;
      sumRtBankKredit += row.rtBankKredit || 0;
      sumRbDebit += row.rbDebit || 0;
      sumRbKredit += row.rbKredit || 0;
      sumBkDebit += row.bkDebit || 0;
      sumBkKredit += row.bkKredit || 0;
    });

    const lastRow = visibleTabularRows[visibleTabularRows.length - 1];
    
    return {
      rtTunaiDebit: sumRtTunaiDebit,
      rtTunaiKredit: sumRtTunaiKredit,
      rtTunaiRunning: lastRow ? lastRow.rtTunaiRunning : saldoAwal.rtTunai,
      rtPettyCashDebit: sumRtPettyCashDebit,
      rtPettyCashKredit: sumRtPettyCashKredit,
      rtPettyCashRunning: lastRow ? lastRow.rtPettyCashRunning : saldoAwal.rtPettyCash,
      rtBankDebit: sumRtBankDebit,
      rtBankKredit: sumRtBankKredit,
      rtBankRunning: lastRow ? lastRow.rtBankRunning : saldoAwal.rtBank,
      rbDebit: sumRbDebit,
      rbKredit: sumRbKredit,
      rbRunning: lastRow ? lastRow.rbRunning : saldoAwal.rb,
      bkDebit: sumBkDebit,
      bkKredit: sumBkKredit,
      bkRunning: lastRow ? lastRow.bkRunning : saldoAwal.bk,
      totalRTRunning: lastRow ? lastRow.totalRTRunning : saldoAwal.totalRT,
      totalRombongRunning: lastRow ? lastRow.totalRombongRunning : saldoAwal.totalRombong,
      totalRunning: lastRow ? lastRow.totalRunning : saldoAwal.total
    };
  }, [visibleTabularRows, saldoAwal]);

  const handleExportExcel = () => {
    if (viewMode === 'tabelaris') {
      // 1. Export in exact Multi-Column layout
      const headers = [
        'Tanggal',
        'No Bukti Transaksi',
        'Keterangan',
        'Penerima/Petugas',
        'Iuran RT Tunai (Debit)',
        'Iuran RT Tunai (Kredit)',
        'Saldo Iuran RT Tunai',
        'Kas Kecil (Debit)',
        'Kas Kecil (Kredit)',
        'Saldo Kas Kecil',
        'RT Bank (Debit)',
        'RT Bank (Kredit)',
        'Saldo RT Bank',
        'Total Saldo RT',
        'Rombong Tunai (Debit)',
        'Rombong Tunai (Kredit)',
        'Saldo Rombong Tunai',
        'Rombong Bank (Debit)',
        'Rombong Bank (Kredit)',
        'Saldo Rombong Bank',
        'Total Saldo Rombong',
        'Grand Total Kas Umum'
      ];

      const rowSaldoAwal = [
        '',
        '',
        'SALDO PERIODE LALU',
        '',
        '',
        '',
        saldoAwal.rtTunai,
        '',
        '',
        saldoAwal.rtPettyCash,
        '',
        '',
        saldoAwal.rtBank,
        saldoAwal.totalRT,
        '',
        '',
        saldoAwal.rb,
        '',
        '',
        saldoAwal.bk,
        saldoAwal.totalRombong,
        saldoAwal.total
      ];

      const rows = visibleTabularRows.map((row) => [
        row.tanggal,
        row.noBukti,
        `"${row.deskripsi.replace(/"/g, '""')}"`,
        `"${row.petugas.replace(/"/g, '""')}"`,
        row.rtTunaiDebit || '',
        row.rtTunaiKredit || '',
        row.rtTunaiRunning,
        row.rtPettyCashDebit || '',
        row.rtPettyCashKredit || '',
        row.rtPettyCashRunning,
        row.rtBankDebit || '',
        row.rtBankKredit || '',
        row.rtBankRunning,
        row.totalRTRunning,
        row.rbDebit || '',
        row.rbKredit || '',
        row.rbRunning,
        row.bkDebit || '',
        row.bkKredit || '',
        row.bkRunning,
        row.totalRombongRunning,
        row.totalRunning
      ]);

      const rowSaldoAkhir = [
        'Saldo Akhir',
        '',
        'TOTAL PERIODIK',
        '',
        totalsTabular.rtTunaiDebit,
        totalsTabular.rtTunaiKredit,
        totalsTabular.rtTunaiRunning,
        totalsTabular.rtPettyCashDebit,
        totalsTabular.rtPettyCashKredit,
        totalsTabular.rtPettyCashRunning,
        totalsTabular.rtBankDebit,
        totalsTabular.rtBankKredit,
        totalsTabular.rtBankRunning,
        totalsTabular.totalRTRunning,
        totalsTabular.rbDebit,
        totalsTabular.rbKredit,
        totalsTabular.rbRunning,
        totalsTabular.bkDebit,
        totalsTabular.bkKredit,
        totalsTabular.bkRunning,
        totalsTabular.totalRombongRunning,
        totalsTabular.totalRunning
      ];

      const csvContent = [
        headers.join(','),
        rowSaldoAwal.join(','),
        ...rows.map(r => r.join(',')),
        rowSaldoAkhir.join(',')
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      let periodStr = 'Tabelaris_Semua_Periode';
      if (selectedYear !== 'semua') {
        periodStr = `Tabelaris_${selectedYear}`;
        if (selectedMonth !== 'semua') {
          const monthIndex = parseInt(selectedMonth, 10) - 1;
          const name = INDO_MONTHS[monthIndex]?.name || 'Bulan';
          periodStr = `Tabelaris_${name}_${selectedYear}`;
        }
      }

      link.setAttribute('download', `Laporan_Tabelaris_Buku_Kas_RT08_${periodStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

    } else {
      // 2. Export in original single-line ledger layout
      const headers = ['No', 'Tanggal', 'Deskripsi/Keterangan', 'Kategori', 'Petugas', 'Akun Kas', 'Tipe', 'Nominal (Rp)'];
      
      const rows = [...filteredLedger]
        .sort((a, b) => {
          if (a.tanggal !== b.tanggal) {
            return a.tanggal.localeCompare(b.tanggal);
          }
          return (a.id || '').localeCompare(b.id || '');
        })
        .map((entry, idx) => [
          idx + 1,
          entry.tanggal,
          `"${entry.deskripsi.replace(/"/g, '""')}"`,
          `"${entry.kategori.replace(/"/g, '""')}"`,
          `"${entry.petugas.replace(/"/g, '""')}"`,
          entry.sumberKas,
          entry.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
          entry.jumlah
        ]);

      const emptyRow = ['', '', '', '', '', '', '', ''];
      const rowTotalPemasukan = ['', '', 'Total Debit (Pemasukan)', '', '', '', '', totalPemasukan];
      const rowTotalPengeluaran = ['', '', 'Total Kredit (Pengeluaran)', '', '', '', '', totalPengeluaran];
      const rowSaldoBersih = ['', '', 'Saldo Bersih Periode', '', '', '', '', saldoBersih];

      const csvContent = [
        headers.join(','),
        ...rows.map(e => e.join(',')),
        emptyRow.join(','),
        rowTotalPemasukan.join(','),
        rowTotalPengeluaran.join(','),
        rowSaldoBersih.join(',')
      ].join('\n');

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      
      let periodStr = 'Semua_Periode';
      if (selectedYear !== 'semua') {
        periodStr = `${selectedYear}`;
        if (selectedMonth !== 'semua') {
          const monthIndex = parseInt(selectedMonth, 10) - 1;
          const name = INDO_MONTHS[monthIndex]?.name || 'Bulan';
          periodStr = `${name}_${selectedYear}`;
        }
      }

      link.setAttribute('download', `Laporan_Buku_Kas_RT08_${periodStr}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser.role === 'bendahara' || currentUser.role === 'sekretaris' || currentUser.role === 'audit');
  const canModify = isLoggedIn && currentUser && (currentUser.role === 'admin' || currentUser.role === 'bendahara');

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-white border border-slate-200 rounded-3xl text-center shadow-xl relative overflow-hidden animate-in fade-in zoom-in-95 duration-250">
        {/* Top background glow pattern */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-rose-500" />
        
        <div className="w-16 h-16 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto mb-6 text-rose-600">
          <BookOpen className="w-8 h-8 pointer-events-none opacity-80" />
        </div>

        <h3 className="text-slate-900 font-extrabold text-lg tracking-tight mb-2">
          Akses Terbatas: Buku Kas Umum
        </h3>
        
        <p className="text-slate-600 text-xs md:text-sm leading-relaxed mb-6 font-medium">
          Mohon maaf, rincian Buku Kas Umum, aliran dana, rekap tabelaris, mutasi harian, cetak laporan, dan dokumen pembukuan lainnya 
          <strong className="text-slate-900 font-bold"> hanya dapat diakses, dilihat, maupun dicetak</strong> oleh pengurus RT yang berwenang (Ketua RT atau Bendahara).
        </p>

        <div className="p-4 bg-slate-50 border border-slate-150 rounded-2xl text-[11px] text-slate-500 font-medium leading-relaxed mb-6 space-y-2 text-left font-sans">
          <p className="flex items-center gap-2 font-bold text-slate-700">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span>
            <span>Akses Terkunci Untuk Pengunjung / Warga</span>
          </p>
          <p>
            Silakan login sebagai Pengurus RT yang sah untuk mengelola catatan mutasi dan mencetak bukti/laporan kas periodik.
          </p>
        </div>

        {onTriggerLogin ? (
          <button
            onClick={onTriggerLogin}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold py-3 rounded-xl text-xs transition active:scale-97 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-sky-600/10 font-sans"
            id="restricted-login-btn"
          >
            <span>Masuk Sebagai Pengurus RT</span>
          </button>
        ) : (
          <div className="text-xs font-bold text-sky-600 font-sans">
            Gunakan tombol <span className="underline">"Masuk Pengurus"</span> di bagian kanan atas/menu navigasi untuk masuk.
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Search & Filters */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <h3 className="font-extrabold text-slate-800 text-sm font-mono flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-sky-600" />
          Filter Buku Kas Umum RT.008 RW.004
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* Search bar */}
          <div className="relative md:col-span-4">
            <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 font-bold" />
            <input
              type="text"
              placeholder="Cari deskripsi, kategori, petugas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 placeholder-slate-450"
            />
          </div>

          {/* Type Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            >
              <option value="semua">Semua Tipe</option>
              <option value="pemasukan">Dana Masuk (Debit)</option>
              <option value="pengeluaran">Dana Keluar (Kredit)</option>
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            >
              <option value="Semua">Semua Kategori</option>
              {categories.filter(cat => cat !== 'Semua').map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Month Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            >
              <option value="semua">Semua Bulan</option>
              {INDO_MONTHS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm text-slate-850 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans"
            >
              <option value="semua">Semua Tahun</option>
              {yearsList.map(yr => (
                <option key={yr} value={String(yr)}>Tahun {yr}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Excel / PDF Report Panel */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-150 rounded-2xl mt-2 animate-in fade-in duration-200">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-slate-700">Periode Ekspor Terpilih:</p>
            <p className="text-xs text-sky-700 font-black font-mono">
              {selectedMonth === 'semua' && selectedYear === 'semua'
                ? 'Semua Transaksi Buku Kas'
                : `${selectedMonth !== 'semua' ? INDO_MONTHS.find(m => m.value === selectedMonth)?.name : 'Semua Bulan'} ${selectedYear !== 'semua' ? selectedYear : 'Semua Tahun'}`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Excel */}
            <button
              onClick={handleExportExcel}
              className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-250 font-extrabold px-4.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-xs transition cursor-pointer active:scale-97 font-sans"
              title="Unduh Buku Kas dalam format Excel (.csv)"
              id="ledger-excel-button"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel (.csv)</span>
            </button>

            {/* Print directly or preview */}
            <button
              onClick={() => setShowPrintPreview(true)}
              className="bg-sky-600 hover:bg-sky-705 text-white font-black px-4.5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-600/10 transition cursor-pointer active:scale-97 font-sans"
              title="Pratinjau Laporan & Cetak PDF / Printer"
              id="ledger-pdf-button"
            >
              <Printer className="w-4 h-4 text-white" />
              <span>Pratinjau Laporan PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ledger Records List */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-slate-200 p-4.5 rounded-2xl shadow-xs">
          <div className="space-y-0.5">
            <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Format Tampilan Buku Kas</h4>
            <p className="text-xs text-slate-600">Pilih format pencatatan laporan kas bulanan/periodik RT</p>
          </div>
          
          <div className="flex items-center bg-slate-100 p-1 border border-slate-200/50 rounded-xl">
            <button
              onClick={() => setViewMode('jurnal')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'jurnal'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="view-mode-jurnal"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Jurnal Umum</span>
            </button>
            <button
              onClick={() => setViewMode('tabelaris')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'tabelaris'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              id="view-mode-tabelaris"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Tabelaris (Spreadsheet)</span>
            </button>
          </div>
        </div>

        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-mono text-slate-500 font-semibold">
            {viewMode === 'tabelaris' 
              ? `Menampilkan ${visibleTabularRows.length} baris jurnal tabelaris`
              : `Menampilkan ${filteredLedger.length} riwayat transaksi`}
          </span>
          {isLoggedIn && (
            <span className="text-[10px] text-rose-600 font-mono font-bold">
              *Hapus transaksi akan memulihkan saldo akun kas semula.
            </span>
          )}
        </div>

        {viewMode === 'tabelaris' ? (
          /* SPREADSHEET TABLE VIEW */
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
            {/* Sheet Header */}
            <div className="bg-slate-900 text-white p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div className="space-y-1">
                <h3 className="text-base font-mono font-black tracking-wide uppercase">
                  REKAP TABELARIS PERIODE:{' '}
                  {selectedMonth === 'semua' && selectedYear === 'semua'
                    ? 'SEMUA DATA KAS'
                    : `${selectedMonth !== 'semua' ? INDO_MONTHS.find(m => m.value === selectedMonth)?.name?.toUpperCase() : 'SEMUA BULAN'} ${selectedYear !== 'semua' ? selectedYear : 'SEMUA TAHUN'}`}
                </h3>
                <p className="text-xs text-slate-400">
                  Format Lulus Uji Rekonsiliasi Bank & Kas Umum RT.008 RW.004
                </p>
              </div>
              <div className="bg-emerald-600 text-[10px] font-mono px-2.5 py-1.5 rounded-lg font-bold uppercase tracking-wider">
                🔒 RECONCILIATED
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-[1750px] border-collapse border-spacing-0 text-[10px] font-sans">
                <thead>
                  <tr className="bg-slate-900 text-white text-center font-bold font-mono border-b border-slate-300 text-[10px]">
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 w-16 text-center text-white">TANGGAL</th>
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 w-24 text-center text-white">NO BUKTI</th>
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 text-left min-w-[180px] text-white">KAS / KETERANGAN TRANSAKSI</th>
                    <th rowSpan={3} className="border-r border-b border-slate-300 p-2 w-20 text-center text-white">PETUGAS</th>
                    <th colSpan={10} className="border-r border-b border-slate-300 p-1.5 bg-slate-850 text-white">TOTAL KAS RT (IURAN, KECIL & BANK)</th>
                    <th colSpan={7} className="border-r border-b border-slate-300 p-1.5 bg-sky-900 text-white">TOTAL KAS ROMBONG (TUNAI & BANK)</th>
                    <th rowSpan={3} className="border-b border-slate-300 p-2 bg-indigo-950 text-white font-black w-24 text-center">GRAND TOTAL KAS (KAS UMUM)</th>
                    {isLoggedIn && <th rowSpan={3} className="p-2 border-l border-b border-slate-300 w-10 text-white">AKSI</th>}
                  </tr>
                  <tr className="bg-slate-800 text-white text-center font-bold text-[9px] font-mono border-b border-slate-300">
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-amber-950 text-amber-100">IURAN RT (rtTunai)</th>
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-slate-700 text-slate-100">KAS KECIL (rtPettyCash)</th>
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-indigo-950 text-indigo-100">RT BANK (rtBank)</th>
                    <th rowSpan={2} className="border-r border-slate-300 p-1 bg-amber-900 text-white text-center leading-tight">TOTAL SALDO RT</th>
                    
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-sky-950 text-sky-100">ROMBONG TUNAI (rombongTunai)</th>
                    <th colSpan={3} className="border-r border-slate-300 p-1 bg-emerald-950 text-emerald-100">ROMBONG BANK (rombongBank)</th>
                    <th rowSpan={2} className="border-r border-slate-300 p-1 bg-sky-900 text-white text-center leading-tight">TOTAL SALDO RB</th>
                  </tr>
                  <tr className="bg-slate-100 text-slate-700 font-bold text-[8px] font-mono text-center border-b border-slate-300">
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-amber-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-amber-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-amber-100/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-slate-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-slate-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-slate-200/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-indigo-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-indigo-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-indigo-100/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-sky-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-sky-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-sky-100/55">SALDO</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-emerald-50">DEBIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-11 bg-emerald-50">KREDIT</th>
                    <th className="border-r border-slate-300 p-0.5 w-12 bg-emerald-100/55">SALDO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Row 1: Saldo Awal */}
                  <tr className="bg-amber-50/15 text-slate-900 font-extrabold font-sans hover:bg-slate-100/70 transition">
                    <td className="border-r border-slate-300 p-2 text-center font-mono">-</td>
                    <td className="border-r border-slate-300 p-2 font-mono text-center">-</td>
                    <td className="border-r border-slate-300 p-2 tracking-wide text-slate-700 bg-slate-100/30">
                      📌 SALDO AWAL PERIODE SEBELUMNYA
                    </td>
                    <td className="border-r border-slate-300 p-2 font-semibold text-center">-</td>
                    
                    {/* rtTunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-800 font-mono bg-amber-100/50">
                      {saldoAwal.rtTunai > 0 ? saldoAwal.rtTunai.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* rtPettyCash */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-800 font-mono bg-slate-100/55">
                      {saldoAwal.rtPettyCash > 0 ? saldoAwal.rtPettyCash.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* rtBank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-800 font-mono bg-indigo-100/50">
                      {saldoAwal.rtBank > 0 ? saldoAwal.rtBank.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* Total RT */}
                    <td className="border-r border-slate-300 p-1.5 text-right text-amber-950 font-mono bg-amber-100 font-black">
                      {saldoAwal.totalRT > 0 ? saldoAwal.totalRT.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Rombong Tunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-sky-800 font-mono bg-sky-50">
                      {saldoAwal.rb > 0 ? saldoAwal.rb.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Rombong Bank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-emerald-800 font-mono bg-emerald-50">
                      {saldoAwal.bk > 0 ? saldoAwal.bk.toLocaleString('id-ID') : 'Rp 0'}
                    </td>

                    {/* Total RB */}
                    <td className="border-r border-slate-300 p-1.5 text-right text-sky-950 font-mono bg-sky-100 font-black">
                      {saldoAwal.totalRombong > 0 ? saldoAwal.totalRombong.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Grand Total */}
                    <td className="p-2 text-right font-mono bg-indigo-55 text-indigo-950 font-black text-center text-[11px] border-b border-indigo-200">
                      {saldoAwal.total > 0 ? saldoAwal.total.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    {isLoggedIn && <td className="border-l border-slate-300 p-2 bg-slate-50"></td>}
                  </tr>

                  {visibleTabularRows.length === 0 ? (
                    <tr>
                      <td colSpan={isLoggedIn ? 23 : 22} className="border-b border-slate-300 py-12 text-center text-slate-400 font-bold bg-slate-50/20 select-none font-sans">
                        Tidak ada aliran transaksi kas terdaftar pada bulan/periode terpilih
                      </td>
                    </tr>
                  ) : (
                    visibleTabularRows.map((row) => {
                      const isBank = row.sumberKas === 'rtBank' || row.sumberKas === 'rombongBank';
                      const isPemasukan = row.tipe === 'pemasukan';
                      const codeColorClass = isBank ? (isPemasukan ? 'text-blue-600 font-semibold' : 'text-red-650 font-semibold') : 'text-slate-800 font-medium';
                      const descColorClass = isBank ? (isPemasukan ? 'text-blue-600 font-semibold' : 'text-red-650 font-bold') : 'text-slate-800';

                      return (
                        <tr key={row.id} className="hover:bg-slate-50 border-b border-slate-150 transition">
                          <td className="border-r border-slate-300 p-2 text-center font-mono font-medium text-slate-600" title={row.tanggalInput ? `Tanggal Input: ${row.tanggalInput}` : 'Tanggal Transaksi'}>
                            <div>{row.tanggal}</div>
                            {row.tanggalInput && row.tanggalInput !== row.tanggal && (
                              <div className="text-[9px] text-slate-400 font-normal">In: {row.tanggalInput}</div>
                            )}
                          </td>
                          <td className={`border-r border-slate-300 p-2 font-mono text-center text-[9px] ${codeColorClass}`}>
                            {row.noBukti}
                          </td>
                          <td className={`border-r border-slate-300 p-2 max-w-xs truncate ${descColorClass}`} title={row.deskripsi}>
                            {row.deskripsi}
                          </td>
                          <td className="border-r border-slate-300 p-2 text-slate-600 font-semibold capitalize truncate max-w-[80px]" title={row.petugas}>
                            {row.petugas}
                          </td>
                          
                          {/* rtTunai */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtTunaiDebit > 0 ? 'text-blue-650 font-bold' : 'text-slate-400'}`}>
                            {row.rtTunaiDebit > 0 ? row.rtTunaiDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtTunaiKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtTunaiKredit > 0 ? row.rtTunaiKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-slate-700 font-mono bg-amber-50/20">
                            {row.rtTunaiRunning.toLocaleString('id-ID')}
                          </td>

                          {/* rtPettyCash */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtPettyCashDebit > 0 ? 'text-blue-650 font-bold' : 'text-slate-400'}`}>
                            {row.rtPettyCashDebit > 0 ? row.rtPettyCashDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtPettyCashKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtPettyCashKredit > 0 ? row.rtPettyCashKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-slate-700 font-mono bg-slate-50/40">
                            {row.rtPettyCashRunning.toLocaleString('id-ID')}
                          </td>

                          {/* rtBank */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtBankDebit > 0 ? 'text-blue-650 font-bold' : 'text-slate-400'}`}>
                            {row.rtBankDebit > 0 ? row.rtBankDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rtBankKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtBankKredit > 0 ? row.rtBankKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-slate-700 font-mono bg-indigo-50/20">
                            {row.rtBankRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Total RT */}
                          <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-amber-50 font-bold text-amber-950">
                            {row.totalRTRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Rombong Tunai */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rbDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.rbDebit > 0 ? row.rbDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.rbKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rbKredit > 0 ? row.rbKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-sky-800 font-mono bg-sky-50/15">
                            {row.rbRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Rombong Bank */}
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.bkDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.bkDebit > 0 ? row.bkDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-1.5 text-right font-mono ${row.bkKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.bkKredit > 0 ? row.bkKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-1.5 text-right text-emerald-800 font-mono bg-emerald-50/15">
                            {row.bkRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Total RB */}
                          <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-sky-50 font-bold text-sky-950">
                            {row.totalRombongRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Grand Total */}
                          <td className="p-2 text-right font-mono bg-indigo-50/20 text-indigo-950 font-black text-center text-[10.5px]">
                            {row.totalRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Action revert */}
                          {canModify && (
                            <td className="border-l border-slate-300 p-1 text-center bg-slate-50/30">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => {
                                    const orig = ledger.find(l => l.id === row.id);
                                    if (orig) setEditingLedgerEntry(orig);
                                  }}
                                  className="p-1 text-slate-450 hover:text-sky-600 hover:bg-sky-50 rounded transition cursor-pointer"
                                  title="Edit Transaksi Tabelaris"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleDeleteLedgerEntry(row.id, row.jumlah, row.tipe, row.sumberKas, row.deskripsi)}
                                  className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                  title="Hapus Transaksi Tabelaris"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-rose-650" />
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                  
                  {/* Row 4: Saldo Akhir */}
                  <tr className="bg-slate-100 text-slate-900 font-black font-sans border-t-2 border-slate-400 hover:bg-slate-150/55 transition">
                    <td className="border-r border-slate-300 p-3 text-center font-mono text-[9px]">TOTAL</td>
                    <td className="border-r border-slate-300 p-3 font-mono">-</td>
                    <td className="border-r border-slate-300 p-3 tracking-wide uppercase">TOTAL DEBIT / KREDIT PERIODIK</td>
                    <td className="border-r border-slate-300 p-3">-</td>
                    
                    {/* rtTunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-amber-50">
                      {totalsTabular.rtTunaiDebit > 0 ? totalsTabular.rtTunaiDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-amber-50">
                      {totalsTabular.rtTunaiKredit > 0 ? totalsTabular.rtTunaiKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-900 font-mono bg-amber-100/50">
                      {totalsTabular.rtTunaiRunning.toLocaleString('id-ID')}
                    </td>

                    {/* rtPettyCash */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-slate-150/40">
                      {totalsTabular.rtPettyCashDebit > 0 ? totalsTabular.rtPettyCashDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-slate-150/40">
                      {totalsTabular.rtPettyCashKredit > 0 ? totalsTabular.rtPettyCashKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-900 font-mono bg-slate-200/65">
                      {totalsTabular.rtPettyCashRunning.toLocaleString('id-ID')}
                    </td>

                    {/* rtBank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-indigo-50/40">
                      {totalsTabular.rtBankDebit > 0 ? totalsTabular.rtBankDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-indigo-50/40">
                      {totalsTabular.rtBankKredit > 0 ? totalsTabular.rtBankKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-slate-900 font-mono bg-indigo-100/50">
                      {totalsTabular.rtBankRunning.toLocaleString('id-ID')}
                    </td>

                    {/* Total RT */}
                    <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-amber-200 text-amber-950 font-black">
                      {totalsTabular.totalRTRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Rombong Tunai */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-sky-50/40">
                      {totalsTabular.rbDebit > 0 ? totalsTabular.rbDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-sky-50/40">
                      {totalsTabular.rbKredit > 0 ? totalsTabular.rbKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-sky-950 font-mono bg-sky-100/50">
                      {totalsTabular.rbRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Rombong Bank */}
                    <td className="border-r border-slate-200 p-1.5 text-right text-blue-700 font-mono bg-emerald-50/40">
                      {totalsTabular.bkDebit > 0 ? totalsTabular.bkDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-1.5 text-right text-rose-700 font-mono bg-emerald-50/40">
                      {totalsTabular.bkKredit > 0 ? totalsTabular.bkKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-1.5 text-right text-emerald-950 font-mono bg-emerald-100/50">
                      {totalsTabular.bkRunning.toLocaleString('id-ID')}
                    </td>

                    {/* Total RB */}
                    <td className="border-r border-slate-300 p-1.5 text-right font-mono bg-sky-200 text-sky-950 font-black">
                      {totalsTabular.totalRombongRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Grand Total */}
                    <td className="p-2 text-right font-mono bg-indigo-150 text-indigo-950 font-black text-center text-[11px]">
                      {totalsTabular.totalRunning.toLocaleString('id-ID')}
                    </td>
                    {isLoggedIn && <td className="border-l border-slate-300 p-3 bg-slate-100"></td>}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* SINGLE-LINE PORTRAIT LIST */
          filteredLedger.length === 0 ? (
            <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center shadow-xs">
              <FileText className="w-10 h-10 text-slate-350 mx-auto mb-3" />
              <p className="text-slate-500 font-bold">Buku kas belum memiliki catatan transaksi</p>
              <p className="text-slate-400 text-xs mt-1">Sesuaikan filter pencarian atau mulailah mencatat.</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {filteredLedger.map((entry) => {
                const isPemasukan = entry.tipe === 'pemasukan';
                return (
                  <div 
                    key={entry.id} 
                    className={`p-5 rounded-2xl border transition duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs ${
                      isPemasukan 
                        ? 'bg-white border-emerald-100 hover:border-emerald-300' 
                        : 'bg-white border-rose-100 hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Circle icon */}
                      <div className={`p-3 rounded-xl shrink-0 border ${
                        isPemasukan 
                          ? 'bg-emerald-50 text-emerald-600 border-emerald-100' 
                          : 'bg-rose-50 text-rose-600 border-rose-100'
                      }`}>
                        {isPemasukan ? <ArrowUpRight className="w-5 h-5 pointer-events-none" /> : <ArrowDownLeft className="w-5 h-5 pointer-events-none" />}
                      </div>

                      <div className="space-y-1">
                        <h4 className="font-extrabold text-slate-900 text-sm md:text-base leading-snug flex items-center flex-wrap gap-2">
                          <span>{entry.deskripsi}</span>
                          {entry.fotoBase64 && allowedPhotos && (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt({ deskripsi: entry.deskripsi, fotoBase64: entry.fotoBase64!, fotoNamaFile: entry.fotoNamaFile || 'bukti_pembukuan.jpg' })}
                              className="px-2 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 hover:border-sky-350 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Lihat Bukti Foto / Nota"
                            >
                              <Receipt className="w-3 h-3 text-sky-600 pointer-events-none" />
                              Nota Bukti ({formatFileSize(getBase64SizeInBytes(entry.fotoBase64))})
                            </button>
                          )}
                          {allowedPhotos && (
                            <label className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 hover:border-slate-400 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer select-none">
                              <Camera className="w-3.5 h-3.5 text-slate-500 pointer-events-none" />
                              <span>{entry.fotoBase64 ? 'Ubah Nota' : 'Tambah Nota'}</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  try {
                                    const base64 = await compressImage(file);
                                    const updatedLedger = ledger.map(item => {
                                      if (item.id === entry.id) {
                                        return { ...item, fotoBase64: base64, fotoNamaFile: file.name };
                                      }
                                      return item;
                                    });
                                    setLedger(updatedLedger);
                                  } catch (err) {
                                    console.error(err);
                                    alert('Gagal mengunggah foto');
                                  }
                                }}
                              />
                            </label>
                          )}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            Tgl Transaksi: {entry.tanggal}
                          </span>
                          {entry.tanggalInput && (
                            <span className="flex items-center gap-1 font-semibold text-slate-500">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              Tgl Input: {entry.tanggalInput}
                            </span>
                          )}
                          <span className="flex items-center gap-1 font-semibold">
                            <Tag className="w-3.5 h-3.5 text-slate-400" />
                            {entry.kategori}
                          </span>
                          <span className="flex items-center gap-1 font-semibold">
                            <User className="w-3.5 h-3.5 text-slate-400" />
                            Petugas: {entry.petugas}
                          </span>
                          <span className="bg-slate-100 border border-slate-200 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase">
                            Akun: {entry.sumberKas}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-none pt-3 md:pt-0 border-slate-100">
                      <div className="text-left md:text-right">
                        <span className={`text-base md:text-lg font-extrabold font-mono tracking-tight ${
                          isPemasukan ? 'text-emerald-600' : 'text-rose-600'
                        }`}>
                          {isPemasukan ? '+' : '-'} Rp {entry.jumlah.toLocaleString('id-ID')}
                        </span>
                      </div>

                      {canModify && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingLedgerEntry(entry)}
                            className="p-2 text-slate-450 hover:text-sky-600 hover:bg-sky-50 rounded-xl transition cursor-pointer"
                            title="Modifikasi Transaksi"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLedgerEntry(entry.id, entry.jumlah, entry.tipe, entry.sumberKas, entry.deskripsi)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                            title="Hapus Transaksi (Memulihkan Kas)"
                            id={`del-tx-${entry.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>

      {/* Transaction Deletion Confirmation Modal */}
      {entryToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-150 text-center relative border-t-4 border-t-rose-500 animate-in zoom-in-95 duration-200">
            <button 
              onClick={() => setEntryToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
              title="Batal"
              id="cancel-del-tx"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="w-14 h-14 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4 text-rose-500">
              <Trash2 className="w-6 h-6 animate-pulse" />
            </div>
            <h3 className="text-slate-900 font-extrabold text-base mb-2">Hapus Catatan Transaksi</h3>
            <p className="text-slate-605 text-xs md:text-sm mb-6 leading-relaxed text-center">
              Apakah Anda yakin ingin menghapus data transaksi <strong className="text-slate-900 font-semibold font-mono bg-slate-50 px-1.5 py-0.5 rounded-md">"{entryToDelete.deskripsi}"</strong>?
              <br /><br />
              <span className="text-rose-650 font-bold">Pemberitahuan Sistem Kas:</span> Penghapusan ini bersifat otomatis dan akan <strong>membalikkan/merevert</strong> saldo keuangan sebesar:
              <br />
              <strong className="text-rose-600 font-extrabold text-base font-mono bg-rose-50/50 mt-2 block p-2 rounded-xl border border-rose-100/50">
                Rp {entryToDelete.jumlah.toLocaleString('id-ID')}
              </strong>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setEntryToDelete(null)}
                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => {
                  const { id, jumlah, tipe, sumberKas } = entryToDelete;
                  // Revert cash balance effect
                  const nextKas = { ...kas };
                  if (tipe === 'pemasukan') {
                    nextKas[sumberKas] -= jumlah;
                  } else {
                    nextKas[sumberKas] += jumlah;
                  }
                  updateKas(nextKas);

                  // Remove entry from ledger
                  const updatedLedger = ledger.filter(e => e.id !== id);
                  setLedger(updatedLedger);
                  setEntryToDelete(null);
                }}
                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-md"
                id="confirm-del-tx"
              >
                Hapus & Revert Kas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PDF Printable & Pratinjau Modal */}
      {showPrintPreview && isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-4 md:p-8 z-[100] overflow-y-auto animate-in fade-in duration-200">
          <style>{`
            @media print {
              @page {
                size: ${viewMode === 'tabelaris' ? 'landscape' : 'portrait'};
                margin: 6mm 8mm;
              }
              body {
                background-color: white !important;
                color: black !important;
                font-family: 'Inter', system-ui, sans-serif !important;
              }
              header, footer, nav, .no-print, button, select, input, #tab-dashboard, #tab-tagihan, #tab-buku_kas, .bg-slate-900\\/60 {
                display: none !important;
                visibility: hidden !important;
              }
              body * {
                visibility: hidden;
              }
              #printable-report-area, #printable-report-area * {
                visibility: visible;
              }
              #printable-report-area {
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

          <div className={`bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-2xl relative w-full animate-in zoom-in-95 duration-200 text-slate-800 my-8 ${viewMode === 'tabelaris' ? 'max-w-[1250px]' : 'max-w-4xl'}`}>
            {/* Top Toolbar (Invisible in General Print) */}
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 mb-6 no-print">
              <div>
                <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-1.5 font-sans">
                  <Printer className="w-5 h-5 text-sky-600" />
                  Pratinjau Lembar Bukti Buku Kas RT.008 RW.004
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Laporan cetak ini terstruktur secara rapi dalam format{' '}
                  <strong className="text-sky-700">{viewMode === 'tabelaris' ? 'Mendatar (Landscape) A4' : 'Tegak (Portrait) A4'}</strong>.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPrintPreview(false)}
                  className="px-4 py-2 border border-slate-250 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition cursor-pointer active:scale-95"
                >
                  Tutup Laporan
                </button>
                <button
                  onClick={() => {
                    const printableArea = document.getElementById('printable-report-area');
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
                              <title>Laporan Buku Kas RT.008 RW.004</title>
                              <style>
                                @page {
                                  size: A4 ${viewMode === 'tabelaris' ? 'landscape' : 'portrait'};
                                  margin: ${viewMode === 'tabelaris' ? '4mm 6mm' : '8mm 10mm'};
                                }
                                body {
                                  background-color: white !important;
                                  color: black !important;
                                  font-family: 'Inter', system-ui, -apple-system, sans-serif !important;
                                  padding: 10px;
                                  margin: 0;
                                  -webkit-print-color-adjust: exact !important;
                                  print-color-adjust: exact !important;
                                }
                                table {
                                  width: 100%;
                                  border-collapse: collapse;
                                  margin-top: 15px;
                                  margin-bottom: 20px;
                                }
                                th, td {
                                  border: 1px solid #cbd5e1 !important;
                                  padding: ${viewMode === 'tabelaris' ? '3px 4px' : '6px 8px'} !important;
                                  font-size: ${viewMode === 'tabelaris' ? '7.5px' : '11px'} !important;
                                  text-align: left;
                                }
                                th {
                                  background-color: #0f172a !important;
                                  color: white !important;
                                  font-weight: bold !important;
                                  font-family: monospace !important;
                                  text-transform: uppercase !important;
                                }
                                /* Enable colored cells during printing */
                                td.bg-amber-100\/40, td.bg-amber-100 { background-color: #fef3c7 !important; color: #78350f !important; }
                                td.bg-slate-100\/55, td.bg-slate-200 { background-color: #e2e8f0 !important; color: #1e293b !important; }
                                td.bg-indigo-100\/40, td.bg-indigo-100 { background-color: #e0e7ff !important; color: #1e1b4b !important; }
                                td.bg-sky-50, td.bg-sky-100 { background-color: #e0f2fe !important; color: #0c4a6e !important; }
                                td.bg-emerald-50, td.bg-emerald-100 { background-color: #d1fae5 !important; color: #064e3b !important; }
                                td.bg-indigo-50 { background-color: #e0e7ff !important; color: #1e1b4b !important; }
                                th.bg-slate-800 { background-color: #1e293b !important; color: white !important; }
                                th.bg-sky-900 { background-color: #0c4a6e !important; color: white !important; }
                                th.bg-amber-950 { background-color: #451a03 !important; color: #fef3c7 !important; }
                                th.bg-indigo-950 { background-color: #1e1b4b !important; color: #e0e7ff !important; }
                                th.bg-sky-950 { background-color: #082f49 !important; color: #e0f2fe !important; }
                                th.bg-emerald-950 { background-color: #022c22 !important; color: #d1fae5 !important; }
                                th.bg-sky-900 { background-color: #0c4a6e !important; color: white !important; }
                                th.bg-slate-900 { background-color: #0f172a !important; color: white !important; }
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
                  className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-md shadow-sky-600/10 transition active:scale-95 cursor-pointer"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Mulai Cetak / Cetak PDF 🖨️</span>
                </button>
              </div>
            </div>

            {/* Printable Area Wrapper */}
            <div id="printable-report-area" className="bg-white p-2 md:p-4 text-slate-950 font-sans">
              {/* Kop Surat Header */}
              <div className="border-b-4 border-double border-slate-950 pb-4 mb-6 text-center">
                <h2 className="text-sm md:text-base font-black font-sans tracking-wide text-slate-900 uppercase leading-tight">{rtTitle}</h2>
                <h3 className="text-xs md:text-sm font-extrabold font-sans text-slate-800 tracking-wide uppercase leading-tight mt-1">{rtAddress}</h3>
                {rtEmail && (
                  <p className="text-[10px] text-slate-500 font-medium tracking-wide mt-1 font-sans">
                    Email: {rtEmail}
                  </p>
                )}
              </div>

              {/* Document Metadata Block */}
              <div className="flex flex-col sm:flex-row justify-between items-baseline gap-2 mb-6 font-sans">
                <div>
                  <h1 className="text-lg md:text-xl font-black font-sans text-slate-910 uppercase tracking-tight">
                    LAPORAN BUKU KAS {viewMode === 'tabelaris' ? 'TABELARIS (SPREADSHEET)' : 'UMUT RT'}
                  </h1>
                  <p className="text-xs text-slate-600 mt-1">
                    Periode Laporan:{' '}
                    <strong className="text-slate-900 font-extrabold text-sm">
                      {selectedMonth === 'semua' && selectedYear === 'semua'
                        ? 'Semua Transaksi Buku Kas'
                        : `${selectedMonth !== 'semua' ? INDO_MONTHS.find(m => m.value === selectedMonth)?.name : 'Semua Bulan'} ${selectedYear !== 'semua' ? selectedYear : 'Semua Tahun'}`}
                    </strong>
                  </p>
                </div>
                <div className="text-xs text-slate-630 sm:text-right font-sans">
                  <p>Tanggal Cetak: <strong className="text-slate-900">Jumat, 22 Mei 2026</strong></p>
                  <p>Petugas Operator: <strong className="text-slate-900">{isLoggedIn && currentUser ? cleanSignatureName(currentUser.nama) + (currentUser.role === 'admin' ? ' (Admin)' : ' (Bendahara)') : 'Sistem Keuangan RT'}</strong></p>
                </div>
              </div>

              {viewMode === 'tabelaris' ? (
                /* LANDSCAPE TABULAR SPREADSHEET FOR PRINT */
                <div className="overflow-x-auto border border-slate-400 rounded-lg mb-6">
                  <table className="w-full min-w-[1700px] text-[9px] text-left text-slate-900 font-sans border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-center font-bold font-mono border-b border-slate-400 text-[9px]">
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 w-12 text-center text-white">TGL</th>
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 w-20 text-center text-white">NO BUKTI</th>
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 text-left min-w-[160px] text-white">KETERANGAN ALIRAN KAS</th>
                        <th rowSpan={3} className="border-r border-b border-slate-400 p-1 w-18 text-center text-white">PETUGAS</th>
                        <th colSpan={10} className="border-r border-b border-slate-400 p-1 bg-slate-800 text-white text-[9px]">TOTAL KAS RT (IURAN, KECIL & BANK)</th>
                        <th colSpan={7} className="border-r border-b border-slate-400 p-1 bg-sky-900 text-white text-[9px]">TOTAL KAS ROMBONG (TUNAI & BANK)</th>
                        <th rowSpan={3} className="border-b border-slate-400 p-1.5 bg-indigo-950 text-white font-black w-22 text-center">GRAND TOTAL KAS (KAS UMUM)</th>
                      </tr>
                      <tr className="bg-slate-800 text-white text-center font-bold text-[8.5px] font-mono border-b border-slate-400">
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-amber-950 text-amber-100">IURAN RT (rtTunai)</th>
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-slate-700 text-slate-100">KAS KECIL (rtPettyCash)</th>
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-indigo-950 text-indigo-100">RT BANK (rtBank)</th>
                        <th rowSpan={2} className="border-r border-slate-400 p-0.5 bg-amber-900 text-white text-center leading-tight">TOTAL SALDO RT</th>
                        
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-sky-950 text-sky-100">ROMBONG TUNAI (rombongTunai)</th>
                        <th colSpan={3} className="border-r border-slate-400 p-0.5 bg-emerald-950 text-emerald-100">ROMBONG BANK (rombongBank)</th>
                        <th rowSpan={2} className="border-r border-slate-400 p-0.5 bg-sky-900 text-white text-center leading-tight">TOTAL SALDO RB</th>
                      </tr>
                      <tr className="bg-slate-100 text-slate-700 font-bold text-[7.5px] font-mono text-center border-b border-slate-400">
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-amber-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-amber-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-amber-100/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-slate-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-slate-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-slate-200/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-indigo-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-indigo-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-indigo-100/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-sky-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-sky-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-sky-100/55">SALDO</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-emerald-50">D</th>
                        <th className="border-r border-slate-400 p-0.5 w-10 bg-emerald-50">K</th>
                        <th className="border-r border-slate-400 p-0.5 w-11 bg-emerald-100/55">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-350">
                      <tr className="bg-amber-50/15 font-bold">
                        <td className="border-r border-slate-400 p-1.5 text-center font-mono">-</td>
                        <td className="border-r border-slate-400 p-1.5 font-mono text-center">-</td>
                        <td className="border-r border-slate-400 p-1.5 uppercase font-black text-slate-700 bg-slate-100/35">SALDO SEBELUM PERIODE INI</td>
                        <td className="border-r border-slate-400 p-1.5 text-center">-</td>
                        
                        {/* rtTunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-800 bg-amber-100/40">
                          {saldoAwal.rtTunai > 0 ? saldoAwal.rtTunai.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* rtPettyCash */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-800 bg-slate-100/55">
                          {saldoAwal.rtPettyCash > 0 ? saldoAwal.rtPettyCash.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* rtBank */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-800 bg-indigo-100/40">
                          {saldoAwal.rtBank > 0 ? saldoAwal.rtBank.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* Total RT */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-amber-950 bg-amber-100 font-black">
                          {saldoAwal.totalRT > 0 ? saldoAwal.totalRT.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        {/* Rombong Tunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-900 bg-sky-50">
                          {saldoAwal.rb > 0 ? saldoAwal.rb.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        {/* Rombong Bank */}
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-emerald-900 bg-emerald-50">
                          {saldoAwal.bk > 0 ? saldoAwal.bk.toLocaleString('id-ID') : 'Rp 0'}
                        </td>

                        {/* Total RB */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-950 bg-sky-100 font-black">
                          {saldoAwal.totalRombong > 0 ? saldoAwal.totalRombong.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        {/* Grand Total */}
                        <td className="p-1.5 text-right font-mono bg-indigo-50 text-indigo-950 font-black text-center">
                          {saldoAwal.total > 0 ? saldoAwal.total.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                      </tr>

                      {visibleTabularRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-55/20 transition">
                          <td className="border-r border-slate-400 p-1.5 text-center font-mono text-slate-600" title={row.tanggalInput ? `Tanggal Input: ${row.tanggalInput}` : 'Tanggal Transaksi'}>
                            <div>{row.tanggal}</div>
                            {row.tanggalInput && row.tanggalInput !== row.tanggal && (
                              <div className="text-[8px] text-slate-400">In: {row.tanggalInput}</div>
                            )}
                          </td>
                          <td className="border-r border-slate-400 p-1.5 font-mono text-center text-[8px] text-slate-600">{row.noBukti}</td>
                          <td className="border-r border-slate-400 p-1.5 font-medium leading-tight text-slate-900">{row.deskripsi}</td>
                          <td className="border-r border-slate-400 p-1.5 capitalize text-slate-600 whitespace-nowrap">{row.petugas}</td>
                          
                          {/* rtTunai */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtTunaiDebit > 0 ? row.rtTunaiDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtTunaiKredit > 0 ? row.rtTunaiKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-705 bg-amber-50/15">{row.rtTunaiRunning.toLocaleString('id-ID')}</td>

                          {/* rtPettyCash */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtPettyCashDebit > 0 ? row.rtPettyCashDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtPettyCashKredit > 0 ? row.rtPettyCashKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-705 bg-slate-50/45">{row.rtPettyCashRunning.toLocaleString('id-ID')}</td>

                          {/* rtBank */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtBankDebit > 0 ? row.rtBankDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rtBankKredit > 0 ? row.rtBankKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-705 bg-indigo-50/15">{row.rtBankRunning.toLocaleString('id-ID')}</td>

                          {/* Total RT */}
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-755 bg-amber-50/45 font-bold">{row.totalRTRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Rombong Tunai */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rbDebit > 0 ? row.rbDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.rbKredit > 0 ? row.rbKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-900 bg-sky-50/15">{row.rbRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Rombong Bank */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.bkDebit > 0 ? row.bkDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono text-slate-600">{row.bkKredit > 0 ? row.bkKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-emerald-900 bg-emerald-50/15">{row.bkRunning.toLocaleString('id-ID')}</td>

                          {/* Total RB */}
                          <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-755 bg-sky-50/45 font-bold">{row.totalRombongRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Grand Total */}
                          <td className="p-1.5 text-right font-mono bg-indigo-50/20 text-slate-900 font-bold text-center">{row.totalRunning.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}

                      {/* Summary Row */}
                      <tr className="bg-slate-100 hover:bg-slate-150 font-black border-t-2 border-slate-400">
                        <td className="border-r border-slate-400 p-1.5 text-center text-[8px]">TOTAL</td>
                        <td className="border-r border-slate-400 p-1.5 font-mono">-</td>
                        <td className="border-r border-slate-400 p-1.5 tracking-wide">TOTAL DEBIT / KREDIT PERIODIK</td>
                        <td className="border-r border-slate-400 p-1.5">-</td>
                        
                        {/* rtTunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-amber-50">{totalsTabular.rtTunaiDebit > 0 ? totalsTabular.rtTunaiDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-amber-50">{totalsTabular.rtTunaiKredit > 0 ? totalsTabular.rtTunaiKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-900 bg-amber-100/50">{totalsTabular.rtTunaiRunning.toLocaleString('id-ID')}</td>

                        {/* rtPettyCash */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-slate-150/40">{totalsTabular.rtPettyCashDebit > 0 ? totalsTabular.rtPettyCashDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-slate-150/40">{totalsTabular.rtPettyCashKredit > 0 ? totalsTabular.rtPettyCashKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-900 bg-slate-200">{totalsTabular.rtPettyCashRunning.toLocaleString('id-ID')}</td>

                        {/* rtBank */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-indigo-50/40">{totalsTabular.rtBankDebit > 0 ? totalsTabular.rtBankDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-indigo-50/40">{totalsTabular.rtBankKredit > 0 ? totalsTabular.rtBankKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-slate-900 bg-indigo-100/55">{totalsTabular.rtBankRunning.toLocaleString('id-ID')}</td>

                        {/* Total RT */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono bg-amber-200 text-amber-950 font-black">{totalsTabular.totalRTRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Rombong Tunai */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-sky-50/40">{totalsTabular.rbDebit > 0 ? totalsTabular.rbDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-sky-50/40">{totalsTabular.rbKredit > 0 ? totalsTabular.rbKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-sky-950 bg-sky-100">{totalsTabular.rbRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Rombong Bank */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono bg-emerald-50/40">{totalsTabular.bkDebit > 0 ? totalsTabular.bkDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono bg-emerald-50/40">{totalsTabular.bkKredit > 0 ? totalsTabular.bkKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-400 p-1 text-right font-mono text-emerald-950 bg-emerald-100">{totalsTabular.bkRunning.toLocaleString('id-ID')}</td>

                        {/* Total RB */}
                        <td className="border-r border-slate-400 p-1 text-right font-mono bg-sky-200 text-sky-950 font-black">{totalsTabular.totalRombongRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Grand Total */}
                        <td className="p-1.5 text-right font-mono bg-indigo-150 text-indigo-950 font-black text-center">
                          {totalsTabular.totalRunning.toLocaleString('id-ID')}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                /* PORTRAIT JOURNAL LIST FOR PRINT */
                <>
                  {/* Transactions Table */}
                  <div className="overflow-x-auto border border-slate-300 rounded-xl mb-6">
                    <table className="w-full min-w-[850px] text-xs text-left text-slate-905 font-sans border-collapse">
                      <thead>
                        <tr className="bg-slate-100 text-slate-800 font-black border-b border-slate-300">
                          <th className="py-2.5 px-3 border-r border-slate-300 w-12 text-center font-mono animate-none">No</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-24">Tanggal</th>
                          <th className="py-2.5 px-3 border-r border-slate-300">Keterangan / Deskripsi Transaksi</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-28 animate-none">Kategori</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-24">Pintu Kas</th>
                          <th className="py-2.5 px-3 border-r border-slate-300 w-28 text-right">Debit / Pemasukan (Rp)</th>
                          <th className="py-2.5 px-3 text-right w-28">Kredit / Pengeluaran (Rp)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredLedger.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-12 text-center text-slate-400 font-bold bg-slate-50">
                              Tidak terdapat rincian transaksi buku kas pada saringan periodik terpilih.
                            </td>
                          </tr>
                        ) : (
                          [...filteredLedger]
                            .sort((a, b) => {
                              if (a.tanggal !== b.tanggal) {
                                return a.tanggal.localeCompare(b.tanggal);
                              }
                              return (a.id || '').localeCompare(b.id || '');
                            })
                            .map((entry, idx) => {
                              const isPemasukan = entry.tipe === 'pemasukan';
                            return (
                              <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50/20">
                                <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600 whitespace-nowrap">{entry.tanggal}</td>
                                <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900 leading-normal">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{entry.deskripsi}</span>
                                    {entry.fotoBase64 && allowedPhotos && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReceipt({ deskripsi: entry.deskripsi, fotoBase64: entry.fotoBase64!, fotoNamaFile: entry.fotoNamaFile || 'bukti_pembukuan.jpg' })}
                                        className="shrink-0 px-1.5 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 hover:border-sky-355 rounded text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                                        title="Lihat Bukti Foto / Nota"
                                      >
                                        <Receipt className="w-2.5 h-2.5 text-sky-600 pointer-events-none" />
                                        Nota ({formatFileSize(getBase64SizeInBytes(entry.fotoBase64))})
                                      </button>
                                    )}
                                    {allowedPhotos && (
                                      <label className="shrink-0 px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer select-none">
                                        <Camera className="w-2.5 h-2.5 text-slate-500 pointer-events-none" />
                                        <span>{entry.fotoBase64 ? 'Ubah' : '+ Nota'}</span>
                                        <input
                                          type="file"
                                          accept="image/*"
                                          className="hidden"
                                          onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (!file) return;
                                            try {
                                              const base64 = await compressImage(file);
                                              const updatedLedger = ledger.map(item => {
                                                if (item.id === entry.id) {
                                                  return { ...item, fotoBase64: base64, fotoNamaFile: file.name };
                                                }
                                                return item;
                                              });
                                              setLedger(updatedLedger);
                                            } catch (err) {
                                              console.error(err);
                                              alert('Gagal mengunggah foto');
                                            }
                                          }}
                                        />
                                      </label>
                                    )}
                                  </div>
                                </td>
                                <td className="py-2 px-3 border-r border-slate-200 text-slate-600">{entry.kategori}</td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-[10px] text-slate-500">{entry.sumberKas}</td>
                                <td className="py-2 px-3 border-r border-slate-200 text-right font-mono font-semibold text-emerald-700">
                                  {isPemasukan ? `Rp ${entry.jumlah.toLocaleString('id-ID')}` : '-'}
                                </td>
                                <td className="py-2 px-3 text-right font-mono font-semibold text-rose-700">
                                  {!isPemasukan ? `Rp ${entry.jumlah.toLocaleString('id-ID')}` : '-'}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Totals Box Display */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 font-sans">
                    <div className="bg-emerald-50/50 border border-emerald-200 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">TOTAL SELURUH DEBIT (MASUK)</span>
                      <span className="text-base font-black font-mono text-emerald-900 mt-1">
                        Rp {totalPemasukan.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="bg-rose-50/50 border border-rose-200 p-4 rounded-xl flex flex-col justify-between">
                      <span className="text-[10px] uppercase font-black tracking-wider text-rose-800">TOTAL SELURUH KREDIT (KELUAR)</span>
                      <span className="text-base font-black font-mono text-rose-900 mt-1">
                        Rp {totalPengeluaran.toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className={`p-4 rounded-xl border flex flex-col justify-between ${saldoBersih >= 0 ? 'bg-sky-50/50 border-sky-200 text-sky-950' : 'bg-amber-50/50 border-amber-200 text-amber-950'}`}>
                      <span className="text-[10px] uppercase font-black tracking-wider">SALDO BERSIH PERIODE FILTER</span>
                      <span className="text-base font-black font-mono mt-1">
                        {saldoBersih < 0 ? '-' : ''} Rp {Math.abs(saldoBersih).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Signature section */}
              <div className="grid grid-cols-2 gap-12 text-center pt-8 border-t border-dashed border-slate-250 text-xs font-sans text-slate-800">
                <div className="space-y-16">
                  <p className="font-semibold text-slate-600">Disiapkan Oleh (Bendahara RT):</p>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-900 underline text-sm">{bendaharaName}</p>
                    <p className="text-[10px] text-slate-500">Staf Keuangan & Pembukuan RT</p>
                  </div>
                </div>
                <div className="space-y-16">
                  <p className="font-semibold text-slate-600">Mengetahui & Menyetujui (Ketua RT.008):</p>
                  <div className="space-y-1">
                    <p className="font-extrabold text-slate-905 underline text-sm">{adminName}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">Ketua RT.008 RW.004 PERUMTAS 3</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Receipt Preview Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-[999] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative max-w-xl w-full flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5 text-sky-600" />
                <h4 className="font-extrabold text-slate-800 text-sm truncate max-w-xs md:max-w-md">
                  Bukti Nota: {selectedReceipt.deskripsi}
                </h4>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-full hover:bg-slate-155 transition"
                title="Tutup"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex items-center justify-center bg-slate-100 flex-1 min-h-[300px]">
              <img
                src={selectedReceipt.fotoBase64}
                alt={selectedReceipt.deskripsi}
                className="max-h-[50vh] object-contain rounded-xl border border-slate-200 shadow-sm"
              />
            </div>
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-150 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-mono overflow-hidden text-ellipsis whitespace-nowrap max-w-[200px]" title={`${selectedReceipt.fotoNamaFile} (${formatFileSize(getBase64SizeInBytes(selectedReceipt.fotoBase64))})`}>
                {selectedReceipt.fotoNamaFile} ({formatFileSize(getBase64SizeInBytes(selectedReceipt.fotoBase64))})
              </span>
              <button
                type="button"
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = selectedReceipt.fotoBase64;
                  link.download = selectedReceipt.fotoNamaFile;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                }}
                className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-sky-600/10 transition active:scale-97"
              >
                <Download className="w-3.5 h-3.5" />
                Ekspor / Unduh Original
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modification Modal (Admin/Bendahara only) */}
      {editingLedgerEntry && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 z-[998] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xl relative max-w-lg w-full flex flex-col max-h-[90vh]">
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-150 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-sky-600" />
                <h4 className="font-extrabold text-slate-800 text-sm">
                  Modifikasi Detail Transaksi
                </h4>
              </div>
              <button
                onClick={() => setEditingLedgerEntry(null)}
                className="text-slate-400 hover:text-slate-700 cursor-pointer p-1.5 rounded-full hover:bg-slate-155 transition"
                title="Batal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleUpdateLedgerEntry} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-amber-50 text-amber-800 border border-amber-200 p-3.5 rounded-2xl text-xs leading-relaxed">
                💡 <strong>Catatan Kepatuhan:</strong> Anda mengubah metadata pencatatan (tanggal transaksi, tanggal input, deskripsi, kategori, petugas). Hal ini aman dilakukan tanpa mengganggu saldo kas Anda saat ini.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 font-mono">ID Transaksi (Terkunci)</label>
                <div className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-500 font-bold font-mono">
                  {editingLedgerEntry.id}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Transaksi / Kejadian</label>
                  <input
                    required
                    type="date"
                    value={editingLedgerEntry.tanggal}
                    onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, tanggal: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Input / Catat</label>
                  <input
                    required
                    type="date"
                    value={editingLedgerEntry.tanggalInput || editingLedgerEntry.tanggal}
                    onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, tanggalInput: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Deskripsi Lengkap Transaksi</label>
                <input
                  required
                  type="text"
                  value={editingLedgerEntry.deskripsi}
                  onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, deskripsi: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Kategori Transaksi</label>
                  <input
                    required
                    type="text"
                    value={editingLedgerEntry.kategori}
                    onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, kategori: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Petugas / Pembuat</label>
                  <input
                     required
                     type="text"
                     value={editingLedgerEntry.petugas}
                     onChange={e => setEditingLedgerEntry({ ...editingLedgerEntry, petugas: e.target.value })}
                     className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 font-mono">Nilai & Tipe Transaksi (Terkunci)</label>
                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-700 font-extrabold font-mono flex items-center justify-between">
                  <span>Rp {editingLedgerEntry.jumlah.toLocaleString('id-ID')}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                    editingLedgerEntry.tipe === 'pemasukan' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                  }`}>
                    {editingLedgerEntry.tipe}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-150 pt-4 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingLedgerEntry(null)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold cursor-pointer transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-5 py-2 rounded-xl text-xs cursor-pointer shadow-lg shadow-sky-600/10 transition"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
