import React, { useState } from 'react';
import { LedgerEntry, Balance, AppUser } from '../types';
import { getBase64SizeInBytes, formatFileSize } from '../utils/fileSizeUtils';
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
  Eye
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
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.zIndex = '-9999';
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
      );
      doc.write(cleanedHtml);
      doc.close();
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

  // Find unique categories for dropdown filter
  const categories = ['Semua', ...Array.from(new Set(ledger.map(entry => entry.kategori)))];

  const handleDeleteLedgerEntry = (id: string, jumlah: number, tipe: 'pemasukan' | 'pengeluaran', sumberKas: keyof Balance, deskripsi: string) => {
    if (!isLoggedIn || (currentUser?.role !== 'admin' && currentUser?.role !== 'bendahara')) return;
    setEntryToDelete({ id, jumlah, tipe, sumberKas, deskripsi });
  };

  // Precompute running balances in ascending chronological order over EVERYTHING
  const tabularData = React.useMemo(() => {
    const sortedAll = [...ledger].sort((a, b) => {
      if (a.tanggal !== b.tanggal) {
        return a.tanggal.localeCompare(b.tanggal);
      }
      return a.id.localeCompare(b.id);
    });

    const seqCounters: Record<string, { ksub: number; bsub: number }> = {};
    let pcRunning = 0;
    let rtRunning = 0;
    let rbRunning = 0;
    let bkRunning = 0;

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

      let pcDebit = 0, pcKredit = 0;
      let rtDebit = 0, rtKredit = 0;
      let rbDebit = 0, rbKredit = 0;
      let bkDebit = 0, bkKredit = 0;

      const val = item.jumlah;
      const isPemasukan = item.tipe === 'pemasukan';

      if (item.sumberKas === 'rtPettyCash') {
        if (isPemasukan) {
          pcDebit = val;
          pcRunning += val;
        } else {
          pcKredit = val;
          pcRunning -= val;
        }
      } else if (item.sumberKas === 'rtTunai') {
        if (isPemasukan) {
          rtDebit = val;
          rtRunning += val;
        } else {
          rtKredit = val;
          rtRunning -= val;
        }
      } else if (item.sumberKas === 'rombongTunai') {
        if (isPemasukan) {
          rbDebit = val;
          rbRunning += val;
        } else {
          rbKredit = val;
          rbRunning -= val;
        }
      } else if (item.sumberKas === 'rtBank' || item.sumberKas === 'rombongBank') {
        if (isPemasukan) {
          bkDebit = val;
          bkRunning += val;
        } else {
          bkKredit = val;
          bkRunning -= val;
        }
      }

      return {
        ...item,
        noBukti,
        pcDebit,
        pcKredit,
        pcRunning,
        rtDebit,
        rtKredit,
        rtRunning,
        rbDebit,
        rbKredit,
        rbRunning,
        bkDebit,
        bkKredit,
        bkRunning,
        totalRunning: pcRunning + rtRunning + rbRunning + bkRunning
      };
    });
  }, [ledger]);

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
      return { pc: 0, rt: 0, rb: 0, bk: 0, total: 0 };
    }

    const priorEntries = tabularData.filter(e => e.tanggal < startBoundaryDate);
    if (priorEntries.length === 0) {
      return { pc: 0, rt: 0, rb: 0, bk: 0, total: 0 };
    }

    const lastPrior = priorEntries[priorEntries.length - 1];
    return {
      pc: lastPrior.pcRunning,
      rt: lastPrior.rtRunning,
      rb: lastPrior.rbRunning,
      bk: lastPrior.bkRunning,
      total: lastPrior.totalRunning
    };
  }, [tabularData, startBoundaryDate]);

  // General Filtered Ledger list for the portrait mode "Jurnal"
  const filteredLedger = ledger.filter(entry => {
    const matchesSearch = entry.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          entry.petugas.toLowerCase().includes(searchTerm.toLowerCase());
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
    .filter(e => e.tipe === 'pemasukan')
    .reduce((sum, e) => sum + e.jumlah, 0);

  const totalPengeluaran = filteredLedger
    .filter(e => e.tipe === 'pengeluaran')
    .reduce((sum, e) => sum + e.jumlah, 0);

  const saldoBersih = totalPemasukan - totalPengeluaran;

  // Filtered tabular rows (sorted ascending) for the tabular spreadsheet display
  const visibleTabularRows = React.useMemo(() => {
    return tabularData.filter(entry => {
      const matchesSearch = entry.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.kategori.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            entry.petugas.toLowerCase().includes(searchTerm.toLowerCase());
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
    let sumPcDebit = 0, sumPcKredit = 0;
    let sumRtDebit = 0, sumRtKredit = 0;
    let sumRbDebit = 0, sumRbKredit = 0;
    let sumBkDebit = 0, sumBkKredit = 0;

    visibleTabularRows.forEach(row => {
      sumPcDebit += row.pcDebit;
      sumPcKredit += row.pcKredit;
      sumRtDebit += row.rtDebit;
      sumRtKredit += row.rtKredit;
      sumRbDebit += row.rbDebit;
      sumRbKredit += row.rbKredit;
      sumBkDebit += row.bkDebit;
      sumBkKredit += row.bkKredit;
    });

    const lastRow = visibleTabularRows[visibleTabularRows.length - 1];
    
    return {
      pcDebit: sumPcDebit,
      pcKredit: sumPcKredit,
      pcRunning: lastRow ? lastRow.pcRunning : saldoAwal.pc,
      rtDebit: sumRtDebit,
      rtKredit: sumRtKredit,
      rtRunning: lastRow ? lastRow.rtRunning : saldoAwal.rt,
      rbDebit: sumRbDebit,
      rbKredit: sumRbKredit,
      rbRunning: lastRow ? lastRow.rbRunning : saldoAwal.rb,
      bkDebit: sumBkDebit,
      bkKredit: sumBkKredit,
      bkRunning: lastRow ? lastRow.bkRunning : saldoAwal.bk,
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
        'Petty Cash (Debit)',
        'Petty Cash (Kredit)',
        'Saldo Petty Cash',
        'Iuran RT (Debit)',
        'Iuran RT (Kredit)',
        'Saldo Iuran RT',
        'Iuran Rombong (Debit)',
        'Iuran Rombong (Kredit)',
        'Saldo Rombong',
        'Bank (Debit)',
        'Bank (Kredit)',
        'Saldo Bank',
        'Saldo Cash + Bank'
      ];

      const rowSaldoAwal = [
        '',
        '',
        'SALDO PERIODE LALU',
        '',
        '',
        '',
        saldoAwal.pc,
        '',
        '',
        saldoAwal.rt,
        '',
        '',
        saldoAwal.rb,
        '',
        '',
        saldoAwal.bk,
        saldoAwal.total
      ];

      const rows = visibleTabularRows.map((row) => [
        row.tanggal,
        row.noBukti,
        `"${row.deskripsi.replace(/"/g, '""')}"`,
        `"${row.petugas.replace(/"/g, '""')}"`,
        row.pcDebit || '',
        row.pcKredit || '',
        row.pcRunning,
        row.rtDebit || '',
        row.rtKredit || '',
        row.rtRunning,
        row.rbDebit || '',
        row.rbKredit || '',
        row.rbRunning,
        row.bkDebit || '',
        row.bkKredit || '',
        row.bkRunning,
        row.totalRunning
      ]);

      const rowSaldoAkhir = [
        'Saldo Akhir',
        '',
        'TOTAL PERIODIK',
        '',
        totalsTabular.pcDebit,
        totalsTabular.pcKredit,
        totalsTabular.pcRunning,
        totalsTabular.rtDebit,
        totalsTabular.rtKredit,
        totalsTabular.rtRunning,
        totalsTabular.rbDebit,
        totalsTabular.rbKredit,
        totalsTabular.rbRunning,
        totalsTabular.bkDebit,
        totalsTabular.bkKredit,
        totalsTabular.bkRunning,
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
      
      const rows = filteredLedger.map((entry, idx) => [
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

  const isAuthorized = currentUser && (currentUser.role === 'admin' || currentUser.role === 'bendahara' || currentUser.role === 'sekretaris');
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
              <table className="min-w-[1400px] border-collapse border-spacing-0 text-[11px] font-sans">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 text-center font-bold font-mono border-b border-slate-300">
                    <th rowSpan={2} className="border-r border-b border-slate-300 p-2.5 w-20">TANGGAL</th>
                    <th rowSpan={2} className="border-r border-b border-slate-300 p-2.5 w-32">NO BUKTI</th>
                    <th rowSpan={2} className="border-r border-b border-slate-300 p-2.5 text-left min-w-[200px]">KAS / KETERANGAN TRANSAKSI</th>
                    <th rowSpan={2} className="border-r border-b border-slate-300 p-2.5 w-24">PETUGAS</th>
                    <th colSpan={3} className="border-r border-b border-slate-300 p-1.5 bg-slate-150/40">PETTY CASH</th>
                    <th colSpan={3} className="border-r border-b border-slate-300 p-1.5 bg-amber-50 text-amber-900 border-amber-200">IURAN RT</th>
                    <th colSpan={3} className="border-r border-b border-slate-300 p-1.5 bg-sky-50 text-sky-900 border-sky-250">IURAN ROMBONG</th>
                    <th colSpan={3} className="border-r border-b border-slate-300 p-1.5 bg-emerald-50 text-emerald-900 border-emerald-250">KAS BANK RT</th>
                    <th rowSpan={2} className="border-b border-slate-300 p-2.5 bg-indigo-50 text-indigo-950 font-black w-28">URUT TOTAL SALDO</th>
                    {isLoggedIn && <th rowSpan={2} className="p-2 border-l border-b border-slate-300 w-10">AKSI</th>}
                  </tr>
                  <tr className="bg-slate-50 text-slate-700 font-bold text-[9px] font-mono text-center border-b border-slate-300">
                    {/* Petty cash */}
                    <th className="border-r border-slate-300 p-1 w-14">DEBIT</th>
                    <th className="border-r border-slate-300 p-1 w-14">KREDIT</th>
                    <th className="border-r border-slate-300 p-1 w-16 bg-slate-100/50">SALDO</th>
                    {/* Iuran RT */}
                    <th className="border-r border-slate-300 p-1 w-14 bg-amber-50/40">DEBIT</th>
                    <th className="border-r border-slate-300 p-1 w-14 bg-amber-50/40">KREDIT</th>
                    <th className="border-r border-slate-300 p-1 w-16 bg-amber-50">SALDO</th>
                    {/* Iuran Rombong */}
                    <th className="border-r border-slate-300 p-1 w-14 bg-sky-50/40">DEBIT</th>
                    <th className="border-r border-slate-300 p-1 w-14 bg-sky-50/40">KREDIT</th>
                    <th className="border-r border-slate-300 p-1 w-16 bg-sky-50">SALDO</th>
                    {/* Bank */}
                    <th className="border-r border-slate-300 p-1 w-14 bg-emerald-50/40">DEBIT</th>
                    <th className="border-r border-slate-300 p-1 w-14 bg-emerald-50/40">KREDIT</th>
                    <th className="border-r border-slate-300 p-1 w-16 bg-emerald-50">SALDO</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* Row 1: Saldo Awal */}
                  <tr className="bg-slate-50 text-slate-900 font-extrabold font-sans hover:bg-slate-100/70 transition">
                    <td className="border-r border-slate-300 p-2.5 text-center font-mono">-</td>
                    <td className="border-r border-slate-300 p-2.5 font-mono text-center">-</td>
                    <td className="border-r border-slate-300 p-2.5 tracking-wide text-slate-700 bg-slate-100/30">
                      📌 SALDO AWAL PERIODE KAS SEBELUMNYA
                    </td>
                    <td className="border-r border-slate-300 p-2.5 font-semibold text-center">-</td>
                    
                    {/* Petty Cash */}
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-2 text-right text-slate-800 font-mono bg-slate-100/50">
                      {saldoAwal.pc > 0 ? saldoAwal.pc.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Iuran RT */}
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-2 text-right text-amber-800 font-mono bg-amber-50">
                      {saldoAwal.rt > 0 ? saldoAwal.rt.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Rombong */}
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-2 text-right text-sky-800 font-mono bg-sky-50">
                      {saldoAwal.rb > 0 ? saldoAwal.rb.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Bank */}
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-200 p-2 text-right text-slate-400 font-mono">-</td>
                    <td className="border-r border-slate-300 p-2 text-right text-emerald-800 font-mono bg-emerald-50">
                      {saldoAwal.bk > 0 ? saldoAwal.bk.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    
                    {/* Total */}
                    <td className="p-2 text-right font-mono bg-indigo-50/70 text-indigo-950 font-black">
                      {saldoAwal.total > 0 ? saldoAwal.total.toLocaleString('id-ID') : 'Rp 0'}
                    </td>
                    {isLoggedIn && <td className="border-l border-slate-300 p-2.5 bg-slate-50"></td>}
                  </tr>

                  {visibleTabularRows.length === 0 ? (
                    <tr>
                      <td colSpan={isLoggedIn ? 18 : 17} className="border-b border-slate-300 py-12 text-center text-slate-400 font-bold bg-slate-50/20 select-none font-sans">
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
                          <td className="border-r border-slate-300 p-2.5 text-center font-mono font-medium text-slate-600">{row.tanggal}</td>
                          <td className={`border-r border-slate-300 p-2.5 font-mono text-center text-[9px] ${codeColorClass}`}>
                            {row.noBukti}
                          </td>
                          <td className={`border-r border-slate-300 p-2.5 max-w-xs truncate ${descColorClass}`} title={row.deskripsi}>
                            {row.deskripsi}
                          </td>
                          <td className="border-r border-slate-300 p-2.5 text-slate-600 font-semibold capitalize truncate max-w-[80px]" title={row.petugas}>
                            {row.petugas}
                          </td>
                          
                          {/* Petty Cash */}
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.pcDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.pcDebit > 0 ? row.pcDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.pcKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.pcKredit > 0 ? row.pcKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-2 text-right text-slate-700 font-mono bg-slate-50/50">
                            {row.pcRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Iuran RT */}
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.rtDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtDebit > 0 ? row.rtDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.rtKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rtKredit > 0 ? row.rtKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-2 text-right text-amber-800 font-mono bg-amber-50/20">
                            {row.rtRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Iuran Rombong */}
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.rbDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.rbDebit > 0 ? row.rbDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.rbKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.rbKredit > 0 ? row.rbKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-2 text-right text-sky-800 font-mono bg-sky-50/20">
                            {row.rbRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Bank */}
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.bkDebit > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>
                            {row.bkDebit > 0 ? row.bkDebit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className={`border-r border-slate-200 p-2 text-right font-mono ${row.bkKredit > 0 ? 'text-rose-600 font-bold' : 'text-slate-400'}`}>
                            {row.bkKredit > 0 ? row.bkKredit.toLocaleString('id-ID') : '-'}
                          </td>
                          <td className="border-r border-slate-300 p-2 text-right text-emerald-800 font-mono bg-emerald-50/20">
                            {row.bkRunning.toLocaleString('id-ID')}
                          </td>
                          
                          {/* Safe cash total */}
                          <td className="p-2 text-right font-mono bg-indigo-50/20 text-indigo-950 font-bold">
                            {row.totalRunning.toLocaleString('id-ID')}
                          </td>

                          {/* Action revert */}
                          {canModify && (
                            <td className="border-l border-slate-300 p-2 text-center bg-slate-50/30">
                              <button
                                onClick={() => handleDeleteLedgerEntry(row.id, row.jumlah, row.tipe, row.sumberKas, row.deskripsi)}
                                className="p-1 text-slate-450 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                                title="Hapus Transaksi Tabelaris"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          )}
                        </tr>
                      );
                    })
                  )}
                  
                  {/* Row 4: Saldo Akhir */}
                  <tr className="bg-slate-100 text-slate-900 font-black font-sans border-t-2 border-slate-400 hover:bg-slate-150/55 transition">
                    <td className="border-r border-slate-300 p-3 text-center font-mono text-[10px]">TOTAL</td>
                    <td className="border-r border-slate-300 p-3 font-mono">-</td>
                    <td className="border-r border-slate-300 p-3 tracking-wide uppercase">TOTAL DEBIT / KREDIT PERIODIK</td>
                    <td className="border-r border-slate-300 p-3">-</td>
                    
                    {/* Petty Cash */}
                    <td className="border-r border-slate-200 p-2 text-right text-blue-700 font-mono bg-slate-150/40">
                      {totalsTabular.pcDebit > 0 ? totalsTabular.pcDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-2 text-right text-rose-700 font-mono bg-slate-150/40">
                      {totalsTabular.pcKredit > 0 ? totalsTabular.pcKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-right text-slate-900 font-mono bg-slate-200/65">
                      {totalsTabular.pcRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Iuran RT */}
                    <td className="border-r border-slate-200 p-2 text-right text-blue-700 font-mono bg-amber-50/40">
                      {totalsTabular.rtDebit > 0 ? totalsTabular.rtDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-2 text-right text-rose-700 font-mono bg-amber-50/40">
                      {totalsTabular.rtKredit > 0 ? totalsTabular.rtKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-right text-amber-950 font-mono bg-amber-100/50">
                      {totalsTabular.rtRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Rombong */}
                    <td className="border-r border-slate-200 p-2 text-right text-blue-700 font-mono bg-sky-50/40">
                      {totalsTabular.rbDebit > 0 ? totalsTabular.rbDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-2 text-right text-rose-700 font-mono bg-sky-50/40">
                      {totalsTabular.rbKredit > 0 ? totalsTabular.rbKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-right text-sky-950 font-mono bg-sky-100/50">
                      {totalsTabular.rbRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Bank */}
                    <td className="border-r border-slate-200 p-2 text-right text-blue-700 font-mono bg-emerald-50/40">
                      {totalsTabular.bkDebit > 0 ? totalsTabular.bkDebit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-200 p-2 text-right text-rose-700 font-mono bg-emerald-50/40">
                      {totalsTabular.bkKredit > 0 ? totalsTabular.bkKredit.toLocaleString('id-ID') : '-'}
                    </td>
                    <td className="border-r border-slate-300 p-2 text-right text-emerald-950 font-mono bg-emerald-100/50">
                      {totalsTabular.bkRunning.toLocaleString('id-ID')}
                    </td>
                    
                    {/* Total */}
                    <td className="p-2 text-right font-mono bg-indigo-150 text-indigo-950 font-black text-[12px]">
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
                          {entry.fotoBase64 ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt({ deskripsi: entry.deskripsi, fotoBase64: entry.fotoBase64!, fotoNamaFile: entry.fotoNamaFile || 'bukti_pembukuan.jpg' })}
                              className="px-2 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 hover:border-sky-350 rounded-md text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                              title="Lihat Bukti Foto / Nota"
                            >
                              <Receipt className="w-3 h-3 text-sky-600 pointer-events-none" />
                              Nota Bukti ({formatFileSize(getBase64SizeInBytes(entry.fotoBase64))})
                            </button>
                          ) : null}
                        </h4>
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 font-mono">
                          <span className="flex items-center gap-1 font-semibold">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {entry.tanggal}
                          </span>
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
                        <button
                          onClick={() => handleDeleteLedgerEntry(entry.id, entry.jumlah, entry.tipe, entry.sumberKas, entry.deskripsi)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Hapus Transaksi (Memulihkan Kas)"
                          id={`del-tx-${entry.id}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
                                  size: ${viewMode === 'tabelaris' ? 'landscape' : 'portrait'};
                                  margin: 8mm 10mm;
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
                  <table className="w-full min-w-[1400px] text-[10px] text-left text-slate-900 font-sans border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-800 text-center font-bold font-mono border-b border-slate-400">
                        <th rowSpan={2} className="border-r border-b border-slate-400 p-1.5 w-16">TGL</th>
                        <th rowSpan={2} className="border-r border-b border-slate-400 p-1.5 w-24">NO BUKTI</th>
                        <th rowSpan={2} className="border-r border-b border-slate-400 p-1.5 text-left">KETERANGAN ALIRAN KAS</th>
                        <th rowSpan={2} className="border-r border-b border-slate-400 p-1.5 w-20">PETUGAS</th>
                        <th colSpan={3} className="border-r border-b border-slate-400 p-1 bg-slate-150/40">PETTY CASH</th>
                        <th colSpan={3} className="border-r border-b border-slate-400 p-1 bg-amber-50 border-amber-250">IURAN RT</th>
                        <th colSpan={3} className="border-r border-b border-slate-400 p-1 bg-sky-50 border-sky-250">IURAN ROMBONG</th>
                        <th colSpan={3} className="border-r border-b border-slate-400 p-1 bg-emerald-50 border-emerald-250">KAS BANK RT</th>
                        <th rowSpan={2} className="border-b border-slate-400 p-1.5 bg-indigo-50 text-indigo-950 font-black w-24">SALDO GABUNG</th>
                      </tr>
                      <tr className="bg-slate-50 text-slate-700 font-bold text-[8px] font-mono text-center border-b border-slate-400">
                        <th className="border-r border-slate-300 p-1 w-12">D</th>
                        <th className="border-r border-slate-300 p-1 w-12">K</th>
                        <th className="border-r border-slate-350 p-1 w-14 bg-slate-100/50">SALDO</th>
                        <th className="border-r border-slate-300 p-1 w-12 bg-amber-50">D</th>
                        <th className="border-r border-slate-300 p-1 w-12 bg-amber-50">K</th>
                        <th className="border-r border-slate-350 p-1 w-14 bg-amber-100/30">SALDO</th>
                        <th className="border-r border-slate-300 p-1 w-12 bg-sky-50">D</th>
                        <th className="border-r border-slate-300 p-1 w-12 bg-sky-50">K</th>
                        <th className="border-r border-slate-350 p-1 w-14 bg-sky-100/30">SALDO</th>
                        <th className="border-r border-slate-300 p-1 w-12 bg-emerald-50">D</th>
                        <th className="border-r border-slate-300 p-1 w-12 bg-emerald-50">K</th>
                        <th className="border-r border-slate-350 p-1 w-14 bg-emerald-100/30">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-350">
                      <tr className="bg-slate-55 font-bold">
                        <td className="border-r border-slate-400 p-1.5 text-center font-mono">-</td>
                        <td className="border-r border-slate-400 p-1.5 font-mono text-center">-</td>
                        <td className="border-r border-slate-400 p-1.5 uppercase font-black text-slate-700">SALDO SEBELUM PERIODE INI</td>
                        <td className="border-r border-slate-400 p-1.5 text-center">-</td>
                        
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-slate-800 bg-slate-100/40">
                          {saldoAwal.pc > 0 ? saldoAwal.pc.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-amber-900 bg-amber-50">
                          {saldoAwal.rt > 0 ? saldoAwal.rt.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-sky-900 bg-sky-50">
                          {saldoAwal.rb > 0 ? saldoAwal.rb.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-300 p-1 text-right text-slate-400">-</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-emerald-900 bg-emerald-50">
                          {saldoAwal.bk > 0 ? saldoAwal.bk.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                        
                        <td className="p-1.5 text-right font-mono bg-indigo-50 text-indigo-950 font-black">
                          {saldoAwal.total > 0 ? saldoAwal.total.toLocaleString('id-ID') : 'Rp 0'}
                        </td>
                      </tr>

                      {visibleTabularRows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-55/20 transition">
                          <td className="border-r border-slate-400 p-1.5 text-center font-mono whitespace-nowrap text-slate-600">{row.tanggal}</td>
                          <td className="border-r border-slate-400 p-1.5 font-mono text-center text-[8px] text-slate-600">{row.noBukti}</td>
                          <td className="border-r border-slate-400 p-1.5 font-medium leading-tight text-slate-900">{row.deskripsi}</td>
                          <td className="border-r border-slate-400 p-1.5 capitalize text-slate-600 whitespace-nowrap">{row.petugas}</td>
                          
                          {/* Petty Cash */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.pcDebit > 0 ? row.pcDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.pcKredit > 0 ? row.pcKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-450 p-1 text-right font-mono text-slate-705 bg-slate-50">{row.pcRunning.toLocaleString('id-ID')}</td>
                          
                          {/* RT */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.rtDebit > 0 ? row.rtDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.rtKredit > 0 ? row.rtKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-450 p-1 text-right font-mono text-amber-900 bg-amber-50/20">{row.rtRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Rombong */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.rbDebit > 0 ? row.rbDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.rbKredit > 0 ? row.rbKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-450 p-1 text-right font-mono text-sky-900 bg-sky-50/20">{row.rbRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Bank */}
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.bkDebit > 0 ? row.bkDebit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-300 p-1 text-right font-mono">{row.bkKredit > 0 ? row.bkKredit.toLocaleString('id-ID') : '-'}</td>
                          <td className="border-r border-slate-450 p-1 text-right font-mono text-emerald-900 bg-emerald-50/20">{row.bkRunning.toLocaleString('id-ID')}</td>
                          
                          {/* Safe cash */}
                          <td className="p-1.5 text-right font-mono bg-indigo-50/20 text-slate-900 font-bold">{row.totalRunning.toLocaleString('id-ID')}</td>
                        </tr>
                      ))}

                      {/* Summary Row */}
                      <tr className="bg-slate-100 hover:bg-slate-150 font-black border-t-2 border-slate-400">
                        <td className="border-r border-slate-400 p-1.5 text-center text-[8px]">TOTAL</td>
                        <td className="border-r border-slate-400 p-1.5 font-mono">-</td>
                        <td className="border-r border-slate-400 p-1.5 tracking-wide">TOTAL DEBIT / KREDIT PERIODIK</td>
                        <td className="border-r border-slate-400 p-1.5">-</td>
                        
                        {/* Petty Cash */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono">{totalsTabular.pcDebit > 0 ? totalsTabular.pcDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono">{totalsTabular.pcKredit > 0 ? totalsTabular.pcKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-slate-900 bg-slate-200">{totalsTabular.pcRunning.toLocaleString('id-ID')}</td>
                        
                        {/* RT */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono">{totalsTabular.rtDebit > 0 ? totalsTabular.rtDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono">{totalsTabular.rtKredit > 0 ? totalsTabular.rtKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-amber-950 bg-amber-100">{totalsTabular.rtRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Rombong */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono">{totalsTabular.rbDebit > 0 ? totalsTabular.rbDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono">{totalsTabular.rbKredit > 0 ? totalsTabular.rbKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-sky-950 bg-sky-100">{totalsTabular.rbRunning.toLocaleString('id-ID')}</td>
                        
                        {/* Bank */}
                        <td className="border-r border-slate-300 p-1 text-right text-blue-800 font-mono">{totalsTabular.bkDebit > 0 ? totalsTabular.bkDebit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-300 p-1 text-right text-rose-800 font-mono">{totalsTabular.bkKredit > 0 ? totalsTabular.bkKredit.toLocaleString('id-ID') : '-'}</td>
                        <td className="border-r border-slate-450 p-1 text-right font-mono text-emerald-950 bg-emerald-100">{totalsTabular.bkRunning.toLocaleString('id-ID')}</td>
                        
                        <td className="p-1.5 text-right font-mono bg-indigo-150 text-indigo-950 font-black text-xs">
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
                          filteredLedger.map((entry, idx) => {
                            const isPemasukan = entry.tipe === 'pemasukan';
                            return (
                              <tr key={entry.id} className="border-b border-slate-200 hover:bg-slate-50/20">
                                <td className="py-2 px-3 border-r border-slate-200 text-center font-mono text-slate-500">{idx + 1}</td>
                                <td className="py-2 px-3 border-r border-slate-200 font-mono text-slate-600 whitespace-nowrap">{entry.tanggal}</td>
                                <td className="py-2 px-3 border-r border-slate-200 font-semibold text-slate-900 leading-normal">
                                  <div className="flex items-center justify-between gap-2">
                                    <span>{entry.deskripsi}</span>
                                    {entry.fotoBase64 ? (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedReceipt({ deskripsi: entry.deskripsi, fotoBase64: entry.fotoBase64!, fotoNamaFile: entry.fotoNamaFile || 'bukti_pembukuan.jpg' })}
                                        className="shrink-0 px-1.5 py-0.5 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-150 hover:border-sky-355 rounded text-[9px] font-bold flex items-center gap-0.5 transition cursor-pointer"
                                        title="Lihat Bukti Foto / Nota"
                                      >
                                        <Receipt className="w-2.5 h-2.5 text-sky-600 pointer-events-none" />
                                        Nota ({formatFileSize(getBase64SizeInBytes(entry.fotoBase64))})
                                      </button>
                                    ) : null}
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

    </div>
  );
}
