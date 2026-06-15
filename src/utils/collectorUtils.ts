import { LedgerEntry } from '../types';

export function isBillingPayment(entry: LedgerEntry): boolean {
  if (entry.tipe !== 'pemasukan') return false;
  // Exclude unapproved custom rombong payments from being withdrawable or recognized in cash collected totals until approved by Admin
  if (entry.isCustomRombong && !entry.approvedByAdmin) return false;
  // Exclude internal bank transfers, collector withdrawals, and adjustments
  if (
    entry.kategori === 'Penarikan Dana Kolektor' || 
    entry.kategori === 'Pemberdayaan Kas RT' ||
    entry.kategori === 'Transfer Kas' ||
    entry.kategori === 'Penyesuaian Saldo' ||
    entry.deskripsi.includes('Penyesuaian Saldo')
  ) return false;

  const desc = entry.deskripsi.toLowerCase();
  const cat = entry.kategori.toLowerCase();
  return (
    cat.includes('iuran') || 
    cat.includes('pendapatan rombong') ||
    desc.includes('iuran') || 
    desc.includes('tagihan') || 
    desc.includes('lapak')
  );
}

export function isPenarikanKolektor(entry: LedgerEntry): boolean {
  return entry.kategori === 'Penarikan Dana Kolektor';
}

export function cleanName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/^(bapak|bp\.|ibu|mas|mbak|pak|bu)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '') // remove parenthetical like (Kolektor), (Admin)
    .trim();
}

export function isCollectorMatch(entryPetugas: string, colId: string, collectorName: string): boolean {
  if (!entryPetugas || !colId) return false;

  const pClean = cleanName(entryPetugas);
  const cClean = cleanName(collectorName);
  const idClean = cleanName(colId);

  // Precise exact matches
  if (pClean === cClean || pClean === idClean) {
    return true;
  }

  // Simple string equality tests
  const rP = entryPetugas.toLowerCase().trim();
  const rC = collectorName.toLowerCase().trim();
  const rId = colId.toLowerCase().trim();
  if (rP === rC || rP === rId) return true;

  // Substring checks, but strictly disabled if of generic terms like "kolektor", "admin", "bendahara"
  const isGenericWord = (w: string) => ['kolektor', 'admin', 'bendahara', 'petugas', 'rt', ''].includes(w);
  if (isGenericWord(pClean) || isGenericWord(cClean) || isGenericWord(idClean)) {
    return false; 
  }

  // For non-generic custom names, we can check for inclusions (e.g. "Bp. Bowo Santoso" matching "Bowo Santoso")
  if (pClean.includes(cClean) && cClean.length > 3) return true;
  if (cClean.includes(pClean) && pClean.length > 3) return true;
  if (pClean.includes(idClean) && idClean.length > 3) return true;

  return false;
}

export interface CollectorBalanceInfo {
  totalCollected: number;
  totalPenarikan: number;
  remaining: number;
}

export function getCollectorBalancesForPeriod(
  ledger: LedgerEntry[],
  colId: string,
  collectorName: string,
  sector: 'rtTunai' | 'rombongTunai',
  filters: { month?: string; year?: number } = {}
): CollectorBalanceInfo {
  if (!colId) return { totalCollected: 0, totalPenarikan: 0, remaining: 0 };

  const cleanCollectorName = cleanName(collectorName);
  const cleanCollectorId = cleanName(colId);

  // Filter by period if specified
  const filteredLedger = ledger.filter(entry => {
    // entry.tanggal format: "YYYY-MM-DD"
    const entryParts = entry.tanggal.split('-');
    if (entryParts.length !== 3) return true;
    
    if (filters.year && parseInt(entryParts[0], 10) !== filters.year) {
      return false;
    }
    
    if (filters.month && filters.month !== 'semua') {
      const entryMonthNum = parseInt(entryParts[1], 10);
      const filterMonthNum = parseInt(filters.month, 10);
      if (entryMonthNum !== filterMonthNum) return false;
    }
    
    return true;
  });

  // Calculate collections
  const collectorCashPayments = filteredLedger.filter(entry => {
    if (!isBillingPayment(entry) || entry.sumberKas !== sector) return false;
    return isCollectorMatch(entry.petugas, colId, collectorName);
  });
  const totalCollected = collectorCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);

  // Calculate penarikans
  const collectorPenarikans = filteredLedger.filter(entry => {
    if (!isPenarikanKolektor(entry) || entry.sumberKas !== sector) return false;
    const cleanEntryDesc = cleanName(entry.deskripsi);
    return (
      (cleanCollectorName && cleanEntryDesc.includes(cleanCollectorName)) ||
      (cleanCollectorId && cleanEntryDesc.includes(cleanCollectorId))
    );
  });
  const totalPenarikan = collectorPenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);

  return {
    totalCollected,
    totalPenarikan,
    remaining: Math.max(0, totalCollected - totalPenarikan)
  };
}
