import React, { useState } from 'react';
import { LedgerEntry, Balance, AppUser } from '../types';
import { 
  isBillingPayment, 
  isPenarikanKolektor, 
  getCollectorBalancesForPeriod 
} from '../utils/collectorUtils';
import { 
  BookOpen, 
  Coins, 
  Building, 
  Activity, 
  CheckCircle2, 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Filter, 
  AlertCircle, 
  User, 
  MapPin, 
  Calendar,
  Lock,
  Unlock,
  ClipboardCheck,
  Search,
  Check,
  RotateCcw,
  ArrowLeftRight
} from 'lucide-react';

interface BukuKolektorProps {
  ledger: LedgerEntry[];
  kas: Balance;
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  yearsList?: number[];
  addLedgerEntry?: (entry: Omit<LedgerEntry, 'id'>) => void;
  users?: AppUser[];
  onApproveRombongPayment?: (id: string) => Promise<void>;
  onRejectRombongPayment?: (id: string) => Promise<void>;
}

const INDONESIAN_MONTHS = [
  { value: 1, label: 'Januari' },
  { value: 2, label: 'Februari' },
  { value: 3, label: 'Maret' },
  { value: 4, label: 'April' },
  { value: 5, label: 'Mei' },
  { value: 6, label: 'Juni' },
  { value: 7, label: 'Juli' },
  { value: 8, label: 'Agustus' },
  { value: 9, label: 'September' },
  { value: 10, label: 'Oktober' },
  { value: 11, label: 'November' },
  { value: 12, label: 'Desember' }
];

