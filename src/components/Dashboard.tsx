import React, { useState } from 'react';
import { Balance, LedgerEntry, AppUser, WargaBill, RombongBill } from '../types';
import { calculateStorageFootprint, formatFileSize } from '../utils/fileSizeUtils';
import { compressImage } from '../utils/fileCompressor';
import { getCollectorBalancesForPeriod } from '../utils/collectorUtils';
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  CreditCard, 
  Store, 
  PlusCircle, 
  Activity, 
  Edit2, 
  Check, 
  X,
  AlertCircle,
  ArrowLeftRight,
  Briefcase,
  Landmark,
  Receipt,
  Camera,
  Trash2,
  Cloud
} from 'lucide-react';

interface DashboardProps {
  kas: Balance;
  updateKas: (newKas: Balance) => void;
  ledger: LedgerEntry[];
  addLedgerEntry: (entry: Omit<LedgerEntry, 'id'>) => void;
  isLoggedIn: boolean;
  currentUser: AppUser | null;
  onNavigateToTab?: (tab: 'dashboard' | 'tagihan' | 'buku_kas' | 'panduan') => void;
  onTriggerLogin?: () => void;
  wargaList?: WargaBill[];
  rombongList?: RombongBill[];
}

export default function Dashboard({ 
  kas, 
  updateKas, 
  ledger, 
  addLedgerEntry, 
  isLoggedIn,
  currentUser,
  onNavigateToTab,
  onTriggerLogin,
  wargaList = [],
  rombongList = []
}: DashboardProps) {
  const isKolektor = currentUser?.role === 'kolektor';
  const isKolektor2 = isKolektor && currentUser && (
    currentUser.username.toLowerCase().includes('kolektor2') || 
    currentUser.nama.toLowerCase().includes('kolektor2')
  );

  // Precompute derived cash balances from the ledger entries (the ultimate truth of real transactional flows)
  const derivedKas = React.useMemo(() => {
    let rtPettyCash = 0;
    let rtTunai = 0;
    let rtBank = 0;
    let rombongTunai = 0;
    let rombongBank = 0;

    ledger.forEach(item => {
      // Exclude "Penarikan Dana Kolektor" from derived balances because the funds are already counted 
      // when the citizen payment is entered as a ledger item. Counting both would result in double counting.
      if (item.kategori === 'Penarikan Dana Kolektor') {
        return;
      }

      const val = item.jumlah;
      const isPemasukan = item.tipe === 'pemasukan';
      
      if (item.sumberKas === 'rtBank') {
        rtBank += isPemasukan ? val : -val;
      } else if (item.sumberKas === 'rombongTunai') {
        rombongTunai += isPemasukan ? val : -val;
      } else if (item.sumberKas === 'rombongBank') {
        rombongBank += isPemasukan ? val : -val;
      } else if (item.sumberKas === 'rtTunai' || item.sumberKas === 'rtPettyCash') {
        const desc = (item.deskripsi || '').toLowerCase();
        const isTagihan = 
          item.kategori === 'Iuran RT' || 
          item.kategori === 'Setor Bank' ||
          desc.includes('iuran rt') || 
          desc.includes('tagihan rt') || 
          desc.includes('koreksi edit iuran') ||
          desc.includes('koreksi batalkan iuran') ||
          desc.includes('setor bank') ||
          desc.includes('setor hasil tagihan');

        if (isTagihan) {
          rtTunai += isPemasukan ? val : -val;
        } else {
          rtPettyCash += isPemasukan ? val : -val;
        }
      }
    });

    return {
      rtTunai,
      rtPettyCash,
      rtBank,
      rombongTunai,
      rombongBank
    };
  }, [ledger]);

  const isAdminOrTreasurerOrSecretary = currentUser?.role === 'admin' || currentUser?.role === 'bendahara' || currentUser?.role === 'sekretaris' || currentUser?.role === 'audit';
  const activeKas = isAdminOrTreasurerOrSecretary ? derivedKas : kas;

  const colBalancesRT = currentUser ? getCollectorBalancesForPeriod(ledger, currentUser.username, currentUser.nama, 'rtPettyCash') : { totalCollected: 0, totalPenarikan: 0, remaining: 0 };
  const colBalancesRombong = currentUser ? getCollectorBalancesForPeriod(ledger, currentUser.username, currentUser.nama, 'rombongTunai') : { totalCollected: 0, totalPenarikan: 0, remaining: 0 };

  const totalRT = isKolektor2 ? 0 : (isKolektor ? colBalancesRT.remaining : (activeKas.rtPettyCash + activeKas.rtTunai + activeKas.rtBank));
  const totalRombong = isKolektor ? colBalancesRombong.remaining : (activeKas.rombongTunai + activeKas.rombongBank);
  const totalKeseluruhan = totalRT + totalRombong;

  // Manual Balance Editing state
  const [editingKey, setEditingKey] = useState<keyof Balance | null>(null);
  const [editingValue, setEditingValue] = useState<string>('');

  // Quick transaction form states
  const [showQuickTx, setShowQuickTx] = useState(false);
  const [activeTab, setActiveTab] = useState<'tagihan' | 'petty' | 'bank'>('petty');
  
  const [newTx, setNewTx] = useState({
    tanggal: '',
    deskripsi: '',
    jumlah: '',
    tipe: 'pengeluaran' as 'pemasukan' | 'pengeluaran',
    sumberKas: 'rtPettyCash' as keyof Balance,
    kategori: 'Kas Kecil',
    petugas: '',
    fotoBase64: '',
    fotoNamaFile: ''
  });

  // Specialized transaction helper states
  const [tagihanType, setTagihanType] = useState<'setor_bank'>('setor_bank');
  const [bankType, setBankType] = useState<'bank_ke_petty' | 'petty_ke_bank'>('bank_ke_petty');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferDesc, setTransferDesc] = useState('');
  const [transferPetugas, setTransferPetugas] = useState('');
  const [transferDate, setTransferDate] = useState('');
  const [sectorSetor, setSectorSetor] = useState<'rt' | 'rombong'>('rt');

  const kasLabels: Record<keyof Balance, { label: string; group: 'RT' | 'Rombong'; desc: string }> = {
    rtTunai: { label: 'Iuran RT Tunai', group: 'RT', desc: 'Sisa Hasil Tagihan Iuran Warga (Tunai)' },
    rtPettyCash: { label: 'Kas Kecil RT', group: 'RT', desc: 'Sisa Kas Kecil (Biaya RT / Operasional RT)' },
    rtBank: { label: 'Kas Umum Bank', group: 'RT', desc: 'Rekening bank / Kas Umum RT 08' },
    rombongTunai: { label: 'Rombong Tunai', group: 'Rombong', desc: 'Kas tunai iuran Rombong Kuliner' },
    rombongBank: { label: 'Rombong Bank', group: 'Rombong', desc: 'Rekening bank iuran Rombong' },
  };

  const startEdit = (key: keyof Balance) => {
    if (!isLoggedIn || currentUser?.role === 'sekretaris' || currentUser?.role === 'kolektor' || currentUser?.role === 'audit') return;
    setEditingKey(key);
    setEditingValue(kas[key].toString());
  };

  const saveEdit = () => {
    if (editingKey) {
      const parsed = parseFloat(editingValue);
      if (!isNaN(parsed) && parsed >= 0) {
        const nextKas = { ...kas, [editingKey]: parsed };
        updateKas(nextKas);
        
        // Log custom transaction as adjustment
        const diff = parsed - kas[editingKey];
        if (diff !== 0) {
          addLedgerEntry({
            tanggal: new Date().toISOString().split('T')[0],
            deskripsi: `Penyesuaian Saldo Manual: ${kasLabels[editingKey].label}`,
            jumlah: Math.abs(diff),
            tipe: diff > 0 ? 'pemasukan' : 'pengeluaran',
            sumberKas: editingKey,
            kategori: 'Penyesuaian Saldo',
            petugas: 'Administrator'
          });
        }
      }
      setEditingKey(null);
    }
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    if (activeTab === 'petty') {
      const parsedAmount = parseFloat(newTx.jumlah);
      if (!newTx.deskripsi || isNaN(parsedAmount) || parsedAmount <= 0) return;

      const sKas = newTx.sumberKas || 'rtPettyCash';

      if (newTx.tipe === 'pengeluaran' && activeKas[sKas] < parsedAmount) {
        alert(`Peringatan: Saldo ${kasLabels[sKas].label} (Rp ${activeKas[sKas].toLocaleString('id-ID')}) tidak mencukupi untuk operasional sebesar Rp ${parsedAmount.toLocaleString('id-ID')}!`);
        return;
      }

      addLedgerEntry({
        tanggal: newTx.tanggal || today,
        tanggalInput: today,
        deskripsi: newTx.deskripsi,
        jumlah: parsedAmount,
        tipe: newTx.tipe,
        sumberKas: sKas,
        kategori: newTx.kategori || 'Kas Kecil',
        petugas: newTx.petugas || 'Pemegang Kas Kecil',
        fotoBase64: newTx.fotoBase64 || undefined,
        fotoNamaFile: newTx.fotoNamaFile || undefined
      });

      const updatedBalance = { ...kas };
      if (newTx.tipe === 'pemasukan') {
        updatedBalance[sKas] += parsedAmount;
      } else {
        updatedBalance[sKas] -= parsedAmount;
      }
      updateKas(updatedBalance);

      // Reset
      setNewTx({
        tanggal: '',
        deskripsi: '',
        jumlah: '',
        tipe: 'pengeluaran',
        sumberKas: 'rtPettyCash',
        kategori: 'Kas Kecil',
        petugas: '',
        fotoBase64: '',
        fotoNamaFile: ''
      });
      setShowQuickTx(false);

    } else if (activeTab === 'tagihan') {
      // setor_bank (Pemindahbukuan Hasil Tagihan -> Bank)
      const parsedAmount = parseFloat(transferAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return;

      const sourceKas: keyof Balance = sectorSetor === 'rt' ? 'rtTunai' : 'rombongTunai';
      const targetKas: keyof Balance = sectorSetor === 'rt' ? 'rtBank' : 'rombongBank';

      if (activeKas[sourceKas] < parsedAmount) {
        alert(`Peringatan: Saldo ${kasLabels[sourceKas].label} (Rp ${activeKas[sourceKas].toLocaleString('id-ID')}) tidak mencukupi untuk disetorkan ke bank sebesar Rp ${parsedAmount.toLocaleString('id-ID')}!`);
        return;
      }

      const customDesc = transferDesc || `Setor Bank: Pemindahbukuan Hasil Tagihan ${sectorSetor.toUpperCase()}`;
      const effectiveDate = transferDate || today;
      
      // 1. Outgoing from tunai
      addLedgerEntry({
        tanggal: effectiveDate,
        tanggalInput: today,
        deskripsi: `${customDesc} (Debet Tunai)`,
        jumlah: parsedAmount,
        tipe: 'pengeluaran',
        sumberKas: sourceKas,
        kategori: 'Setor Bank',
        petugas: transferPetugas || 'Bendahara RT'
      });

      // 2. Incoming to bank
      addLedgerEntry({
        tanggal: effectiveDate,
        tanggalInput: today,
        deskripsi: `${customDesc} (Kredit Bank)`,
        jumlah: parsedAmount,
        tipe: 'pemasukan',
        sumberKas: targetKas,
        kategori: 'Setor Bank',
        petugas: transferPetugas || 'Bendahara RT'
      });

      const updatedBalance = { ...kas };
      updatedBalance[sourceKas] -= parsedAmount;
      updatedBalance[targetKas] += parsedAmount;
      updateKas(updatedBalance);

      // Reset
      setTransferAmount('');
      setTransferDesc('');
      setTransferPetugas('');
      setTransferDate('');
      setShowQuickTx(false);

    } else if (activeTab === 'petty') {
      const parsedAmount = parseFloat(newTx.jumlah);
      if (!newTx.deskripsi || isNaN(parsedAmount) || parsedAmount <= 0) return;

      if (newTx.tipe === 'pengeluaran' && activeKas.rtPettyCash < parsedAmount) {
        alert(`Peringatan: Saldo Kas Kecil (Rp ${activeKas.rtPettyCash.toLocaleString('id-ID')}) tidak mencukupi untuk operasional sebesar Rp ${parsedAmount.toLocaleString('id-ID')}!`);
        return;
      }

      addLedgerEntry({
        tanggal: newTx.tanggal || today,
        tanggalInput: today,
        deskripsi: `${newTx.deskripsi} (Buku Kas Kecil)`,
        jumlah: parsedAmount,
        tipe: newTx.tipe,
        sumberKas: 'rtPettyCash',
        kategori: newTx.kategori || 'Kas Kecil',
        petugas: newTx.petugas || 'Pemegang Kas Kecil',
        fotoBase64: newTx.fotoBase64 || undefined,
        fotoNamaFile: newTx.fotoNamaFile || undefined
      });

      const updatedBalance = { ...kas };
      if (newTx.tipe === 'pemasukan') {
        updatedBalance.rtPettyCash += parsedAmount;
      } else {
        updatedBalance.rtPettyCash -= parsedAmount;
      }
      updateKas(updatedBalance);

      // Reset
      setNewTx({
        tanggal: '',
        deskripsi: '',
        jumlah: '',
        tipe: 'pengeluaran',
        sumberKas: 'rtPettyCash',
        kategori: 'Kas Kecil',
        petugas: '',
        fotoBase64: '',
        fotoNamaFile: ''
      });
      setShowQuickTx(false);

    } else if (activeTab === 'bank') {
      const parsedAmount = parseFloat(transferAmount);
      if (isNaN(parsedAmount) || parsedAmount <= 0) return;

      const sourceKas: keyof Balance = bankType === 'bank_ke_petty' ? 'rtBank' : 'rtPettyCash';
      const targetKas: keyof Balance = bankType === 'bank_ke_petty' ? 'rtPettyCash' : 'rtBank';

      if (activeKas[sourceKas] < parsedAmount) {
        alert(`Peringatan: Saldo ${kasLabels[sourceKas].label} (Rp ${activeKas[sourceKas].toLocaleString('id-ID')}) tidak mencukupi untuk transfer/mutasi sebesar Rp ${parsedAmount.toLocaleString('id-ID')}!`);
        return;
      }

      const customDesc = transferDesc || (bankType === 'bank_ke_petty' 
        ? 'Mutasi Bank: Pengisian Saldo Kas Kecil (Tarik Tunai)' 
        : 'Mutasi Bank: Penyetoran Sisa Kas Kecil');
      const effectiveDate = transferDate || today;

      // 1. Debit out of source
      addLedgerEntry({
        tanggal: effectiveDate,
        tanggalInput: today,
        deskripsi: `${customDesc} (Debet Pengirim)`,
        jumlah: parsedAmount,
        tipe: 'pengeluaran',
        sumberKas: sourceKas,
        kategori: 'Mutasi Bank-Petty',
        petugas: transferPetugas || 'Bendahara RT'
      });

      // 2. Credit into target
      addLedgerEntry({
        tanggal: effectiveDate,
        tanggalInput: today,
        deskripsi: `${customDesc} (Kredit Penerima)`,
        jumlah: parsedAmount,
        tipe: 'pemasukan',
        sumberKas: targetKas,
        kategori: 'Mutasi Bank-Petty',
        petugas: transferPetugas || 'Bendahara RT'
      });

      const updatedBalance = { ...kas };
      updatedBalance[sourceKas] -= parsedAmount;
      updatedBalance[targetKas] += parsedAmount;
      updateKas(updatedBalance);

      // Reset
      setTransferAmount('');
      setTransferDesc('');
      setTransferPetugas('');
      setTransferDate('');
      setShowQuickTx(false);
    }
  };

  // Aggregation calculations for stats cards (excluding internal transfers)
  const totalPemasukan = ledger
    .filter(e => 
      e.tipe === 'pemasukan' && 
      e.kategori !== 'Setor Bank' && 
      e.kategori !== 'Mutasi Bank-Petty' && 
      e.kategori !== 'Penarikan Dana Kolektor'
    )
    .reduce((sum, e) => sum + e.jumlah, 0);

  const totalPengeluaran = ledger
    .filter(e => 
      e.tipe === 'pengeluaran' && 
      e.kategori !== 'Setor Bank' && 
      e.kategori !== 'Mutasi Bank-Petty' && 
      e.kategori !== 'Penarikan Dana Kolektor'
    )
    .reduce((sum, e) => sum + e.jumlah, 0);

  // Percent proportions for beautiful modern bar chart
  const rtProportion = isKolektor2 ? 0 : (totalKeseluruhan > 0 ? (totalRT / totalKeseluruhan) * 100 : 0);
  const rombongProportion = isKolektor2 ? 100 : (totalKeseluruhan > 0 ? (totalRombong / totalKeseluruhan) * 100 : 0);

  return (
    <div className="space-y-6">
      
      {/* Saldo Utama Card */}
      <div className="bg-slate-900 border border-slate-900 rounded-2xl p-6 relative overflow-hidden shadow-xl text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/10 rounded-full blur-3xl -z-10 translate-x-12 -translate-y-12" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500/5 rounded-full blur-2xl -z-10 -translate-x-12 translate-y-12" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              {isKolektor2 ? 'Total Saldo Sewa Rombong (Tunai)' : isKolektor ? 'Total Saldo Tunai Kolektif (Warga & Rombong)' : 'Total Saldo Terkonsolidasi'}
            </span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-2 tracking-tight">
              Rp {totalKeseluruhan.toLocaleString('id-ID')}
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-mono">
              Status Sinkronisasi: Lokal Perangkat (Aktif)
            </p>
          </div>

          {/* Quick Actions or Kolektor/Sekretaris Info */}
          {isKolektor || (isLoggedIn && (currentUser?.role === 'sekretaris' || currentUser?.role === 'audit')) ? (
            <div className={`p-3.5 border rounded-2xl text-xs max-w-md flex items-start gap-2.5 ${
              currentUser?.role === 'sekretaris'
                ? 'bg-sky-500/10 border-sky-500/20 text-sky-200'
                : currentUser?.role === 'audit'
                ? 'bg-rose-500/10 border-rose-500/20 text-rose-200'
                : 'bg-purple-500/10 border-purple-500/20 text-purple-200'
            }`}>
              <AlertCircle className={`w-4 h-4 shrink-0 mt-0.5 ${
                currentUser?.role === 'sekretaris' ? 'text-sky-450' : currentUser?.role === 'audit' ? 'text-rose-400' : 'text-purple-400'
              }`} />
              <div>
                <span className="font-extrabold block">
                  {currentUser?.role === 'sekretaris' ? 'Akses Khusus Sekretaris (Baca-Saja)' : currentUser?.role === 'audit' ? 'Akses Khusus Audit (Baca-Saja)' : isKolektor2 ? 'Akses Khusus Kolektor Sewa Rombong' : 'Akses Khusus Kolektor'}
                </span>
                <span className="opacity-95 block text-[11px] mt-0.5 leading-relaxed">
                  {currentUser?.role === 'sekretaris'
                    ? 'Peran Sekretaris diizinkan untuk melihat rekap buku kas & keuangan RT secara menyeluruh. Namun, kewenangan menambah kas, mencatatkan mutasi, dan penyesuaian saldo dinonaktifkan.'
                    : currentUser?.role === 'audit'
                    ? 'Peran Audit diizinkan untuk memantau dan mengaudit seluruh kas, mutasi, laporan keuangan, dan rekap detail iuran secara menyeluruh (Baca-Saja).'
                    : isKolektor2
                    ? 'Peran Kolektor Sewa Rombong diizinkan untuk melihat, menampung, dan menyerahkan uang setoran Sewa Rombong. Akses pada iuran warga RT dinonaktifkan.'
                    : 'Peran Kolektor diizinkan untuk melihat saldo tunai hasil iuran warga/rombong sebelum/sesudah disetor ke bank. Pencatatan ledger umum & buku kas dinonaktifkan.'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2.5 items-center">
              <button 
                onClick={() => {
                  if (isLoggedIn) {
                    setShowQuickTx(!showQuickTx);
                  } else {
                    onTriggerLogin?.();
                  }
                }}
                className="flex items-center gap-3 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition duration-200 text-xs sm:text-sm shadow-md shadow-sky-500/20 active:scale-95 cursor-pointer"
                id="btn-quick-tx"
              >
                <PlusCircle className="w-5 h-5 shrink-0" />
                <div className="text-left leading-tight">
                  <span className="block font-bold text-sm tracking-wide">Input Transaksi & Catat Mutasi Kas RT</span>
                  <span className="block text-[9.5px] text-sky-100 font-normal mt-0.5">Formulir Setor Tagihan Bank, Kas Kecil, & Pengeluaran Kas Umum</span>
                </div>
              </button>

              {!isLoggedIn && (
                <div className="w-full text-[11px] text-amber-300 flex items-center gap-1.5 leading-normal mt-1 opacity-90 font-sans">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Masuk Pengurus/Admin di menu bawah untuk menambah data & ubah saldo secara mandiri.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Visual Charts Component (Native HTML/SVG bar visualizer) */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex justify-between text-xs font-mono text-slate-300 mb-2">
            <span>{isKolektor ? 'Proporsi Saldo Tunai Kolektif' : 'Alokasi Keuangan'}</span>
            <span>RT: {rtProportion.toFixed(1)}% | Rombong: {rombongProportion.toFixed(1)}%</span>
          </div>
          <div className="w-full h-3.5 bg-slate-850 rounded-full overflow-hidden flex shadow-inner">
            <div 
              style={{ width: `${rtProportion}%` }} 
              className="bg-gradient-to-r from-sky-400 to-blue-500 hover:brightness-110 transition-all duration-500 h-full cursor-help"
              title={`Sektor Kas RT: ${rtProportion.toFixed(1)}%`}
            />
            <div 
              style={{ width: `${rombongProportion}%` }} 
              className="bg-gradient-to-r from-emerald-400 to-teal-500 hover:brightness-110 transition-all duration-500 h-full cursor-help"
              title={`Sektor Rombong: ${rombongProportion.toFixed(1)}%`}
            />
          </div>
          <div className="flex flex-col gap-2 mt-4 text-xs font-medium">
            <div className="flex flex-wrap justify-start gap-x-6 gap-y-2">
              {!isKolektor2 && (
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-sky-400 shrink-0" />
                  <span className="text-slate-300">{isKolektor ? 'Saldo Tunai RT:' : 'Total Sektor RT:'}</span>
                  <span className="text-sky-300 font-mono font-bold">Rp {totalRT.toLocaleString('id-ID')}</span>
                </div>
              )}
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-400 shrink-0" />
                <span className="text-slate-300">{isKolektor ? 'Saldo Tunai Rombong:' : 'Total Sektor Rombong:'}</span>
                <span className="text-emerald-300 font-mono font-bold">Rp {totalRombong.toLocaleString('id-ID')}</span>
              </div>
            </div>

            {/* Rincian RT Tunai & Kas Kecil */}
            {!isKolektor && !isKolektor2 && (
              <div className="mt-2 pl-5 border-l border-slate-700 flex flex-col gap-1.5 text-[11px] text-slate-400 font-mono leading-relaxed">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                  <span>Sisa Kas Kecil (Operasional RT):</span>
                  <span className="text-indigo-300 font-bold">Rp {activeKas.rtPettyCash.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                  <span>Sisa Hasil Tagihan Iuran Warga (Tunai):</span>
                  <span className="text-amber-300 font-bold">Rp {activeKas.rtTunai.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-450 shrink-0" />
                  <span>Kas Umum Rekening Bank RT:</span>
                  <span className="text-sky-350 font-bold">Rp {activeKas.rtBank.toLocaleString('id-ID')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Tx Form Module toggler */}
      {showQuickTx && isLoggedIn && (
        <div className="bg-white border border-slate-250 rounded-2xl p-6 shadow-lg animate-in fade-in slide-in-from-top-4 duration-300 text-slate-800">
          <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
            <h3 className="font-bold text-slate-900 flex items-center gap-2 text-md">
              <Coins className="w-5 h-5 text-sky-600" />
              Form Pembukuan & Transaksi Kas RT 08
            </h3>
            <button 
              onClick={() => {
                setShowQuickTx(false);
                // Reset inputs when closing
                setTransferAmount('');
                setTransferDesc('');
                setTransferPetugas('');
              }}
              className="p-1 px-2.5 rounded-lg bg-slate-100 text-slate-500 hover:text-slate-950 transition cursor-pointer text-xs font-mono font-bold"
            >
              Tutup [X]
            </button>
          </div>

          {/* Module Selector Sub-Tabs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-6 bg-slate-50 p-1.5 rounded-2xl border border-slate-150">
            <button
              type="button"
              onClick={() => {
                setActiveTab('tagihan');
                setNewTx({ ...newTx, kategori: 'Setor Bank', tipe: 'pengeluaran', sumberKas: 'rtPettyCash' });
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'tagihan'
                  ? 'bg-sky-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              Setor hasil tagihan (Tunai ke Bank)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('petty');
                setNewTx({ ...newTx, kategori: 'Kas Kecil', tipe: 'pengeluaran', sumberKas: 'rtPettyCash' });
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'petty'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              Buku Kas Kecil (Biaya RT)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('bank');
              }}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === 'bank'
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Landmark className="w-3.5 h-3.5" />
              Catatan Bank (Mutasi)
            </button>
          </div>

          <form onSubmit={handleCreateTx} className="space-y-4">
            
            {/* 1. SEKTOR SETOR BANK TAB */}
            {activeTab === 'tagihan' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-sky-50 text-sky-800 border border-sky-200 p-3.5 rounded-xl text-xs leading-relaxed">
                  💡 <strong>Pemindahbukuan Setor Bank:</strong> Berfungsi memindahkan simpanan kas RT yang awalnya terkumpul secara <strong>Tunai (Tunai Fisik)</strong> ke rekening <strong>Tabungan Bank</strong>. Transaksi ini akan tercatat secara akurat di buku kas sebagai pengeluaran tunai dan pemasukan bank yang seimbang, menjaga total keseluruhan kas konstan.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Sektor / Kas yang Disetor</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSectorSetor('rt')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${
                          sectorSetor === 'rt'
                            ? 'bg-sky-600 text-white border-sky-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        RT (Tunai ➔ Bank)
                        <div className="text-[10px] opacity-75 font-mono">Sisa Kas Kecil: Rp {activeKas.rtPettyCash.toLocaleString('id-ID')}</div>
                        <div className="text-[10px] opacity-95 font-mono font-bold text-amber-300">Sisa Hasil Tagihan: Rp {activeKas.rtTunai.toLocaleString('id-ID')}</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSectorSetor('rombong')}
                        className={`py-2 px-3 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${
                          sectorSetor === 'rombong'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        Rombong (Tunai ➔ Bank)
                        <div className="text-[10px] opacity-75 font-mono">Sisa Tunai: Rp {activeKas.rombongTunai.toLocaleString('id-ID')}</div>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Nominal yang Disetorkan ke Bank (Rp)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="e.g. 500000"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Transaksi (Opsional, Default Hari Ini)</label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={e => setTransferDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Catatan / Deskripsi Setor Bank (Opsional)</label>
                    <input
                      type="text"
                      placeholder={`Setor Bank: Penyetoran Akumulasi hasil Iuran Cash ${sectorSetor.toUpperCase()}`}
                      value={transferDesc}
                      onChange={e => setTransferDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Nama Petugas Penyetor / Bendahara</label>
                    <input
                      type="text"
                      placeholder="Nama Pengurus Pemindah Kas"
                      value={transferPetugas}
                      onChange={e => setTransferPetugas(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. KAS KECIL TAB */}
            {activeTab === 'petty' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-amber-50 text-amber-900 border border-amber-200 p-3.5 rounded-xl text-xs leading-relaxed">
                  💸 <strong>Buku Kas Kecil RT:</strong> Mengelola kas kecil RT 08 untuk operasional umum dan tak terduga <strong>di luar iuran bulanan wajib</strong>. cth: Pembelian sapu kebersihan, snack kader PKK, ATK print laporan, sumbangan warga kondisional.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tipe Mutasi Buku Kas Kecil</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewTx({ ...newTx, tipe: 'pengeluaran' })}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center border ${
                          newTx.tipe === 'pengeluaran'
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        🔴 Pengeluaran RT
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTx({ ...newTx, tipe: 'pemasukan' })}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center border ${
                          newTx.tipe === 'pemasukan'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        🟢 Penerimaan RT
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Akun Rekening Penerima / Pengeluaran</label>
                    <select
                      value={newTx.sumberKas}
                      onChange={e => setNewTx({ ...newTx, sumberKas: e.target.value as keyof Balance })}
                      className="w-full bg-slate-50 border border-slate-205 rounded-xl p-2.5 text-xs text-slate-955 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono font-bold"
                    >
                      <option value="rtPettyCash">[RT] Kas Kecil (Sisa: Rp {activeKas.rtPettyCash.toLocaleString('id-ID')})</option>
                      <option value="rtBank">[RT] Kas Umum (Sisa: Rp {activeKas.rtBank.toLocaleString('id-ID')})</option>
                      <option value="rombongTunai">[Rombong] Rombong Tunai (Sisa: Rp {activeKas.rombongTunai.toLocaleString('id-ID')})</option>
                      <option value="rombongBank">[Rombong] Rombong Bank (Sisa: Rp {activeKas.rombongBank.toLocaleString('id-ID')})</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Deskripsi Lengkap Transaksi (Buku Kas Kecil)</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Pembelian 3 buah sapu lidi untuk kerja bakti"
                      value={newTx.deskripsi}
                      onChange={e => setNewTx({ ...newTx, deskripsi: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Nominal Biaya (Rp)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="e.g. 45000"
                      value={newTx.jumlah}
                      onChange={e => setNewTx({ ...newTx, jumlah: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Transaksi (Opsional, Default Hari Ini)</label>
                    <input
                      type="date"
                      value={newTx.tanggal}
                      onChange={e => setNewTx({ ...newTx, tanggal: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Kategori Transaksi Kas Kecil</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Alat Kebersihan, Konsumsi, ATK Dinas"
                      value={newTx.kategori}
                      onChange={e => setNewTx({ ...newTx, kategori: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Petugas / PJV Operasional</label>
                    <input
                      type="text"
                      placeholder="Nama Pelaksana/Pengurus Lapangan"
                      value={newTx.petugas}
                      onChange={e => setNewTx({ ...newTx, petugas: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="md:col-span-2 bg-slate-50 border border-dashed border-slate-250 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                    <label className="block text-xs font-bold text-slate-700 font-mono mb-1 text-center w-full">Foto Nota / Bukti Transaksi Kas Kecil</label>
                    {newTx.fotoBase64 ? (
                      <div className="relative group w-32 h-32 border rounded-xl overflow-hidden shadow-xs bg-white">
                        <img src={newTx.fotoBase64} alt="Preview Bukti" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewTx({ ...newTx, fotoBase64: '', fotoNamaFile: '' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Camera className="w-8 h-8 mb-1 text-slate-350" />
                        <span className="text-[10px] text-slate-500 font-semibold mb-1">Unggah foto nota, kuitansi, atau bukti bayar (maks. 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setNewTx(prev => ({
                                  ...prev,
                                  fotoBase64: compressed,
                                  fotoNamaFile: file.name
                                }));
                              } catch (err) {
                                console.error(err);
                                alert('Gagal mengompres gambar.');
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer hidden"
                          id="upload-petty-rx"
                        />
                        <label
                          htmlFor="upload-petty-rx"
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 pointer-events-auto border border-slate-205 hover:border-slate-300 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm transition"
                        >
                          Pilih Foto
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 3. CATATAN BANK MUTASI TAB */}
            {activeTab === 'bank' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-emerald-50 text-emerald-900 border border-emerald-200 p-3.5 rounded-xl text-xs leading-relaxed">
                  🏦 <strong>Pemindahbukuan Bank ⇄ Kas Kecil:</strong> Berfungsi mencatat pencairan dana bank ke laci kas operasional, maupun penyetoran kelebihan kas kecil secara formal.
                </div>

                {/* Switch direction */}
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  <button
                    type="button"
                    onClick={() => setBankType('bank_ke_petty')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center border ${
                      bankType === 'bank_ke_petty'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    📥 Tarik Kas Umum ➔ Isi Kas Kecil
                    <div className="text-[10px] font-mono font-medium opacity-80 mt-0.5">Sisa Kas Umum: Rp {activeKas.rtBank.toLocaleString('id-ID')}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setBankType('petty_ke_bank')}
                    className={`py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center border ${
                      bankType === 'petty_ke_bank'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-white text-slate-500 border-slate-200'
                    }`}
                  >
                    📤 Setor Sisa Kas Kecil ➔ Kas Umum
                    <div className="text-[10px] font-mono font-medium opacity-80 mt-0.5">Sisa Kas Kecil: Rp {activeKas.rtPettyCash.toLocaleString('id-ID')}</div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Nominal Mutasi Rekening (Rp)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="e.g. 300000"
                      value={transferAmount}
                      onChange={e => setTransferAmount(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Transaksi (Opsional, Default Hari Ini)</label>
                    <input
                      type="date"
                      value={transferDate}
                      onChange={e => setTransferDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Deskripsi Lengkap Mutasi (Opsional)</label>
                    <input
                      type="text"
                      placeholder={bankType === 'bank_ke_petty' 
                        ? 'Mutasi Bank: Penarikan dana rekening mengisi Kas Kecil operasional' 
                        : 'Mutasi Bank: Penyetoran kelebihan sisa Kas Kecil ke rekening'
                      }
                      value={transferDesc}
                      onChange={e => setTransferDesc(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Petugas Otoritas / Bendahara Utama</label>
                    <input
                      type="text"
                      placeholder="Nama Pengurus Akuntansi"
                      value={transferPetugas}
                      onChange={e => setTransferPetugas(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. KAS UMUM COMPREHENSIVE TAB */}
            {activeTab === 'umum' && (
              <div className="space-y-4 animate-in fade-in duration-150">
                <div className="bg-slate-50 text-slate-800 border border-slate-200 p-3.5 rounded-xl text-xs leading-relaxed">
                  🌐 <strong>Pemasukan & Pengeluaran Kas Umum:</strong> Buku ledger pencatatan serbaguna untuk iuran luar biasa, hibah, sumbangan, pengeluaran darurat, pembangunan fisik RT, kas rombong kuliner, baik melalui kas tunai maupun rekening bank masing-masing sektor.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tipe Mutasi Umum</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewTx({ ...newTx, tipe: 'pemasukan' })}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center border ${
                          newTx.tipe === 'pemasukan'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        📥 Dana Masuk (Pemasukan)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewTx({ ...newTx, tipe: 'pengeluaran' })}
                        className={`py-2 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer text-center border ${
                          newTx.tipe === 'pengeluaran'
                            ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-xs'
                            : 'bg-white text-slate-500 border-slate-200'
                        }`}
                      >
                        📤 Dana Keluar (Pengeluaran)
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Sumber Akun Kas</label>
                    <select
                      value={newTx.sumberKas}
                      onChange={e => setNewTx({ ...newTx, sumberKas: e.target.value as keyof Balance })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    >
                      {Object.entries(kasLabels).map(([key, item]) => (
                        <option key={key} value={key}>
                          [{item.group}] {item.label} (Sisa: Rp {activeKas[key as keyof Balance].toLocaleString('id-ID')})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Deskripsi Lengkap Transaksi</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Pembelian semen 5 piring untuk talang jalan Blok G"
                      value={newTx.deskripsi}
                      onChange={e => setNewTx({ ...newTx, deskripsi: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Nominal Mutasi Kas (Rp)</label>
                    <input
                      required
                      type="number"
                      min="1"
                      placeholder="e.g. 250000"
                      value={newTx.jumlah}
                      onChange={e => setNewTx({ ...newTx, jumlah: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Tanggal Transaksi (Opsional, Default Hari Ini)</label>
                    <input
                      type="date"
                      value={newTx.tanggal}
                      onChange={e => setNewTx({ ...newTx, tanggal: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Kategori Transaksi Kas</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Pembangunan Fisik, Hibah, Kas Rombong"
                      value={newTx.kategori}
                      onChange={e => setNewTx({ ...newTx, kategori: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-650 mb-1.5 font-mono">Petugas Pelaksana Transaksi</label>
                    <input
                      type="text"
                      placeholder="Nama Pengurus RT Pembuat Mutasi"
                      value={newTx.petugas}
                      onChange={e => setNewTx({ ...newTx, petugas: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>

                  <div className="md:col-span-2 bg-slate-50 border border-dashed border-slate-250 rounded-2xl p-4 flex flex-col items-center justify-center gap-2">
                    <label className="block text-xs font-bold text-slate-700 font-mono mb-1 text-center w-full">Foto Nota / Bukti Transaksi Kas Umum</label>
                    {newTx.fotoBase64 ? (
                      <div className="relative group w-32 h-32 border rounded-xl overflow-hidden shadow-xs bg-white">
                        <img src={newTx.fotoBase64} alt="Preview Bukti" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setNewTx({ ...newTx, fotoBase64: '', fotoNamaFile: '' })}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white cursor-pointer"
                          title="Hapus Foto"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <Camera className="w-8 h-8 mb-1 text-slate-350" />
                        <span className="text-[10px] text-slate-500 font-semibold mb-1">Unggah foto nota, kuitansi, atau bukti bayar (maks. 5MB)</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const compressed = await compressImage(file);
                                setNewTx(prev => ({
                                  ...prev,
                                  fotoBase64: compressed,
                                  fotoNamaFile: file.name
                                }));
                              } catch (err) {
                                console.error(err);
                                alert('Gagal mengompres gambar.');
                              }
                            }
                          }}
                          className="absolute inset-0 opacity-0 cursor-pointer hidden"
                          id="upload-umum-rx"
                        />
                        <label
                          htmlFor="upload-umum-rx"
                          className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 pointer-events-auto border border-slate-205 hover:border-slate-300 rounded-xl text-xs font-bold cursor-pointer inline-flex items-center gap-1 shadow-sm transition"
                        >
                          Pilih Foto
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Common Submit Action Button */}
            <div className="border-t border-slate-100 pt-4 flex justify-end">
              <button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl cursor-pointer transition text-sm flex items-center gap-2 shadow-lg shadow-emerald-605/10 active:scale-98"
                id="btn-save-sub-tx"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                Simpan Transaksi & Rekonsiliasi Kas
              </button>
            </div>

          </form>
        </div>
      )}

      {/* Stats Summary Ring Section */}
      {!isKolektor && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Pemasukan Stats */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold font-mono">Akumulasi Transaksi Masuk</p>
              <p className="text-xl font-extrabold text-emerald-600 mt-1 font-mono">
                + Rp {totalPemasukan.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Rencana Pengeluaran Stats */}
          <div className="p-5 bg-white border border-slate-200 rounded-2xl flex items-center gap-4 shadow-xs">
            <div className="p-3.5 rounded-xl bg-rose-50 text-rose-650 border border-rose-100 font-bold">
              <TrendingDown className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-semibold font-mono">Akumulasi Transaksi Keluar</p>
              <p className="text-xl font-extrabold text-rose-600 mt-1 font-mono">
                - Rp {totalPengeluaran.toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cloud Storage & Document Database Usage Section */}
      {!isKolektor && (wargaList.length > 0 || rombongList.length > 0) && (
        (() => {
          const stats = calculateStorageFootprint(wargaList, rombongList, ledger);
          return (
            <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-sky-50 text-sky-600 rounded-xl border border-sky-100">
                    <Cloud className="w-5 h-5 text-sky-550 shrink-0" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-950 text-xs sm:text-sm uppercase tracking-wider font-mono">Penyimpanan Digital (Cloud RT-08)</h4>
                    <p className="text-[10px] text-slate-500 font-semibold leading-none mt-1">Estimasi Pemakaian Penyimpanan &amp; Data Berkas Terunggah</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 font-mono tracking-wider block">Total Size</span>
                  <strong className="text-sm sm:text-base font-black text-slate-900 font-mono tracking-wide">{formatFileSize(stats.totalBytes)}</strong>
                </div>
              </div>

              {/* Progress bar line */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold font-mono text-slate-500 uppercase tracking-widest">
                  <span>Alokasi Berkas</span>
                  <span>{stats.totalFilesCount} Berkas Tersimpan</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex shadow-inner">
                  {stats.totalBytes > 0 ? (
                    <>
                      {stats.wargaKtpBytes > 0 && (
                        <div 
                          style={{ width: `${(stats.wargaKtpBytes / stats.totalBytes) * 100}%` }} 
                          className="bg-amber-400 hover:brightness-110 transition-all h-full"
                          title={`KTP Warga: ${formatFileSize(stats.wargaKtpBytes)}`}
                        />
                      )}
                      {stats.wargaKkBytes > 0 && (
                        <div 
                          style={{ width: `${(stats.wargaKkBytes / stats.totalBytes) * 100}%` }} 
                          className="bg-indigo-400 hover:brightness-110 transition-all h-full"
                          title={`KK Warga: ${formatFileSize(stats.wargaKkBytes)}`}
                        />
                      )}
                      {(stats.wargaPhotosBytes + stats.rombongPhotosBytes) > 0 && (
                        <div 
                          style={{ width: `${((stats.wargaPhotosBytes + stats.rombongPhotosBytes) / stats.totalBytes) * 100}%` }} 
                          className="bg-sky-400 hover:brightness-110 transition-all h-full"
                          title={`Foto Profil/Lapak: ${formatFileSize(stats.wargaPhotosBytes + stats.rombongPhotosBytes)}`}
                        />
                      )}
                      {(stats.wargaReceiptsBytes + stats.rombongReceiptsBytes + stats.ledgerReceiptsBytes) > 0 && (
                        <div 
                          style={{ width: `${((stats.wargaReceiptsBytes + stats.rombongReceiptsBytes + stats.ledgerReceiptsBytes) / stats.totalBytes) * 100}%` }} 
                          className="bg-emerald-400 hover:brightness-110 transition-all h-full"
                          title={`Bukti Bayar & Transaksi: ${formatFileSize(stats.wargaReceiptsBytes + stats.rombongReceiptsBytes + stats.ledgerReceiptsBytes)}`}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-50 flex items-center justify-center text-[9px] text-slate-400 font-semibold font-mono">Belum ada file digital yang terunggah</div>
                  )}
                </div>

                {/* Legend list */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 text-xs">
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded bg-amber-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <span className="text-slate-500 font-bold block text-[9.5px] uppercase tracking-wider font-mono">Arsip KTP</span>
                      <strong className="font-mono text-slate-850 font-extrabold text-xs">{formatFileSize(stats.wargaKtpBytes)}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded bg-indigo-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <span className="text-slate-500 font-bold block text-[9.5px] uppercase tracking-wider font-mono">Arsip KK</span>
                      <strong className="font-mono text-slate-850 font-extrabold text-xs">{formatFileSize(stats.wargaKkBytes)}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded bg-sky-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <span className="text-slate-500 font-bold block text-[9.5px] uppercase tracking-wider font-mono">Arsip Lapak</span>
                      <strong className="font-mono text-slate-850 font-extrabold text-xs">{formatFileSize(stats.wargaPhotosBytes + stats.rombongPhotosBytes)}</strong>
                    </div>
                  </div>
                  <div className="flex items-start gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded bg-emerald-400 shrink-0 mt-0.5" />
                    <div className="truncate">
                      <span className="text-slate-500 font-bold block text-[9.5px] uppercase tracking-wider font-mono">Bukti Kas</span>
                      <strong className="font-mono text-slate-850 font-extrabold text-xs">{formatFileSize(stats.wargaReceiptsBytes + stats.rombongReceiptsBytes + stats.ledgerReceiptsBytes)}</strong>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()
      )}

    </div>
  );
}
