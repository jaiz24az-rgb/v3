import { LedgerEntry } from '../types';

export function isBillingPayment(entry: LedgerEntry): boolean {
  if (entry.tipe !== 'pemasukan') return false;
  // Exclude unapproved custom rombong payments from being withdrawable or recognized in cash collected totals until approved by Admin
  if (entry.isCustomRombong && !entry.approvedByAdmin) return false;
  const desc = (entry.deskripsi || '').toLowerCase();
  const cat = (entry.kategori || '').toLowerCase();
  // Exclude internal bank transfers, collector withdrawals, and adjustments
  if (
    entry.kategori === 'Penarikan Dana Kolektor' || 
    entry.kategori === 'Pemberdayaan Kas RT' ||
    entry.kategori === 'Transfer Kas' ||
    entry.kategori === 'Penyesuaian Saldo' ||
    desc.includes('penyesuaian saldo')
  ) return false;

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
  const cleaned = name
    .toLowerCase()
    .replace(/^(bapak|bp\.|ibu|mas|mbak|pak|bu)\s+/i, '')
    .replace(/\s*\(.*?\)\s*/g, '') // remove parenthetical like (Kolektor), (Admin)
    .trim();
  return cleaned || name.toLowerCase().replace(/[()]/g, '').trim();
}

export function resolveCollectorId(nameOrId: string): string | null {
  if (!nameOrId) return null;
  const clean = nameOrId.toLowerCase().replace(/[()]/g, '').trim();
  
  // Sektor Rombong
  if (
    clean === 'kolektor2' ||
    clean.includes('kolektor sewa rombong') ||
    clean.includes('kolektor rombong') ||
    clean.includes('rombong kuliner') ||
    (clean.includes('rombong') && !clean.includes('rt'))
  ) {
    return 'Kolektor2';
  }

  // Sektor RT / Iuran RT
  if (
    clean === 'kolektor' ||
    clean.includes('wirin') ||
    clean.includes('kolektor iuran rt') ||
    clean.includes('kolektor iuran') ||
    clean.includes('bowo santoso') ||
    clean.includes('iuran rt')
  ) {
    return 'kolektor';
  }

  return null;
}

export function isPenarikanForCollector(desc: string, colId: string, collectorName: string): boolean {
  const cleanDesc = desc.toLowerCase();
  const targetColId = resolveCollectorId(colId) || colId.toLowerCase().trim();

  if (targetColId === 'Kolektor2') {
    // Sector Rombong
    return (
      cleanDesc.includes('sewa rombong') ||
      cleanDesc.includes('rombong') ||
      cleanDesc.includes('kolektor2')
    );
  }

  if (targetColId === 'kolektor') {
    // Sector RT
    return (
      cleanDesc.includes('iuran rt') ||
      cleanDesc.includes('rt 08') ||
      cleanDesc.includes('wirin') ||
      cleanDesc.includes('bowo') ||
      cleanDesc.includes('kolektor iuran') ||
      (cleanDesc.includes('kolektor') && !cleanDesc.includes('rombong'))
    );
  }

  // Fallback to substring matching if it is some other custom collector
  const cleanC = cleanName(collectorName);
  const cleanId = cleanName(colId);
  return (
    (cleanC && cleanDesc.includes(cleanC)) ||
    (cleanId && cleanDesc.includes(cleanId))
  );
}

export function isCollectorMatch(entryPetugas: string, colId: string, collectorName: string): boolean {
  if (!entryPetugas || !colId) return false;

  const resolvedEntry = resolveCollectorId(entryPetugas);
  const resolvedTarget = resolveCollectorId(colId);

  if (resolvedEntry && resolvedTarget) {
    return resolvedEntry === resolvedTarget;
  }

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
  sector: 'rtPettyCash' | 'rombongTunai',
  filters: { month?: string; year?: number } = {}
): CollectorBalanceInfo {
  if (!colId) return { totalCollected: 0, totalPenarikan: 0, remaining: 0 };

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
    if (!isBillingPayment(entry)) return false;
    const matchesSector = sector === 'rtPettyCash'
      ? (entry.sumberKas === 'rtPettyCash' || entry.sumberKas === 'rtTunai')
      : (entry.sumberKas === sector);
    if (!matchesSector) return false;
    return isCollectorMatch(entry.petugas, colId, collectorName);
  });
  const totalCollected = collectorCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);

  // Calculate penarikans
  const collectorPenarikans = filteredLedger.filter(entry => {
    if (!isPenarikanKolektor(entry)) return false;
    const matchesSector = sector === 'rtPettyCash'
      ? (entry.sumberKas === 'rtPettyCash' || entry.sumberKas === 'rtTunai')
      : (entry.sumberKas === sector);
    if (!matchesSector) return false;
    return isPenarikanForCollector(entry.deskripsi, colId, collectorName);
  });
  const totalPenarikan = collectorPenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);

  // Cumulative collections (up to the selected month and year)
  const cumulativeCashPayments = ledger.filter(entry => {
    if (!isBillingPayment(entry)) return false;
    const matchesSector = sector === 'rtPettyCash'
      ? (entry.sumberKas === 'rtPettyCash' || entry.sumberKas === 'rtTunai')
      : (entry.sumberKas === sector);
    if (!matchesSector) return false;
    if (!isCollectorMatch(entry.petugas, colId, collectorName)) return false;

    // Filter up to the selected period
    const entryParts = entry.tanggal.split('-');
    if (entryParts.length !== 3) return true;
    const entryYear = parseInt(entryParts[0], 10);
    const entryMonth = parseInt(entryParts[1], 10);

    if (filters.year) {
      if (entryYear > filters.year) return false;
      if (entryYear === filters.year && filters.month && filters.month !== 'semua') {
        const filterMonthNum = parseInt(filters.month, 10);
        if (entryMonth > filterMonthNum) return false;
      }
    }
    return true;
  });
  const cumulativeCollected = cumulativeCashPayments.reduce((acc, entry) => acc + entry.jumlah, 0);

  // Cumulative penarikans (up to the selected month and year)
  const cumulativePenarikans = ledger.filter(entry => {
    if (!isPenarikanKolektor(entry)) return false;
    const matchesSector = sector === 'rtPettyCash'
      ? (entry.sumberKas === 'rtPettyCash' || entry.sumberKas === 'rtTunai')
      : (entry.sumberKas === sector);
    if (!matchesSector) return false;
    if (!isPenarikanForCollector(entry.deskripsi, colId, collectorName)) return false;

    // Filter up to the selected period
    const entryParts = entry.tanggal.split('-');
    if (entryParts.length !== 3) return true;
    const entryYear = parseInt(entryParts[0], 10);
    const entryMonth = parseInt(entryParts[1], 10);

    if (filters.year) {
      if (entryYear > filters.year) return false;
      if (entryYear === filters.year && filters.month && filters.month !== 'semua') {
        const filterMonthNum = parseInt(filters.month, 10);
        if (entryMonth > filterMonthNum) return false;
      }
    }
    return true;
  });
  const cumulativePenarikan = cumulativePenarikans.reduce((acc, entry) => acc + entry.jumlah, 0);

  return {
    totalCollected,
    totalPenarikan,
    remaining: Math.max(0, cumulativeCollected - cumulativePenarikan)
  };
}