export default function BukuKolektor({
  ledger,
  kas,
  isLoggedIn,
  currentUser,
  yearsList = [2024, 2025, 2026, 2027, 2028],
  addLedgerEntry,
  users = [],
  onApproveRombongPayment,
  onRejectRombongPayment
}: BukuKolektorProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'semua'>(currentMonth);
  const [activeSubTab, setActiveSubTab] = useState<'tunai' | 'bank' | 'penarikan_kolektor' | 'setor_bank'>('tunai');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter officers list
  const collectorsList = users.filter(u => u.role === 'kolektor' || u.role === 'admin' || u.role === 'bendahara');
  
  // Penarikan Form State
  const [showDrawForm, setShowDrawForm] = useState(false);
  const [drawCollectorId, setDrawCollectorId] = useState('');
  const [customCollectorName, setCustomCollectorName] = useState('');
  const [drawSector, setDrawSector] = useState<'rtPettyCash' | 'rombongTunai'>('rtPettyCash');
  const [drawAmount, setDrawAmount] = useState('');
  const [drawDate, setDrawDate] = useState(new Date().toISOString().split('T')[0]);
  const [drawNotes, setDrawNotes] = useState('');
  const [formSuccessMsg, setFormSuccessMsg] = useState('');

  // Local verification helper (reconciliation check list saved to localStorage)
  const [verifiedIds, setVerifiedIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_kolektor_verified_ids');
    return saved ? JSON.parse(saved) : [];
  });

  const toggleVerifyId = (id: string) => {
    setVerifiedIds(prev => {
      const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
      localStorage.setItem('perumtas_rt08_kolektor_verified_ids', JSON.stringify(next));
      return next;
    });
  };

  const clearAllVerified = () => {
    if (confirm('Apakah Anda yakin ingin mengatur ulang semua stempel verifikasi pada halaman ini?')) {
      setVerifiedIds([]);
      localStorage.removeItem('perumtas_rt08_kolektor_verified_ids');
    }
  };

  // Helper to safely parse dates in YYYY-MM-DD
  const parseEntryDate = (tanggalStr: string) => {
    const parts = tanggalStr.split('-');
    return {
      year: parts[0] ? parseInt(parts[0], 10) : 0,
      month: parts[1] ? parseInt(parts[1], 10) : 0,
      day: parts[2] ? parseInt(parts[2], 10) : 0
    };
  };

  // 1. Filter ledger entries by selected year and month
  const isKolektor2 = isLoggedIn && currentUser && (
    currentUser.username.toLowerCase().includes('kolektor2') || 
    currentUser.nama.toLowerCase().includes('kolektor2')
  );

  const allowedLedger = ledger.filter(entry => {
    if (isKolektor2) {
      const isRombongKas = entry.sumberKas === 'rombongTunai' || entry.sumberKas === 'rombongBank';
      const desc = (entry.deskripsi || '').toLowerCase();
      const cat = (entry.kategori || '').toLowerCase();
      const isRombongDesc = desc.includes('rombong') || desc.includes('lapak') || cat.includes('rombong');
      return isRombongKas || isRombongDesc;
    }
    return true;
  });

  const monthlyLedger = allowedLedger.filter(entry => {
    const { year, month } = parseEntryDate(entry.tanggal);
    const matchesYear = year === selectedYear;
    const matchesMonth = selectedMonth === 'semua' || month === selectedMonth;
    return matchesYear && matchesMonth;
  });

  // 3. Math calculations for Tunai vs Bank collections
  // Cash Billing Collections (rtTunai, rtPettyCash, rombongTunai)
  const cashPayments = monthlyLedger.filter(entry => 
    isBillingPayment(entry) && 
    (entry.sumberKas === 'rtTunai' || entry.sumberKas === 'rtPettyCash' || entry.sumberKas === 'rombongTunai')
  );

  // Bank / E-Wallet / QRIS Billing Collections (rtBank, rombongBank)
  const bankPayments = monthlyLedger.filter(entry => 
    isBillingPayment(entry) && 
    (entry.sumberKas === 'rtBank' || entry.sumberKas === 'rombongBank')
  );

  // Penarikan oleh Bendahara (Tarik dari Kolektor)
  const penarikanTransfers = monthlyLedger.filter(entry => 
    isPenarikanKolektor(entry)
  );

  // Setor Bank (Movements of cash from Cash Drawer to Bank)
  const setorBankTransfers = monthlyLedger.filter(entry => 
    entry.kategori === 'Setor Bank' && 
    entry.tipe === 'pengeluaran' &&
    (entry.sumberKas === 'rtTunai' || entry.sumberKas === 'rtPettyCash' || entry.sumberKas === 'rombongTunai')
  );

  // Aggregates
  const totalCashCollected = cashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
  const totalBankCollected = bankPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
  const totalPenarikan = penarikanTransfers.reduce((acc, entry) => acc + entry.jumlah, 0);
  const totalDepositedToBank = setorBankTransfers.reduce((acc, entry) => acc + entry.jumlah, 0);
  
  // Sisa Tunai di Tangan Kolektor (Fisik di lapangan belum diserahterimakan)
  const remainingRTInCollector = collectorsList.reduce((sum, u) => {
    const collectorName = u.nama;
    const rtBal = getCollectorBalancesForPeriod(allowedLedger, u.username, collectorName, 'rtPettyCash', {
      month: selectedMonth,
      year: selectedYear
    });
    return sum + rtBal.remaining;
  }, 0);

  const remainingRombongInCollector = collectorsList.reduce((sum, u) => {
    const collectorName = u.nama;
    const rombongBal = getCollectorBalancesForPeriod(allowedLedger, u.username, collectorName, 'rombongTunai', {
      month: selectedMonth,
      year: selectedYear
    });
    return sum + rombongBal.remaining;
  }, 0);

  const remainingCashInCollector = remainingRTInCollector + remainingRombongInCollector;

  // Sisa Tunai di Tangan Bendahara (Sudah ditarik bendahara tapi belum disetor ke bank)
  const remainingCashInBendahara = (() => {
    const cumulativeLedger = allowedLedger.filter(entry => {
      const { year, month } = parseEntryDate(entry.tanggal);
      if (selectedYear) {
        if (year > selectedYear) return false;
        if (year === selectedYear && selectedMonth !== 'semua') {
          if (month > (selectedMonth as number)) return false;
        }
      }
      return true;
    });

    const cumPenarikans = cumulativeLedger.filter(entry => isPenarikanKolektor(entry));
    const cumDeposits = cumulativeLedger.filter(entry => {
      const desc = (entry.deskripsi || '').toLowerCase();
      return entry.kategori === 'Setor Bank' || 
             desc.includes('setor bank') || 
             desc.includes('penyetoran');
    });

    const totalCumPenarikan = cumPenarikans.reduce((sum, entry) => sum + entry.jumlah, 0);
    const totalCumDeposits = cumDeposits.reduce((sum, entry) => sum + entry.jumlah, 0);

    return Math.max(0, totalCumPenarikan - totalCumDeposits);
  })();

  // Reusable collector balance calculation
  const getCollectorBalanceInfo = (colId: string, sector: 'rtPettyCash' | 'rombongTunai') => {
    const matchedUser = collectorsList.find(u => u.username === colId);
    const collectorName = matchedUser ? matchedUser.nama : colId;
    return getCollectorBalancesForPeriod(allowedLedger, colId, collectorName, sector, {
      month: selectedMonth,
      year: selectedYear
    });
  };

  // Dynamic calculation for selected collector in current view filter
  const getSelectedCollectorBalanceInfo = () => {
    return getCollectorBalanceInfo(drawCollectorId, drawSector);
  };

  const collectorBal = getSelectedCollectorBalanceInfo();

  // Verification Permission
  const canVerify = isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara');

  // Filter lists based on search bar text
  const query = searchTerm.toLowerCase();
  
  const filteredCashList = cashPayments.filter(entry => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const pet = (entry.petugas || '').toLowerCase();
    const sum = (entry.sumberKas || '').toLowerCase();
    return desc.includes(query) || pet.includes(query) || sum.includes(query);
  });

  const filteredBankList = bankPayments.filter(entry => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const pet = (entry.petugas || '').toLowerCase();
    const sum = (entry.sumberKas || '').toLowerCase();
    return desc.includes(query) || pet.includes(query) || sum.includes(query);
  });

  const filteredPenarikanList = penarikanTransfers.filter(entry => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const pet = (entry.petugas || '').toLowerCase();
    const sum = (entry.sumberKas || '').toLowerCase();
    return desc.includes(query) || pet.includes(query) || sum.includes(query);
  });

  const filteredSetorList = setorBankTransfers.filter(entry => {
    const desc = (entry.deskripsi || '').toLowerCase();
    const pet = (entry.petugas || '').toLowerCase();
    return desc.includes(query) || pet.includes(query);
  });

  // Filter officers list is declared at the top of the component

  const handleFormSubmitPenarikan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!addLedgerEntry) {
      alert('Callback addLedgerEntry tidak terdefinisi.');
      return;
    }

    const amountNum = parseFloat(drawAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Masukkan nominal penarikan yang valid (lebih dari 0)!');
      return;
    }

    if (!drawCollectorId) {
      alert('Mohon pilih kolektor penyetor terlebih dahulu!');
      return;
    }

    const collectorBal = getSelectedCollectorBalanceInfo();
    if (collectorBal.remaining <= 0) {
      alert('Proses Ditolak: Sisa hasil iuran/tagihan untuk Kolektor ini sudah ditarik oleh Bendahara/Admin atau bernilai Rp 0!');
      return;
    }

    if (amountNum > collectorBal.remaining) {
      alert(`Proses Ditolak: Jumlah yang ditarik (Rp ${amountNum.toLocaleString('id-ID')}) melebihi sisa dana hasil tagihan di Kolektor (Maksimal Rp ${collectorBal.remaining.toLocaleString('id-ID')})!`);
      return;
    }

    const matchedUser = collectorsList.find(u => u.username === drawCollectorId);
    const collectorName = matchedUser ? matchedUser.nama : drawCollectorId;

    const labelSektor = drawSector === 'rtPettyCash' ? 'RT 08' : 'Rombong Kuliner';
    const notesStr = drawNotes ? ` (${drawNotes})` : '';

    // Record the penarikan entry
    addLedgerEntry({
      tanggal: drawDate,
      deskripsi: `Penarikan Dana Kolektor: Serah terima iuran tunai sektor ${labelSektor} oleh Bendahara dari ${collectorName}${notesStr}`,
      jumlah: amountNum,
      tipe: 'pemasukan',
      sumberKas: drawSector,
      kategori: 'Penarikan Dana Kolektor',
      petugas: currentUser?.nama || 'Bendahara RT 08'
    });

    setFormSuccessMsg(`Berhasil mencatatkan serah terima uang tunai Rp ${amountNum.toLocaleString('id-ID')} dari ${collectorName} ke kas ${labelSektor}.`);
    
    // Clear Form Fields
    setDrawAmount('');
    setDrawNotes('');
    setDrawCollectorId('');
    setCustomCollectorName('');
    
    // Close & show success brief
    setTimeout(() => {
      setFormSuccessMsg('');
    }, 6000);
  };

  // Friendly human format for dates
  const formatIndonesianDate = (tanggalStr: string) => {
    const parts = tanggalStr.split('-');
    if (parts.length !== 3) return tanggalStr;
    const day = parts[2];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const year = parts[0];
    const monthName = INDONESIAN_MONTHS[monthIndex]?.label || parts[1];
    return `${day} ${monthName} ${year}`;
  };

  const getKasBadgeColor = (sumber: keyof Balance) => {
    switch(sumber) {
      case 'rtTunai': return 'bg-indigo-100 border-indigo-200 text-indigo-850';
      case 'rtPettyCash': return 'bg-indigo-100 border-indigo-200 text-indigo-850';
      case 'rombongTunai': return 'bg-orange-100 border-orange-200 text-orange-850';
      case 'rtBank': return 'bg-sky-100 border-sky-200 text-sky-850';
      case 'rombongBank': return 'bg-emerald-100 border-emerald-250 text-emerald-850';
      default: return 'bg-slate-100 border-slate-200 text-slate-800';
    }
  };

  const getKasLabel = (sumber: keyof Balance) => {
    switch(sumber) {
      case 'rtTunai': return 'Kas Kecil';
      case 'rtPettyCash': return 'Kas Kecil';
      case 'rombongTunai': return 'Rombong Tunai';
      case 'rtBank': return 'RT Bank';
      case 'rombongBank': return 'Rombong Bank';
      default: return sumber;
    }
  };

  return (
    <div className="space-y-4" id="buku-kolektor-container">
      
      {/* Premium Header Banner - Compacted */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 rounded-2xl p-4 sm:p-5 text-white relative overflow-hidden shadow-lg border border-indigo-700/30">
        <div className="absolute top-0 right-0 -translate-y-1/3 translate-x-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 bg-purple-550/20 border border-purple-400/30 text-purple-200 px-2 rounded-full text-[9px] tracking-widest font-mono font-bold uppercase py-0.5">
              <ClipboardCheck className="w-3 h-3" />
              Reconciliation &amp; Audit Tool
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">Validasi Kolektor &amp; Bendahara</h1>
            <p className="text-slate-350 text-[11px] max-w-2xl leading-normal font-sans">
              Lembar kerja pengawasan bersama untuk menyinkronkan pelunasan iuran <strong>Tunai (Fisik)</strong> dan transfer <strong>Bank (QRIS)</strong>. Membantu memantau sisa tunai di tangan kolektor hingga penarikan kas oleh bendahara.
            </p>
          </div>

          {/* Quick Info Box - Compact */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-2.5 rounded-xl flex items-center gap-2 shrink-0 self-start md:self-center">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[9px] font-semibold text-purple-250 font-mono uppercase tracking-wider leading-none">Peran Pengguna</p>
              <p className="text-xs font-bold text-white leading-tight mt-0.5">
                {currentUser?.nama || 'Petugas Tamu'} 
              </p>
              <span className="text-[8.5px] bg-purple-600 border border-purple-500 text-purple-100 font-bold px-1 py-0.25 rounded-md uppercase font-mono tracking-wider inline-block mt-0.5 leading-none">
                {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'bendahara' ? 'Bendahara' : currentUser?.role === 'kolektor' ? 'Kolektor' : 'Saksi'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Filters Bar - Compact */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-wrap gap-2 items-center justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1 bg-slate-800/40 border border-white/15 px-2 py-1 rounded-lg text-[10px] text-slate-200 font-mono">
              <Filter className="w-3 h-3 text-slate-300" />
              <span>Saring Data:</span>
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 text-slate-900 font-bold text-[11px] py-1 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-mono cursor-pointer transition hover:bg-slate-50"
            >
              {yearsList.map(y => (
                <option key={y} value={y} className="bg-white text-slate-900 font-mono">{y} Masehi</option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'semua' ? 'semua' : parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 text-slate-900 font-bold text-[11px] py-1 px-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-purple-400 font-sans cursor-pointer transition hover:bg-slate-50"
            >
              <option value="semua" className="bg-white text-slate-900 font-sans font-bold">Semua Bulan Kumulatif</option>
              {INDONESIAN_MONTHS.map(m => (
                <option key={m.value} value={m.value} className="bg-white text-slate-900 font-sans">{m.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            {/* Draw Funds toggler for Treasurer and Admins */}
            {(currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
              <button
                onClick={() => setShowDrawForm(!showDrawForm)}
                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-550 active:scale-95 px-3 py-1.5 rounded-lg text-[11px] font-bold transition cursor-pointer flex items-center gap-1"
              >
                <Coins className="w-3.5 h-3.5" />
                <span>{showDrawForm ? 'Tutup Form' : 'Tarik Tunai dari Kolektor'}</span>
              </button>
            )}

            {verifiedIds.length > 0 && (
              <button
                onClick={clearAllVerified}
                className="flex items-center gap-1 hover:bg-white/10 text-white border border-white/10 active:scale-95 px-2.5 py-1 rounded-lg text-[10px] font-semibold font-mono transition cursor-pointer"
                title="Reset Tanda Verifikasi di Browser Ini"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Validasi ({verifiedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Dynamic Collector Balances At-a-Glance Widget - Simple & Compact */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 sm:p-4 space-y-2.5 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-1.5 border-b border-slate-200/60 pb-2">
          <div>
            <h3 className="font-extrabold text-xs text-slate-800 tracking-wide flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-purple-750" />
              <span>Rekap Sisa Dana Fisik di Tangan Kolektor</span>
            </h3>
            <p className="text-[10px] text-slate-500 font-medium">Uang hasil iuran warga/lapak yang secara fisik masih dipegang kolektor dan belum diserahkan ke bendahara.</p>
          </div>
          <span className="text-[9px] font-mono bg-purple-100/80 border border-purple-200 text-purple-800 px-2 py-0.5 rounded-md font-bold leading-tight select-none">
            {selectedMonth === 'semua' ? 'Kumulatif' : `Bulan ${INDONESIAN_MONTHS.find(m => m.value === selectedMonth)?.label}`} {selectedYear}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {collectorsList.map(u => {
            const rtBal = getCollectorBalanceInfo(u.username, 'rtPettyCash');
            const rombongBal = getCollectorBalanceInfo(u.username, 'rombongTunai');
            const totalRemaining = rtBal.remaining + rombongBal.remaining;
            const hasFunds = totalRemaining > 0;

            return (
              <div 
                key={u.id} 
                className={`p-2.5 rounded-xl border transition duration-150 ${
                  hasFunds 
                    ? 'bg-amber-50/50 border-amber-200/90 shadow-2xs' 
                    : 'bg-white border-slate-200'
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${hasFunds ? 'bg-amber-500 animate-ping' : 'bg-slate-350'}`} />
                    <div>
                      <p className="text-xs font-bold text-slate-800 leading-none">{u.nama}</p>
                      <p className="text-[9px] text-slate-450 font-mono mt-0.5">@{u.username}</p>
                    </div>
                  </div>
                  {hasFunds ? (
                    <span className="text-[8.5px] font-extrabold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded font-mono">
                      Menampung Hasil
                    </span>
                  ) : (
                    <span className="text-[8.5px] font-bold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded font-mono">
                      Nihil
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                  {/* Sektor RT */}
                  <div className="p-1 px-1.5 rounded bg-white/80 border border-slate-100/85">
                    <span className="text-[8px] font-mono font-bold text-slate-450 block uppercase tracking-wider">Iuran RT</span>
                    <div className="flex justify-between items-center mt-0.5 font-sans leading-none">
                      <span className="text-[8.5px] text-slate-450">Terkumpul</span>
                      <span className="font-semibold text-slate-700">Rp {rtBal.totalCollected.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans mt-0.5 leading-none">
                      <span className="text-[8.5px] text-slate-450">Disetor</span>
                      <span className="font-semibold text-indigo-700">Rp {rtBal.totalPenarikan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans mt-1 pt-1 leading-none border-t border-dashed border-slate-100">
                      <span className="text-[8.5px] font-bold text-slate-500">Sisa</span>
                      <span className={rtBal.remaining > 0 ? "font-black text-amber-600 text-[10.5px] font-mono" : "font-semibold text-slate-400 font-mono"}>
                        Rp {rtBal.remaining.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>

                  {/* Sektor Rombong */}
                  <div className="p-1 px-1.5 rounded bg-white/80 border border-slate-100/85">
                    <span className="text-[8px] font-mono font-bold text-slate-450 block uppercase tracking-wider">Sewa Rombong</span>
                    <div className="flex justify-between items-center mt-0.5 font-sans leading-none">
                      <span className="text-[8.5px] text-slate-450">Terkumpul</span>
                      <span className="font-semibold text-slate-700">Rp {rombongBal.totalCollected.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans mt-0.5 leading-none">
                      <span className="text-[8.5px] text-slate-450">Disetor</span>
                      <span className="font-semibold text-indigo-700">Rp {rombongBal.totalPenarikan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center font-sans mt-1 pt-1 leading-none border-t border-dashed border-slate-100">
                      <span className="text-[8.5px] font-bold text-slate-500">Sisa</span>
                      <span className={rombongBal.remaining > 0 ? "font-black text-amber-600 text-[10.5px] font-mono" : "font-semibold text-slate-400 font-mono"}>
                        Rp {rombongBal.remaining.toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-1.5 flex justify-between items-center text-[10px] font-bold bg-slate-100/50 p-1.5 rounded-lg border border-slate-200/40">
                  <span className="text-slate-500">Total Sisa di Tangan:</span>
                  <span className={totalRemaining > 0 ? "text-purple-700 text-[11px] font-black font-mono" : "text-slate-400 font-mono"}>
                    Rp {totalRemaining.toLocaleString('id-ID')}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Success banner */}
      {formSuccessMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-950 rounded-xl flex items-center gap-2 animate-in fade-in duration-300">
          <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{formSuccessMsg}</span>
        </div>
      )}

      {/* Form Penarikan Hasil Kolektor */}
      {showDrawForm && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara') && (
        <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-305">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <Coins className="w-5 h-5 text-purple-400" />
            <div>
              <h3 className="font-extrabold text-sm text-white">Pencatatan Penarikan Tunai Kolektor (Handover Kas Fisik)</h3>
              <p className="text-[10px] text-slate-400">Dimohon mengisi formulir ini saat Bendahara menerima setoran uang tunai secara langsung dari kolektor di lapangan.</p>
            </div>
          </div>

          <form onSubmit={handleFormSubmitPenarikan} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Collector Selector */}
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono mb-1.5">Nama Kolektor Penyetor</label>
              <select
                required
                value={drawCollectorId}
                onChange={(e) => {
                  const val = e.target.value;
                  setDrawCollectorId(val);
                  if (val) {
                    const info = getCollectorBalanceInfo(val, drawSector);
                    setDrawAmount(info.remaining > 0 ? info.remaining.toString() : '0');
                  } else {
                    setDrawAmount('');
                  }
                }}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-400 font-sans cursor-pointer transition hover:bg-slate-50 font-semibold"
              >
                <option value="" className="bg-white text-slate-900">-- Pilih Kolektor Sistem --</option>
                {collectorsList.map(u => (
                  <option key={u.id} value={u.username} className="bg-white text-slate-900">
                    {u.nama} ({u.role === 'kolektor' ? 'Kolektor' : u.role === 'admin' ? 'Admin' : 'Bendahara'})
                  </option>
                ))}
              </select>
            </div>

            {/* Sektor Kas Penerima */}
            <div>
              <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono mb-1.5">Sektor Kas Tunai Tujuan</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sector = 'rtPettyCash';
                    setDrawSector(sector);
                    if (drawCollectorId) {
                      const info = getCollectorBalanceInfo(drawCollectorId, sector);
                      setDrawAmount(info.remaining > 0 ? info.remaining.toString() : '0');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    drawSector === 'rtPettyCash'
                      ? 'bg-purple-600 border-purple-555 text-white'
                      : 'bg-slate-800 border-slate-705 text-slate-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Kas Kecil
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sector = 'rombongTunai';
                    setDrawSector(sector);
                    if (drawCollectorId) {
                      const info = getCollectorBalanceInfo(drawCollectorId, sector);
                      setDrawAmount(info.remaining > 0 ? info.remaining.toString() : '0');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    drawSector === 'rombongTunai'
                      ? 'bg-purple-600 border-purple-555 text-white'
                      : 'bg-slate-800 border-slate-705 text-slate-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-orange-400" />
                  Rombong Tunai
                </button>
              </div>
            </div>

            {drawCollectorId && (
              <>
                {/* Live Collector Balance Info Widget */}
                <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-slate-800/60 border border-slate-700/80 p-3.5 rounded-2xl flex flex-col md:flex-row gap-4 items-start md:items-center justify-between text-xs font-sans">
                  <div>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Statistik Koleksi Tunai Terpilih</p>
                    <p className="text-slate-100 font-semibold mt-1">
                      Kolektor: <span className="text-purple-300 font-bold">{(collectorsList.find(u => u.username === drawCollectorId)?.nama || drawCollectorId)}</span>
                      {' '}| Sektor:{' '}
                      <span className="text-purple-300 font-bold">{drawSector === 'rtPettyCash' ? 'Kas Kecil' : 'Rombong Tunai'}</span>
                      {' '}| Periode:{' '}
                      <span className="text-indigo-300 font-bold">
                        {selectedMonth === 'semua' ? `Tahun ${selectedYear}` : `${INDONESIAN_MONTHS.find(m => m.value === selectedMonth)?.label} ${selectedYear}`}
                      </span>
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-3 font-mono text-xs w-full md:w-auto">
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 grow md:grow-0">
                      <span className="text-slate-400 block text-[9px] uppercase">Tagihan Tunai Masuk</span>
                      <span className="text-amber-400 font-bold">Rp {collectorBal.totalCollected.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800/80 grow md:grow-0">
                      <span className="text-slate-400 block text-[9px] uppercase">Telah Ditarik</span>
                      <span className="text-indigo-400 font-bold">Rp {collectorBal.totalPenarikan.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="bg-slate-950 px-3 py-1.5 rounded-xl border border-purple-555 grow md:grow-0 shadow-lg shadow-purple-950/25">
                      <span className="text-purple-300 block text-[9px] uppercase font-bold">Sisa Belum Ditarik</span>
                      <span className="text-purple-200 font-black">Rp {collectorBal.remaining.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Nominal Penarikan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono mb-1.5">Jumlah Nominal Physical Cash (Rp)</label>
                  <input
                    type="number"
                    required
                    min={collectorBal.remaining <= 0 ? "0" : "100"}
                    step="100"
                    placeholder={collectorBal.remaining <= 0 ? "Saldo sudah Rp 0" : "e.g. 150000"}
                    value={drawAmount}
                    disabled={collectorBal.remaining <= 0}
                    onChange={(e) => setDrawAmount(e.target.value)}
                    className={`w-full border rounded-xl px-3.5 py-2.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-purple-400 ${
                      collectorBal.remaining <= 0
                        ? 'bg-slate-800/40 border-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-slate-800 border-slate-700 text-white placeholder-slate-500'
                    }`}
                  />
                  {collectorBal.remaining <= 0 && (
                    <p className="mt-1.5 text-[10px] text-rose-400 font-semibold flex items-center gap-1 leading-normal font-sans">
                      <AlertCircle className="w-3.5 h-3.5 text-rose-450 shrink-0" />
                      Hasil iuran Kolektor ini sudah habis ditarik / bernilai Rp 0. Tidak ada iuran yang dapat ditarik kembali!
                    </p>
                  )}
                  {collectorBal.remaining > 0 && drawAmount !== collectorBal.remaining.toString() && (
                    <button
                      type="button"
                      onClick={() => setDrawAmount(collectorBal.remaining.toString())}
                      className="mt-1 text-[10px] text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1 transition cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Setel sesuai sisa koleksi (Rp {collectorBal.remaining.toLocaleString('id-ID')})
                    </button>
                  )}
                </div>

                {/* Tanggal Penarikan */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono mb-1.5">Tanggal Serah Terima</label>
                  <input
                    type="date"
                    required
                    value={drawDate}
                    onChange={(e) => setDrawDate(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                  />
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-300 uppercase tracking-widest font-mono mb-1.5">Keterangan / Blok Tagihan (Opsional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Tarik hasil koleksi Blok C & D"
                    value={drawNotes}
                    onChange={(e) => setDrawNotes(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  />
                </div>

                {/* Submit Action */}
                <div className="flex items-end justify-center">
                  <button
                    type="submit"
                    disabled={collectorBal.remaining <= 0}
                    className={`w-full font-extrabold text-xs py-3 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-1.5 ${
                      collectorBal.remaining <= 0
                        ? 'bg-slate-700 border border-slate-650 text-slate-500 cursor-not-allowed opacity-50'
                        : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-emerald-950/20 active:scale-95 cursor-pointer'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{collectorBal.remaining <= 0 ? 'Sisa Hasil Rp 0 (Tidak Bisa Ditarik)' : 'Catat Serah Terima Tunai'}</span>
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Educational Accounting Alert */}
          <div className="bg-purple-950/20 text-purple-200 border border-purple-900/40 p-3 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2 max-w-5xl">
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong>Informasi Skema Pembukuan:</strong> Saldo kas digital sektoral (rtPettyCash / rombongTunai) sudah bertambah secara otomatis pada saat Kolektor menginput pelunasan iuran warga. Pengisian form penarikan ini <strong>tidak menduplikasi saldo digital kas</strong>, melainkan bertindak sebagai pencatat serah terima fisik uang tunai. Ini menurunkan <em>Sisa Tunai Kolektor</em> dan memindahkan simpanan ke <em>Sisa Tunai Bendahara</em> sebagai kontrol kelayakan sisa saldo tunai fisik sebelum didepositokan ke bank.
            </div>
          </div>
        </div>
      )}

      {/* Admin Approval Section for Custom Rombong Payments */}
      {(() => {
        const pendingApprovals = ledger.filter(entry => entry.isCustomRombong && entry.needApproval && !entry.approvedByAdmin);
        if (pendingApprovals.length === 0) return null;

        const isAdmin = isLoggedIn && currentUser?.role === 'admin';

        return (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 shadow-sm space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-100 text-amber-700 border border-amber-200 rounded-2xl">
                  <ClipboardCheck className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h4 className="font-extrabold text-sm text-amber-900 tracking-wide">
                    Persetujuan Nominal Kustom (Sewa Rombong)
                  </h4>
                  <p className="text-xs text-amber-700 font-medium">
                    Terdapat {pendingApprovals.length} transaksi nominal kustom dari Kolektor Rombong yang memerlukan persetujuan Admin sebelum diteruskan.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-black text-white bg-amber-600 px-2 py-0.5 rounded-full animate-bounce">
                {pendingApprovals.length} PENDING
              </span>
            </div>

            {isAdmin ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {pendingApprovals.map(entry => (
                  <div key={entry.id} className="bg-white border border-amber-200/60 rounded-2xl p-4 flex flex-col justify-between shadow-2xs">
                    <div>
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-400">Pengajuan Kolektor</span>
                        <span className="text-[10px] text-slate-500 font-mono font-medium">{entry.tanggal}</span>
                      </div>
                      <p className="text-xs font-extrabold text-slate-800 leading-normal mb-1.5">{entry.deskripsi}</p>
                      
                      <div className="flex justify-between items-center bg-amber-50/50 p-2 rounded-xl border border-amber-100/50 mb-3">
                        <span className="text-[10.5px] text-amber-800 font-bold">Nominal Kustom:</span>
                        <span className="text-sm font-black text-amber-900 font-mono">Rp {entry.jumlah.toLocaleString('id-ID')}</span>
                      </div>
                      
                      <div className="text-[10px] text-slate-600 space-y-0.5 font-sans mb-3 scale-[0.98] origin-left">
                        <div>• Petugas Pencatat: <strong>{entry.petugas}</strong></div>
                        <div>• Alokasi: <strong>{entry.sumberKas}</strong></div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={async () => {
                          if (onApproveRombongPayment) {
                            await onApproveRombongPayment(entry.id);
                            alert('Transaksi kustom disetujui! Saldo resmi sudah disesuaikan.');
                          }
                        }}
                        className="flex-1 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold transition active:scale-95 cursor-pointer shadow-sm text-center"
                      >
                        Setujui ✓
                      </button>
                      <button
                        onClick={async () => {
                          if (confirm('Apakah Anda yakin menolak dan menghapus pengajuan custom sewa rombong ini? Status pembayaran akan dikembalikan menjadi belum lunas.')) {
                            if (onRejectRombongPayment) {
                              await onRejectRombongPayment(entry.id);
                              alert('Transaksi ditolak dan dibatalkan.');
                            }
                          }
                        }}
                        className="py-1.5 px-3 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition active:scale-95 cursor-pointer text-center"
                      >
                        Tolak
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-amber-805 bg-amber-100/40 p-2.5 rounded-xl border border-amber-200/50 italic leading-relaxed">
                🔒 Tinjauan administrasi hanya dapat dilakukan oleh akun Admin utama. Silakan hubungi Admin untuk melakukan verifikasi pembukuan nominal custom ini.
              </p>
            )}
          </div>
        );
      })()}

      {/* Discrepancy Alert Banner */}
      {selectedMonth !== 'semua' && (
        <div className={`p-4 border rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition duration-200 ${
          remainingCashInCollector > 0
            ? 'bg-amber-50 border-amber-205 text-amber-900'
            : remainingCashInCollector < 0
            ? 'bg-rose-50 border-rose-205 text-rose-900'
            : 'bg-emerald-50 border-emerald-205 text-emerald-900'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              remainingCashInCollector > 0
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : remainingCashInCollector < 0
                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
            }`}>
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-extrabold text-sm tracking-wide">
                {remainingCashInCollector > 0
                  ? 'Ada Dana Tunai Berada di Lapangan (Kolektor)'
                  : remainingCashInCollector < 0
                  ? 'Koleksi Defiasi / Penarikan Surplus'
                  : 'Seluruh Saldo di Kolektor Sudah Diserahterimakan'}
              </h4>
              <p className="text-xs opacity-90 mt-0.5 leading-relaxed font-sans max-w-3xl">
                {remainingCashInCollector > 0
                  ? `Sesuai audit tagihan iuran tunai bulan ini, terdapat saldo sebesar Rp ${remainingCashInCollector.toLocaleString('id-ID')} uang tunai fisik hasil tagihan yang masih di tangan Kolektor. Mohon Bendahara segera melakukan penarikan dana menggunakan tombol "Tarik Tunai dari Kolektor" di atas apabila uang fisik sudah diserahkan.`
                  : remainingCashInCollector < 0
                  ? `Penarikan melebihi iuran tunai tercatat bulan ini sebesar Rp ${Math.abs(remainingCashInCollector).toLocaleString('id-ID')}. Mungkin terdapat pembukuan iuran tertunda di sistem.`
                  : `Bagus! Seluruh penerimaan iuran warga yang ditagih secara tunai (Rp ${totalCashCollected.toLocaleString('id-ID')}) telah ditarik dan diserahterimakan secara tunai ke Bendahara sepenuhnya.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono shrink-0 font-bold text-sm">
            <span className="opacity-70 text-xs font-normal">Sisa Kolektor:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-black select-all ${
              remainingCashInCollector > 0
                ? 'bg-amber-100 border border-amber-250 text-amber-850'
                : remainingCashInCollector < 0
                ? 'bg-rose-100 border border-rose-250 text-rose-850'
                : 'bg-emerald-100 border border-emerald-250 text-emerald-850'
            }`}>
              Rp {remainingCashInCollector.toLocaleString('id-ID')}
            </span>
          </div>
        </div>
      )}

      {/* Core Reconciliation Math Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Card 1: Cash Tagihan Collected */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl relative overflow-hidden transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">1. Iuran Masuk (Tunai)</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
              <Coins className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
            Rp {totalCashCollected.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] font-medium text-slate-500 leading-normal border-t border-slate-100 pt-2 font-sans">
            <span className="text-amber-600 font-extrabold">{cashPayments.length} transaksi</span>
            <span>tunai diinput kolektor</span>
          </div>
        </div>

        {/* Card 2: Pulled by Treasurer */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl relative overflow-hidden transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">2. Ditarik Bendahara</span>
            <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
            Rp {totalPenarikan.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] font-medium text-slate-500 leading-normal border-t border-slate-100 pt-2 font-sans">
            <span className="text-indigo-600 font-extrabold">{penarikanTransfers.length} penarikan</span>
            <span>oleh bendahara</span>
          </div>
        </div>

        {/* Card 3: Cash In Hand Collector */}
        <div className={`p-5 border rounded-3xl relative overflow-hidden transition hover:shadow-md ${
          remainingCashInCollector > 0
            ? 'bg-amber-50/50 border-amber-250'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">3. Sisa di Kolektor</span>
            <div className={`p-2 rounded-xl ${
              remainingCashInCollector > 0
                ? 'bg-amber-100 text-amber-700 border border-amber-200'
                : 'bg-slate-50 text-slate-500 border border-slate-100'
            }`}>
              <Lock className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-xl font-black font-mono tracking-tight ${
            remainingCashInCollector > 0
              ? 'text-amber-750'
              : remainingCashInCollector < 0
              ? 'text-rose-650'
              : 'text-slate-900'
          }`}>
            Rp {remainingCashInCollector.toLocaleString('id-ID')}
          </p>

          {/* Breakdown Rincian Sumber Dana */}
          <div className="mt-3 space-y-1 text-[11px] font-mono border-t border-dashed border-amber-200/60 pt-2">
            <div className="flex justify-between items-center text-slate-650">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                <span>Iuran RT Warga:</span>
              </span>
              <span className="font-bold text-slate-800">Rp {remainingRTInCollector.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-slate-650">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Sewa Rombong:</span>
              </span>
              <span className="font-bold text-slate-800">Rp {remainingRombongInCollector.toLocaleString('id-ID')}</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] font-medium text-slate-500 leading-normal border-t border-slate-100 pt-2 font-sans">
            <span className="font-extrabold text-slate-700">Pemberlakuan</span>
            <span>kuasa fisik kas kolektor</span>
          </div>
        </div>

        {/* Card 4: Cash In Hand Treasurer (Laci Bendahara) */}
        <div className={`p-5 border rounded-3xl relative overflow-hidden transition hover:shadow-md ${
          remainingCashInBendahara > 0
            ? 'bg-purple-50/40 border-purple-200'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">4. Sisa di Bendahara</span>
            <div className={`p-2 rounded-xl ${
              remainingCashInBendahara > 0
                ? 'bg-purple-100 text-purple-750 border border-purple-200'
                : 'bg-slate-50 text-slate-550 border border-slate-100'
            }`}>
              <Unlock className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-xl font-black font-mono tracking-tight ${
            remainingCashInBendahara > 0
              ? 'text-purple-750 font-black'
              : 'text-slate-900 font-semibold'
          }`}>
            Rp {remainingCashInBendahara.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] font-medium text-slate-500 leading-normal border-t border-slate-100 pt-2 font-sans">
            <span className="font-extrabold text-slate-700">Tunai Kas Utama</span>
            <span>sebelum didepositokan</span>
          </div>
        </div>

        {/* Card 5: Already Deposited to Bank (Setor Bank) */}
        <div className="p-5 bg-white border border-slate-200 rounded-3xl relative overflow-hidden transition hover:shadow-md">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">5. Disetorkan ke Bank</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-xl font-black text-slate-900 font-mono tracking-tight">
            Rp {totalDepositedToBank.toLocaleString('id-ID')}
          </p>
          <div className="flex items-center gap-1.5 mt-2.5 text-[10.5px] font-medium text-slate-500 leading-normal border-t border-slate-100 pt-2 font-sans">
            <span className="text-emerald-600 font-extrabold">{setorBankTransfers.length} setoran</span>
            <span>terkirim ke Bank</span>
          </div>
        </div>

      </div>

      {/* Visual Information Direct Bank (QRIS) */}
      <div className="p-4 bg-sky-50/50 border border-sky-100 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-sky-100 text-sky-700 border border-sky-150">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-sky-900 font-sans">Penerimaan Langsung Bank (QRIS): Rp {totalBankCollected.toLocaleString('id-ID')} ({bankPayments.length} Pembayaran)</h4>
            <p className="text-[10.5px] text-sky-700">Iuran non-tunai langsung didepositokan via mutasi bank &amp; tidak mengendap di lapangan.</p>
          </div>
        </div>
      </div>

      {/* Main Table Segment with Search and Sub-tabs */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Table Search & Switch Bar */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Sub Tab Switch buttons */}
          <div className="flex flex-wrap items-center bg-slate-100/85 p-1 rounded-xl w-fit gap-1">
            <button
              onClick={() => { setActiveSubTab('tunai'); setSearchTerm(''); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'tunai'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              <Coins className="w-4 h-4 text-amber-500" />
              <span>Iuran Tunai ({cashPayments.length})</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('bank'); setSearchTerm(''); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'bank'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              <Building className="w-4 h-4 text-sky-500" />
              <span>Iuran Bank ({bankPayments.length})</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('penarikan_kolektor'); setSearchTerm(''); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'penarikan_kolektor'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              <ArrowDownLeft className="w-4 h-4 text-indigo-500" />
              <span>Penarikan Bendahara ({penarikanTransfers.length})</span>
            </button>
            <button
              onClick={() => { setActiveSubTab('setor_bank'); setSearchTerm(''); }}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'setor_bank'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-805'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-500" />
              <span>Riwayat Setor Bank ({setorBankTransfers.length})</span>
            </button>
          </div>

          {/* Search box */}
          <div className="relative max-w-xs w-full lg:self-center">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Cari transaksi / nama..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-205 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 font-sans"
            />
          </div>
        </div>
               {/* Dynamic List Rendering - Highly Responsive & Tight */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          {activeSubTab === 'tunai' && (
            <>
              {/* Mobile Card List View for Tunai */}
              <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/40 max-h-[1000px] overflow-y-auto">
                {filteredCashList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-sans leading-relaxed text-xs">
                    Belum ada penerimaan iuran secara tunai yang tercatat pada periode ini.
                  </div>
                ) : (
                  filteredCashList.map((entry, index) => {
                    const isVerified = verifiedIds.includes(entry.id);
                    return (
                      <div 
                        key={entry.id} 
                        className={`p-3.5 space-y-2.5 bg-white transition duration-150 ${
                          isVerified ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{index + 1} | {formatIndonesianDate(entry.tanggal)}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-bold text-[12px] text-slate-850 leading-tight">{entry.deskripsi}</h5>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Kolektor: <strong className="text-slate-650 font-semibold">{entry.petugas}</strong></span>
                          </div>
                          <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.25 rounded font-mono border border-slate-200/60 font-bold">
                            Kategori: {entry.kategori}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/75 mt-1.5">
                          <div className="font-mono">
                            <span className="text-[8.5px] text-slate-400 block uppercase font-bold leading-none">Nominal</span>
                            <span className="text-xs font-black text-slate-900 mt-0.5 block">Rp {entry.jumlah.toLocaleString('id-ID')}</span>
                          </div>
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black border transition flex items-center justify-center gap-1 ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Cocok ✓</span>
                              </>
                            ) : (
                              <span>Cocokkan</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View for Tunai */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-705">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[10px] font-extrabold text-slate-500 font-mono">
                      <th className="px-3.5 py-2.5 w-5 text-center">No</th>
                      <th className="px-3.5 py-2.5">Tanggal</th>
                      <th className="px-3.5 py-2.5">Informasi Tagihan / Slip Pembayaran</th>
                      <th className="px-3.5 py-2.5">Sektor Kas</th>
                      <th className="px-3.5 py-2.5">Kolektor Lapangan</th>
                      <th className="px-3.5 py-2.5 text-right">Jumlah</th>
                      <th className="px-3.5 py-2.5 text-center w-36">Verifikasi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCashList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 leading-relaxed font-sans">
                          Belum ada penerimaan iuran secara tunai yang tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredCashList.map((entry, index) => {
                        const isVerified = verifiedIds.includes(entry.id);
                        return (
                          <tr 
                            key={entry.id} 
                            className={`hover:bg-slate-50/50 transition duration-150 ${
                              isVerified ? 'bg-emerald-50/15' : ''
                            }`}
                          >
                            <td className="px-3.5 py-2 text-center font-mono opacity-65 text-[11px]">{index + 1}</td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className="font-bold block text-slate-800">{formatIndonesianDate(entry.tanggal)}</span>
                              <span className="text-[9px] text-slate-400 font-mono">ID {entry.id.substring(0, 8)}</span>
                            </td>
                            <td className="px-3.5 py-2">
                              <span className="font-bold text-slate-850 block leading-tight">{entry.deskripsi}</span>
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] bg-slate-100 text-slate-650 px-1 py-0.25 rounded font-mono border border-slate-200/60 leading-none">
                                Category: {entry.kategori}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                                {getKasLabel(entry.sumberKas)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap text-slate-700 flex items-center gap-1.5 mt-1 font-sans">
                              <User className="w-3 h-3 text-slate-450 shrink-0" />
                              <span className="font-semibold text-xs">{entry.petugas}</span>
                            </td>
                            <td className="px-3.5 py-2 text-right font-black font-mono text-slate-900 whitespace-nowrap text-xs">
                              Rp {entry.jumlah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              <button
                                disabled={!canVerify}
                                onClick={() => toggleVerifyId(entry.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 w-full shrink-0 ${
                                  !canVerify
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : isVerified
                                    ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                    : 'bg-white border-slate-205 text-slate-600 hover:border-slate-400 cursor-pointer'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <Check className="w-3 w-3 stroke-[3]" />
                                    <span>Telah Cocok</span>
                                  </>
                                ) : (
                                  <span>Verifikasi</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSubTab === 'bank' && (
            <>
              {/* Mobile Card List View for Bank/QRIS */}
              <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/40 max-h-[1000px] overflow-y-auto">
                {filteredBankList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-sans leading-relaxed text-xs">
                    Belum ada penerimaan iuran secara transfer/bank yang tercatat pada periode ini.
                  </div>
                ) : (
                  filteredBankList.map((entry, index) => {
                    const isVerified = verifiedIds.includes(entry.id);
                    return (
                      <div 
                        key={entry.id} 
                        className={`p-3.5 space-y-2.5 bg-white transition duration-150 ${
                          isVerified ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{index + 1} | {formatIndonesianDate(entry.tanggal)}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-bold text-[12px] text-slate-850 leading-tight">{entry.deskripsi}</h5>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <User className="w-3 h-3 text-slate-400" />
                            <span>Petugas: <strong className="text-slate-650 font-semibold">{entry.petugas}</strong></span>
                          </div>
                          <span className="inline-block mt-1 text-[9px] bg-indigo-50 text-indigo-700 px-1.5 py-0.25 rounded font-mono border border-indigo-100 font-bold">
                            Kategori: {entry.kategori}
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/75 mt-1.5">
                          <div className="font-mono">
                            <span className="text-[8.5px] text-slate-400 block uppercase font-bold leading-none">Nominal</span>
                            <span className="text-xs font-black text-slate-900 mt-0.5 block">Rp {entry.jumlah.toLocaleString('id-ID')}</span>
                          </div>
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black border transition flex items-center justify-center gap-1 ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Cocok ✓</span>
                              </>
                            ) : (
                              <span>Cocokkan</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View for Bank/QRIS */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-705">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[10px] font-extrabold text-slate-500 font-mono">
                      <th className="px-3.5 py-2.5 w-5 text-center">No</th>
                      <th className="px-3.5 py-2.5">Tanggal</th>
                      <th className="px-3.5 py-2.5">Informasi Tagihan / Slip Pembayaran</th>
                      <th className="px-3.5 py-2.5">Sektor Kas</th>
                      <th className="px-3.5 py-2.5">Petugas Pembukuan</th>
                      <th className="px-3.5 py-2.5 text-right">Jumlah</th>
                      <th className="px-3.5 py-2.5 text-center w-36">Verifikasi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredBankList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 leading-relaxed font-sans">
                          Belum ada penerimaan iuran secara transfer/bank yang tercatat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredBankList.map((entry, index) => {
                        const isVerified = verifiedIds.includes(entry.id);
                        return (
                          <tr 
                            key={entry.id} 
                            className={`hover:bg-slate-50/50 transition duration-150 ${
                              isVerified ? 'bg-emerald-50/15' : ''
                            }`}
                          >
                            <td className="px-3.5 py-2 text-center font-mono opacity-65 text-[11px]">{index + 1}</td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className="font-bold block text-slate-800">{formatIndonesianDate(entry.tanggal)}</span>
                              <span className="text-[9px] text-slate-400 font-mono">ID {entry.id.substring(0, 8)}</span>
                            </td>
                            <td className="px-3.5 py-2">
                              <span className="font-bold text-slate-850 block leading-tight">{entry.deskripsi}</span>
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] bg-slate-100 text-slate-650 px-1 py-0.25 rounded font-mono border border-slate-200/60 leading-none">
                                Category: {entry.kategori}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                                {getKasLabel(entry.sumberKas)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap text-slate-700 flex items-center gap-1.5 mt-1 font-sans">
                              <User className="w-3 h-3 text-slate-450 shrink-0" />
                              <span className="font-semibold text-xs">{entry.petugas}</span>
                            </td>
                            <td className="px-3.5 py-2 text-right font-black font-mono text-slate-900 whitespace-nowrap text-xs">
                              Rp {entry.jumlah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              <button
                                disabled={!canVerify}
                                onClick={() => toggleVerifyId(entry.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 w-full shrink-0 ${
                                  !canVerify
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : isVerified
                                    ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                    : 'bg-white border-slate-205 text-slate-600 hover:border-slate-400 cursor-pointer'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <Check className="w-3 w-3 stroke-[3]" />
                                    <span>Telah Cocok</span>
                                  </>
                                ) : (
                                  <span>Verifikasi</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSubTab === 'penarikan_kolektor' && (
            <>
              {/* Mobile Card List View for Penarikan Bendahara */}
              <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/40 max-h-[1000px] overflow-y-auto">
                {filteredPenarikanList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-sans leading-relaxed text-xs">
                    Belum ada pemindahantangan/penarikan dana kolektor secara fisik oleh bendahara yang tercatat.
                  </div>
                ) : (
                  filteredPenarikanList.map((entry, index) => {
                    const isVerified = verifiedIds.includes(entry.id);
                    return (
                      <div 
                        key={entry.id} 
                        className={`p-3.5 space-y-2.5 bg-white transition duration-150 ${
                          isVerified ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{index + 1} | {formatIndonesianDate(entry.tanggal)}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-bold text-[12px] text-slate-850 leading-tight">{entry.deskripsi}</h5>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-450 border-t border-slate-100/50 pt-1">
                            <span className="text-[9.5px] uppercase font-bold text-slate-400 block tracking-wider">Serah Terima:</span>
                          </div>
                          <div className="flex flex-col mt-0.5 text-[10.5px] text-slate-600 gap-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                              <span>Penerima (Bendahara): <strong className="text-slate-800">{entry.petugas}</strong></span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span>Catatan: {entry.kategori}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/75 mt-1.5">
                          <div className="font-mono">
                            <span className="text-[8.5px] text-slate-400 block uppercase font-bold leading-none">Jumlah Ditarik</span>
                            <span className="text-xs font-black text-rose-600 mt-0.5 block">Rp {entry.jumlah.toLocaleString('id-ID')}</span>
                          </div>
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black border transition flex items-center justify-center gap-1 ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Cocok ✓</span>
                              </>
                            ) : (
                              <span>Cocokkan</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View for Penarikan Bendahara */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-705">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[10px] font-extrabold text-slate-500 font-mono">
                      <th className="px-3.5 py-2.5 w-5 text-center">No</th>
                      <th className="px-3.5 py-2.5">Tanggal Penarikan</th>
                      <th className="px-3.5 py-2.5">Deskripsi / Riwayat Pengambilan Kas Lapangan</th>
                      <th className="px-3.5 py-2.5">Tipe Kas</th>
                      <th className="px-3.5 py-2.5">Penerima (Bendahara)</th>
                      <th className="px-3.5 py-2.5 text-right">Jumlah Ditarik</th>
                      <th className="px-3.5 py-2.5 text-center w-36">Verifikasi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPenarikanList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 leading-relaxed font-sans">
                          Belum ada pemindahantangan/penarikan dana kolektor secara fisik oleh bendahara yang tercatat.
                        </td>
                      </tr>
                    ) : (
                      filteredPenarikanList.map((entry, index) => {
                        const isVerified = verifiedIds.includes(entry.id);
                        return (
                          <tr 
                            key={entry.id} 
                            className={`hover:bg-slate-50/50 transition duration-150 ${
                              isVerified ? 'bg-emerald-50/15' : ''
                            }`}
                          >
                            <td className="px-3.5 py-2 text-center font-mono opacity-65 text-[11px]">{index + 1}</td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className="font-bold block text-slate-800">{formatIndonesianDate(entry.tanggal)}</span>
                              <span className="text-[9px] text-slate-400 font-mono">ID {entry.id.substring(0, 8)}</span>
                            </td>
                            <td className="px-3.5 py-2">
                              <span className="font-bold text-slate-850 block leading-tight">{entry.deskripsi}</span>
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] bg-slate-100 text-slate-655 px-1 py-0.25 rounded font-mono border border-slate-200/60 leading-none">
                                Category: {entry.kategori}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                                {getKasLabel(entry.sumberKas)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap text-slate-700 flex items-center gap-1.5 mt-1 font-sans">
                              <User className="w-3 h-3 text-slate-450 shrink-0" />
                              <span className="font-semibold text-xs">{entry.petugas}</span>
                            </td>
                            <td className="px-3.5 py-2 text-right font-black font-mono text-rose-600 whitespace-nowrap text-xs">
                              Rp {entry.jumlah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              <button
                                disabled={!canVerify}
                                onClick={() => toggleVerifyId(entry.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 w-full shrink-0 ${
                                  !canVerify
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : isVerified
                                    ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 cursor-pointer'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Telah Cocok</span>
                                  </>
                                ) : (
                                  <span>Verifikasi</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {activeSubTab === 'setor_bank' && (
            <>
              {/* Mobile Card List View for Setor Bank */}
              <div className="block md:hidden divide-y divide-slate-100 bg-slate-50/40 max-h-[1000px] overflow-y-auto">
                {filteredSetorList.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 font-sans leading-relaxed text-xs">
                    Belum ada mutasi setor tunai ke bank yang tercatat pada periode ini.
                  </div>
                ) : (
                  filteredSetorList.map((entry, index) => {
                    const isVerified = verifiedIds.includes(entry.id);
                    return (
                      <div 
                        key={entry.id} 
                        className={`p-3.5 space-y-2.5 bg-white transition duration-150 ${
                          isVerified ? 'bg-emerald-50/10' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[10px] font-bold text-slate-400 font-mono">#{index + 1} | {formatIndonesianDate(entry.tanggal)}</span>
                          <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </div>
                        <div>
                          <h5 className="font-bold text-[12px] text-slate-850 leading-tight">{entry.deskripsi}</h5>
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-slate-400">
                            <User className="w-3 h-3 text-slate-450" />
                            <span>Penyetor: <strong className="text-slate-650 font-semibold">{entry.petugas}</strong></span>
                          </div>
                          <span className="inline-block mt-1 text-[9px] bg-purple-100 text-purple-800 px-1.5 py-0.25 rounded font-mono border border-purple-200 font-bold">
                            Tipe: Pemindahbukuan ke Bank
                          </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-slate-100/75 mt-1.5">
                          <div className="font-mono">
                            <span className="text-[8.5px] text-slate-400 block uppercase font-bold leading-none">Nominal Disetor</span>
                            <span className="text-xs font-black text-purple-700 mt-0.5 block">Rp {entry.jumlah.toLocaleString('id-ID')}</span>
                          </div>
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-2.5 py-1 rounded-lg text-[9.5px] font-black border transition flex items-center justify-center gap-1 ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-50'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 cursor-pointer'
                            }`}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3 h-3 stroke-[3]" />
                                <span>Cocok ✓</span>
                              </>
                            ) : (
                              <span>Cocokkan</span>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View for Setor Bank */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-750">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 uppercase tracking-wider text-[10px] font-extrabold text-slate-500 font-mono">
                      <th className="px-3.5 py-2.5 w-5 text-center">No</th>
                      <th className="px-3.5 py-2.5">Tanggal Setor</th>
                      <th className="px-3.5 py-2.5">Deskripsi / Riwayat Penyetoran Cash</th>
                      <th className="px-3.5 py-2.5">Asal Saldo Fisik</th>
                      <th className="px-3.5 py-2.5">Tipe Transaksi</th>
                      <th className="px-3.5 py-2.5 text-right">Nominal Setor</th>
                      <th className="px-3.5 py-2.5 text-center w-36">Verifikasi Audit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredSetorList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-slate-400 leading-relaxed font-sans">
                          Belum ada mutasi setor tunai ke bank yang tersurat pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      filteredSetorList.map((entry, index) => {
                        const isVerified = verifiedIds.includes(entry.id);
                        return (
                          <tr 
                            key={entry.id} 
                            className={`hover:bg-slate-50/50 transition duration-150 ${
                              isVerified ? 'bg-emerald-50/15' : ''
                            }`}
                          >
                            <td className="px-3.5 py-2 text-center font-mono opacity-65 text-[11px]">{index + 1}</td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className="font-bold block text-slate-800">{formatIndonesianDate(entry.tanggal)}</span>
                              <span className="text-[9px] text-slate-400 font-mono">ID {entry.id.substring(0, 8)}</span>
                            </td>
                            <td className="px-3.5 py-2">
                              <span className="font-bold text-slate-850 block leading-tight">{entry.deskripsi}</span>
                              <span className="inline-flex items-center gap-1 mt-0.5 text-[9px] bg-slate-100 text-slate-655 px-1 py-0.25 rounded font-mono border border-slate-200/60 leading-none">
                                Penyetor: {entry.petugas}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded-full border text-[9px] font-mono leading-none font-bold ${getKasBadgeColor(entry.sumberKas)}`}>
                                {getKasLabel(entry.sumberKas)}
                              </span>
                            </td>
                            <td className="px-3.5 py-2 whitespace-nowrap text-purple-750 font-bold font-mono">
                              Pemindahbukuan
                            </td>
                            <td className="px-3.5 py-2 text-right font-black font-mono text-purple-750 whitespace-nowrap text-xs">
                              Rp {entry.jumlah.toLocaleString('id-ID')}
                            </td>
                            <td className="px-3.5 py-2 text-center whitespace-nowrap">
                              <button
                                disabled={!canVerify}
                                onClick={() => toggleVerifyId(entry.id)}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 w-full shrink-0 ${
                                  !canVerify
                                    ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                    : isVerified
                                    ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-400 cursor-pointer'
                                }`}
                              >
                                {isVerified ? (
                                  <>
                                    <Check className="w-3 h-3 stroke-[3]" />
                                    <span>Telah Cocok</span>
                                  </>
                                ) : (
                                  <span>Verifikasi</span>
                                )}
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Dynamic Verification Helper Details Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 font-sans text-slate-605 text-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              Pengecekan: <strong>{verifiedIds.length}</strong> transaksi telah dicocokkan dan diverifikasi secara visual menggunakan browser ini.
            </span>
          </div>
          <div className="text-[10.5px] text-slate-400 leading-normal font-mono">
            RT 08 PERUMTAS • AKUN KOLEKTIF &amp; DIGITAL RECONCILIATION
          </div>
        </div>

      </div>

    </div>
  );
}
