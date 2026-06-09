import React, { useState } from 'react';
import { LedgerEntry, Balance, AppUser } from '../types';
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
  users = []
}: BukuKolektorProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1; // 1-12

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number | 'semua'>(currentMonth);
  const [activeSubTab, setActiveSubTab] = useState<'tunai' | 'bank' | 'penarikan_kolektor' | 'setor_bank'>('tunai');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Penarikan Form State
  const [showDrawForm, setShowDrawForm] = useState(false);
  const [drawCollectorId, setDrawCollectorId] = useState('');
  const [customCollectorName, setCustomCollectorName] = useState('');
  const [drawSector, setDrawSector] = useState<'rtTunai' | 'rombongTunai'>('rtTunai');
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
  const monthlyLedger = ledger.filter(entry => {
    const { year, month } = parseEntryDate(entry.tanggal);
    const matchesYear = year === selectedYear;
    const matchesMonth = selectedMonth === 'semua' || month === selectedMonth;
    return matchesYear && matchesMonth;
  });

  // 2. Identify and classify Billings (Iuran / Tagihan) payments
  const isBillingPayment = (entry: LedgerEntry) => {
    if (entry.tipe !== 'pemasukan') return false;
    const desc = entry.deskripsi.toLowerCase();
    const cat = entry.kategori.toLowerCase();
    return (
      cat.includes('iuran') || 
      cat.includes('pendapatan rombong') ||
      desc.includes('iuran') || 
      desc.includes('tagihan') || 
      desc.includes('lapak')
    );
  };

  const isPenarikanKolektor = (entry: LedgerEntry) => {
    return entry.kategori === 'Penarikan Dana Kolektor';
  };

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
    (entry.sumberKas === 'rtTunai' || entry.sumberKas === 'rombongTunai')
  );

  // Aggregates
  const totalCashCollected = cashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
  const totalBankCollected = bankPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
  const totalPenarikan = penarikanTransfers.reduce((acc, entry) => acc + entry.jumlah, 0);
  const totalDepositedToBank = setorBankTransfers.reduce((acc, entry) => acc + entry.jumlah, 0);
  
  // Sisa Tunai di Tangan Kolektor (Fisik di lapangan belum diserahterimakan)
  const remainingCashInCollector = totalCashCollected - totalPenarikan;

  // Sisa Tunai di Tangan Bendahara (Sudah ditarik bendahara tapi belum disetor ke bank)
  const remainingCashInBendahara = totalPenarikan - totalDepositedToBank;

  // Dynamic calculation for selected collector in current view filter
  const getSelectedCollectorBalanceInfo = () => {
    if (!drawCollectorId) return { totalCollected: 0, totalPenarikan: 0, remaining: 0 };
    
    const matchedUser = collectorsList.find(u => u.username === drawCollectorId);
    const collectorName = matchedUser ? matchedUser.nama : drawCollectorId;
    
    // Helper to sanitize signature name for comparison (removes paren roles & prefixes)
    const cleanName = (name: string) => {
      return name
        .replace(/\s*\(.*\)\s*/g, '')
        .replace(/^(bapak|bp\.|ibu|mas|mbak|pak|bu)\s+/i, '')
        .trim()
        .toLowerCase();
    };

    const cleanCollectorName = cleanName(collectorName);
    const cleanCollectorId = cleanName(drawCollectorId);

    // 1. Total cash collected by this collector in this sector for the selected period
    const collectorCashPayments = monthlyLedger.filter(entry => {
      if (!isBillingPayment(entry) || entry.sumberKas !== drawSector) return false;
      const cleanEntryPetugas = cleanName(entry.petugas);
      return (
        cleanEntryPetugas === cleanCollectorName ||
        cleanEntryPetugas === cleanCollectorId ||
        cleanEntryPetugas.includes(cleanCollectorName) ||
        cleanCollectorName.includes(cleanEntryPetugas)
      );
    });
    const totalCollected = collectorCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
    
    // 2. Total penarikan of this collector in this sector for the selected period
    const collectorPenarikans = monthlyLedger.filter(entry => {
      if (!isPenarikanKolektor(entry) || entry.sumberKas !== drawSector) return false;
      const cleanEntryDesc = cleanName(entry.deskripsi);
      return (
        cleanEntryDesc.includes(cleanCollectorName) ||
        cleanEntryDesc.includes(cleanCollectorId)
      );
    });
    const totalPenarikanByCollector = collectorPenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);
    
    return {
      totalCollected,
      totalPenarikan: totalPenarikanByCollector,
      remaining: Math.max(0, totalCollected - totalPenarikanByCollector)
    };
  };

  const collectorBal = getSelectedCollectorBalanceInfo();

  // Verification Permission
  const canVerify = isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara');

  // Filter lists based on search bar text
  const query = searchTerm.toLowerCase();
  
  const filteredCashList = cashPayments.filter(entry => 
    entry.deskripsi.toLowerCase().includes(query) || 
    entry.petugas.toLowerCase().includes(query) ||
    entry.sumberKas.toLowerCase().includes(query)
  );

  const filteredBankList = bankPayments.filter(entry => 
    entry.deskripsi.toLowerCase().includes(query) || 
    entry.petugas.toLowerCase().includes(query) ||
    entry.sumberKas.toLowerCase().includes(query)
  );

  const filteredPenarikanList = penarikanTransfers.filter(entry =>
    entry.deskripsi.toLowerCase().includes(query) ||
    entry.petugas.toLowerCase().includes(query) ||
    entry.sumberKas.toLowerCase().includes(query)
  );

  const filteredSetorList = setorBankTransfers.filter(entry => 
    entry.deskripsi.toLowerCase().includes(query) || 
    entry.petugas.toLowerCase().includes(query)
  );

  // Filter officers list
  const collectorsList = users.filter(u => u.role === 'kolektor' || u.role === 'admin' || u.role === 'bendahara');

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

    const matchedUser = collectorsList.find(u => u.username === drawCollectorId);
    const collectorName = matchedUser ? matchedUser.nama : drawCollectorId;

    const labelSektor = drawSector === 'rtTunai' ? 'RT 08' : 'Rombong Kuliner';
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
      case 'rtTunai': return 'bg-amber-100 border-amber-200 text-amber-850';
      case 'rtPettyCash': return 'bg-indigo-100 border-indigo-200 text-indigo-850';
      case 'rombongTunai': return 'bg-orange-100 border-orange-200 text-orange-850';
      case 'rtBank': return 'bg-sky-100 border-sky-200 text-sky-850';
      case 'rombongBank': return 'bg-emerald-100 border-emerald-250 text-emerald-850';
      default: return 'bg-slate-100 border-slate-200 text-slate-800';
    }
  };

  const getKasLabel = (sumber: keyof Balance) => {
    switch(sumber) {
      case 'rtTunai': return 'RT Tunai';
      case 'rtPettyCash': return 'RT Petty Cash';
      case 'rombongTunai': return 'Rombong Tunai';
      case 'rtBank': return 'RT Bank';
      case 'rombongBank': return 'Rombong Bank';
      default: return sumber;
    }
  };

  return (
    <div className="space-y-6" id="buku-kolektor-container">
      
      {/* Premium Header Banner */}
      <div className="bg-gradient-to-br from-purple-700 via-indigo-800 to-slate-900 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl shadow-indigo-900/10 border border-indigo-700/30">
        <div className="absolute top-0 right-0 -transtale-y-1/3 translate-x-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/3 -translate-x-1/4 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 bg-purple-550/20 border border-purple-400/30 text-purple-200 px-3 py-1 rounded-full text-[10px] tracking-widest font-mono font-bold uppercase">
              <ClipboardCheck className="w-3.5 h-3.5" />
              Reconciliation &amp; Audit Tool
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">Buku Validasi Kolektor &amp; Bendahara</h1>
            <p className="text-slate-200 text-xs md:text-sm max-w-2xl leading-relaxed font-sans">
              Lembar kerja pengawasan bersama untuk menyinkronkan total penerimaan iuran secara <strong>Tunai (Fisik)</strong> dan transfer <strong>Bank (QRIS)</strong>. Membantu memantau sisa tunai di tangan kolektor hingga penarikan kas utama oleh bendahara sebelum didepositokan ke bank.
            </p>
          </div>

          {/* Quick Info Box */}
          <div className="bg-white/10 backdrop-blur-xs border border-white/20 p-4 rounded-2xl flex items-center gap-3 shrink-0 self-start md:self-center">
            <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-purple-250 font-mono uppercase tracking-wider">Peran Pengguna</p>
              <p className="text-sm font-bold text-white leading-tight">
                {currentUser?.nama || 'Petugas Tamu'} 
              </p>
              <span className="text-[9.5px] bg-purple-600 border border-purple-500 text-purple-100 font-extrabold px-1.5 py-0.25 rounded-md uppercase font-mono tracking-wider inline-block mt-0.5">
                {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'bendahara' ? 'Bendahara' : currentUser?.role === 'kolektor' ? 'Kolektor' : 'Saksi'}
              </span>
            </div>
          </div>
        </div>

        {/* Dynamic Filters Bar */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 bg-slate-800/40 border border-white/15 px-3 py-1.5 rounded-xl text-xs text-slate-100 font-mono">
              <Filter className="w-3.5 h-3.5 text-slate-300" />
              <span>Saring Data:</span>
            </div>

            {/* Year Selector */}
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 text-slate-900 font-bold text-xs py-2 px-3 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono cursor-pointer transition hover:bg-slate-50"
            >
              {yearsList.map(y => (
                <option key={y} value={y} className="bg-white text-slate-900 font-mono">{y} Masehi</option>
              ))}
            </select>

            {/* Month Selector */}
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value === 'semua' ? 'semua' : parseInt(e.target.value, 10))}
              className="bg-white border border-slate-200 text-slate-900 font-bold text-xs py-2 px-3 px-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-400 font-sans cursor-pointer transition hover:bg-slate-50"
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
                className="bg-purple-600 hover:bg-purple-700 text-white border border-purple-550 active:scale-95 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5"
              >
                <Coins className="w-4 h-4" />
                <span>{showDrawForm ? 'Tutup Form Tarik Dana' : 'Tarik Tunai dari Kolektor'}</span>
              </button>
            )}

            {verifiedIds.length > 0 && (
              <button
                onClick={clearAllVerified}
                className="flex items-center gap-1.5 hover:bg-white/10 text-white border border-white/10 active:scale-95 px-3.5 py-1.5 rounded-xl text-xs font-semibold font-mono transition cursor-pointer"
                title="Reset Tanda Verifikasi di Browser Ini"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Validasi ({verifiedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Success banner */}
      {formSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl flex items-center gap-3 animate-in fade-in duration-300">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
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
                    const matchedUser = collectorsList.find(u => u.username === val);
                    const collectorName = matchedUser ? matchedUser.nama : val;
                    
                    const collectorCashPayments = monthlyLedger.filter(entry => 
                      isBillingPayment(entry) && 
                      entry.sumberKas === drawSector && 
                      (
                        entry.petugas.toLowerCase() === collectorName.toLowerCase() ||
                        entry.petugas.toLowerCase() === val.toLowerCase() ||
                        entry.petugas.toLowerCase().includes(collectorName.toLowerCase())
                      )
                    );
                    const totalCollected = collectorCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
                    
                    const collectorPenarikans = monthlyLedger.filter(entry => 
                      isPenarikanKolektor(entry) && 
                      entry.sumberKas === drawSector &&
                      (
                        entry.deskripsi.toLowerCase().includes(collectorName.toLowerCase()) ||
                        entry.deskripsi.toLowerCase().includes(val.toLowerCase())
                      )
                    );
                    const totalPenarikanByCollector = collectorPenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);
                    
                    const rem = Math.max(0, totalCollected - totalPenarikanByCollector);
                    setDrawAmount(rem > 0 ? rem.toString() : '0');
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
                    const sector = 'rtTunai';
                    setDrawSector(sector);
                    if (drawCollectorId) {
                      const val = drawCollectorId;
                      const matchedUser = collectorsList.find(u => u.username === val);
                      const collectorName = matchedUser ? matchedUser.nama : val;
                      
                      const collectorCashPayments = monthlyLedger.filter(entry => 
                        isBillingPayment(entry) && 
                        entry.sumberKas === sector && 
                        (
                          entry.petugas.toLowerCase() === collectorName.toLowerCase() ||
                          entry.petugas.toLowerCase() === val.toLowerCase() ||
                          entry.petugas.toLowerCase().includes(collectorName.toLowerCase())
                        )
                      );
                      const totalCollected = collectorCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
                      
                      const collectorPenarikans = monthlyLedger.filter(entry => 
                        isPenarikanKolektor(entry) && 
                        entry.sumberKas === sector &&
                        (
                          entry.deskripsi.toLowerCase().includes(collectorName.toLowerCase()) ||
                          entry.deskripsi.toLowerCase().includes(val.toLowerCase())
                        )
                      );
                      const totalPenarikanByCollector = collectorPenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);
                      
                      const rem = Math.max(0, totalCollected - totalPenarikanByCollector);
                      setDrawAmount(rem > 0 ? rem.toString() : '0');
                    }
                  }}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                    drawSector === 'rtTunai'
                      ? 'bg-purple-600 border-purple-555 text-white'
                      : 'bg-slate-800 border-slate-705 text-slate-400'
                  }`}
                >
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  RT Tunai
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sector = 'rombongTunai';
                    setDrawSector(sector);
                    if (drawCollectorId) {
                      const val = drawCollectorId;
                      const matchedUser = collectorsList.find(u => u.username === val);
                      const collectorName = matchedUser ? matchedUser.nama : val;
                      
                      const collectorCashPayments = monthlyLedger.filter(entry => 
                        isBillingPayment(entry) && 
                        entry.sumberKas === sector && 
                        (
                          entry.petugas.toLowerCase() === collectorName.toLowerCase() ||
                          entry.petugas.toLowerCase() === val.toLowerCase() ||
                          entry.petugas.toLowerCase().includes(collectorName.toLowerCase())
                        )
                      );
                      const totalCollected = collectorCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);
                      
                      const collectorPenarikans = monthlyLedger.filter(entry => 
                        isPenarikanKolektor(entry) && 
                        entry.sumberKas === sector &&
                        (
                          entry.deskripsi.toLowerCase().includes(collectorName.toLowerCase()) ||
                          entry.deskripsi.toLowerCase().includes(val.toLowerCase())
                        )
                      );
                      const totalPenarikanByCollector = collectorPenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);
                      
                      const rem = Math.max(0, totalCollected - totalPenarikanByCollector);
                      setDrawAmount(rem > 0 ? rem.toString() : '0');
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
                      <span className="text-purple-300 font-bold">{drawSector === 'rtTunai' ? 'RT Tunai' : 'Rombong Tunai'}</span>
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
                    min="100"
                    step="100"
                    placeholder="e.g. 150000"
                    value={drawAmount}
                    onChange={(e) => setDrawAmount(e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-400 font-mono"
                  />
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
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-xs py-3 px-4 rounded-xl transition shadow-md shadow-emerald-950/20 active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    Catat Serah Terima Tunai
                  </button>
                </div>
              </>
            )}
          </form>

          {/* Educational Accounting Alert */}
          <div className="bg-purple-950/20 text-purple-200 border border-purple-900/40 p-3 rounded-xl text-[10.5px] leading-relaxed flex items-start gap-2 max-w-5xl">
            <AlertCircle className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
            <div>
              <strong>Informasi Skema Pembukuan:</strong> Saldo kas digital sektoral (rtTunai / rombongTunai) sudah bertambah secara otomatis pada saat Kolektor menginput pelunasan iuran warga. Pengisian form penarikan ini <strong>tidak menduplikasi saldo digital kas</strong>, melainkan bertindak sebagai pencatat serah terima fisik uang tunai. Ini menurunkan <em>Sisa Tunai Kolektor</em> dan memindahkan simpanan ke <em>Sisa Tunai Bendahara</em> sebagai kontrol kelayakan sisa saldo tunai fisik sebelum didepositokan ke bank.
            </div>
          </div>
        </div>
      )}

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

        {/* Dynamic List Rendering */}
        <div>
          <div className="block md:hidden bg-sky-50 text-sky-700 border border-sky-100 rounded-xl px-4 py-2.5 mb-2.5 text-[10px] sm:text-xs font-semibold">
            💡 Geser kesamping ke kanan untuk melihat rincian tanggal, deskripsi, petugas, nominal, dan aksi verifikasi audit.
          </div>
          <div className="overflow-x-auto">
            {activeSubTab === 'tunai' && (
              <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold text-slate-500 font-mono">
                  <th className="p-4 w-5 text-center">No</th>
                  <th className="p-4">Tanggal Pembayaran</th>
                  <th className="p-4">Informasi Tagihan / Slip Pembayaran</th>
                  <th className="p-4">Jenis Kas</th>
                  <th className="p-4">Petugas Pembukuan</th>
                  <th className="p-4 text-right">Jumlah (Rp)</th>
                  <th className="p-4 text-center w-36">Verifikasi Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCashList.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 leading-relaxed font-sans">
                      Belum ada penerimaan iuran secara tunai yang tercatat pada periode {selectedMonth === 'semua' ? 'tahun ini' : `bulan ${INDONESIAN_MONTHS.find(m => m.value === selectedMonth)?.label}`}.
                    </td>
                  </tr>
                ) : (
                  filteredCashList.map((entry, index) => {
                    const isVerified = verifiedIds.includes(entry.id);
                    return (
                      <tr 
                        key={entry.id} 
                        className={`hover:bg-slate-50/80 transition duration-150 ${
                          isVerified ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="p-4 text-center font-mono opacity-65">{index + 1}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold block">{formatIndonesianDate(entry.tanggal)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID Ledger: {entry.id.substring(0, 10)}...</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 block leading-normal">{entry.deskripsi}</span>
                          <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] bg-indigo-50 text-indigo-700 px-1.5 py-0.25 rounded-md font-mono border border-indigo-100">
                            Category: {entry.kategori}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-mono leading-none ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-650 flex items-center gap-1.5 mt-0.5 font-sans">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.petugas}</span>
                        </td>
                        <td className="p-4 text-right font-black font-mono text-slate-900 whitespace-nowrap text-sm">
                          Rp {entry.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition flex items-center justify-center gap-1 w-full ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-white border-slate-205 text-slate-600 hover:border-slate-400 cursor-pointer'
                            }`}
                            title={!canVerify ? 'Hanya Bendahara atau Administrator yang berhak melakukan verifikasi' : 'Klik untuk mengubah status kecocokan'}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Telah Cocok</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
                                <span>Verifikasi</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSubTab === 'bank' && (
            <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold text-slate-500 font-mono">
                  <th className="p-4 w-5 text-center">No</th>
                  <th className="p-4">Tanggal Pembayaran</th>
                  <th className="p-4">Informasi Tagihan / Slip Pembayaran</th>
                  <th className="p-4">Jenis Kas</th>
                  <th className="p-4">Petugas Pembukuan</th>
                  <th className="p-4 text-right">Jumlah (Rp)</th>
                  <th className="p-4 text-center w-36">Verifikasi Audit</th>
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
                        className={`hover:bg-slate-50/80 transition duration-150 ${
                          isVerified ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="p-4 text-center font-mono opacity-65">{index + 1}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold block">{formatIndonesianDate(entry.tanggal)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID Ledger: {entry.id.substring(0, 10)}...</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 block leading-normal">{entry.deskripsi}</span>
                          <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] bg-slate-100 text-slate-700 px-1.5 py-0.25 rounded-md font-mono border border-slate-200">
                            Category: {entry.kategori}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-mono leading-none ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-650 flex items-center gap-1.5 mt-0.5 font-sans">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.petugas}</span>
                        </td>
                        <td className="p-4 text-right font-black font-mono text-slate-900 whitespace-nowrap text-sm">
                          Rp {entry.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition flex items-center justify-center gap-1 w-full ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-white border-slate-205 text-slate-600 hover:border-slate-400 cursor-pointer'
                            }`}
                            title={!canVerify ? 'Hanya Bendahara atau Administrator yang berhak melakukan verifikasi' : 'Klik untuk mengubah status kecocokan'}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Telah Cocok</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
                                <span>Verifikasi</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSubTab === 'penarikan_kolektor' && (
            <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold text-slate-500 font-mono">
                  <th className="p-4 w-5 text-center">No</th>
                  <th className="p-4">Tanggal Penarikan</th>
                  <th className="p-4">Deskripsi / Riwayat Pengambilan Kas Lapangan</th>
                  <th className="p-4">Tipe Penyimpanan</th>
                  <th className="p-4">Penerima (Bendahara)</th>
                  <th className="p-4 text-right">Jumlah Ditarik (Rp)</th>
                  <th className="p-4 text-center w-36">Verifikasi Audit</th>
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
                        className={`hover:bg-slate-50/80 transition duration-150 ${
                          isVerified ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="p-4 text-center font-mono opacity-65">{index + 1}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold block">{formatIndonesianDate(entry.tanggal)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID Penarikan: {entry.id.substring(0, 10)}...</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-905 block leading-normal">{entry.deskripsi}</span>
                          <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] bg-purple-50 text-purple-700 px-1.5 py-0.25 rounded-md font-mono border border-purple-100">
                            Petugas: {entry.petugas}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-mono leading-none ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-slate-650 flex items-center gap-1.5 mt-0.5 font-sans">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{entry.petugas}</span>
                        </td>
                        <td className="p-4 text-right font-black font-mono text-indigo-700 whitespace-nowrap text-sm">
                          Rp {entry.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition flex items-center justify-center gap-1 w-full ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-white border-slate-205 text-slate-600 hover:border-slate-400 cursor-pointer'
                            }`}
                            title={!canVerify ? 'Hanya Bendahara atau Administrator yang berhak melakukan verifikasi' : 'Klik untuk mengubah status kecocokan'}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Telah Cocok</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
                                <span>Verifikasi</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}

          {activeSubTab === 'setor_bank' && (
            <table className="w-full min-w-[780px] border-collapse text-left text-xs text-slate-700">
              <thead>
                <tr className="bg-slate-50/55 border-b border-slate-100 uppercase tracking-wider text-[10px] font-bold text-slate-500 font-mono">
                  <th className="p-4 w-5 text-center">No</th>
                  <th className="p-4">Tanggal Setor</th>
                  <th className="p-4">Deskripsi / Riwayat Penyetoran Cash</th>
                  <th className="p-4">Asal Saldo Fisik</th>
                  <th className="p-4">Tipe Transaksi</th>
                  <th className="p-4 text-right">Nominal Setor (Rp)</th>
                  <th className="p-4 text-center w-36">Verifikasi Audit</th>
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
                        className={`hover:bg-slate-50/80 transition duration-150 ${
                          isVerified ? 'bg-emerald-50/20' : ''
                        }`}
                      >
                        <td className="p-4 text-center font-mono opacity-65">{index + 1}</td>
                        <td className="p-4 whitespace-nowrap">
                          <span className="font-semibold block">{formatIndonesianDate(entry.tanggal)}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID Setoran: {entry.id.substring(0, 10)}...</span>
                        </td>
                        <td className="p-4">
                          <span className="font-extrabold text-slate-900 block leading-normal">{entry.deskripsi}</span>
                          <span className="inline-flex items-center gap-1 mt-1 text-[9.5px] bg-amber-50 text-amber-700 px-1.5 py-0.25 rounded-md font-mono border border-amber-100">
                            Petugas: {entry.petugas}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full border text-[9.5px] font-mono leading-none ${getKasBadgeColor(entry.sumberKas)}`}>
                            {getKasLabel(entry.sumberKas)}
                          </span>
                        </td>
                        <td className="p-4 whitespace-nowrap text-purple-705 font-semibold font-mono">
                          Pemindahbukuan
                        </td>
                        <td className="p-4 text-right font-black font-mono text-purple-750 whitespace-nowrap text-sm">
                          Rp {entry.jumlah.toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center whitespace-nowrap">
                          <button
                            disabled={!canVerify}
                            onClick={() => toggleVerifyId(entry.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10.5px] font-bold border transition flex items-center justify-center gap-1 w-full ${
                              !canVerify
                                ? 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                : isVerified
                                ? 'bg-emerald-700 border-emerald-750 text-white shadow-xs cursor-pointer'
                                : 'bg-white border-slate-205 text-slate-600 hover:border-slate-400 cursor-pointer'
                            }`}
                            title={!canVerify ? 'Hanya Bendahara atau Administrator yang berhak melakukan verifikasi' : 'Klik untuk mengubah status kecocokan'}
                          >
                            {isVerified ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                                <span>Telah Cocok</span>
                              </>
                            ) : (
                              <>
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-350" />
                                <span>Verifikasi</span>
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          )}
        </div>
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
