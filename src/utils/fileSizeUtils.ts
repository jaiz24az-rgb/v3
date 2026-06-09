import { WargaBill, RombongBill, LedgerEntry } from '../types';

/**
 * Calculates the size of a Base64 string in bytes.
 */
export function getBase64SizeInBytes(base64Str: string | undefined): number {
  if (!base64Str) return 0;
  
  // Subtract the data URI prefix if exists (e.g. "data:image/jpeg;base64,")
  const commaIndex = base64Str.indexOf(',');
  const cleanString = commaIndex > -1 ? base64Str.slice(commaIndex + 1) : base64Str;
  
  // Base64 decoding byte calculation with trailing '=' padding subtraction
  const padding = cleanString.endsWith('==') ? 2 : cleanString.endsWith('=') ? 1 : 0;
  return (cleanString.length * 3) / 4 - padding;
}

/**
 * Formats a size in bytes into a human-readable string (B, KB, MB, GB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export interface StorageDetails {
  totalBytes: number;
  wargaPhotosBytes: number;
  wargaKtpBytes: number;
  wargaKkBytes: number;
  wargaReceiptsBytes: number;
  rombongPhotosBytes: number;
  rombongReceiptsBytes: number;
  ledgerReceiptsBytes: number;
  totalFilesCount: number;
}

/**
 * Aggregates all files and images stored in citizens, stalls, and ledger transactions
 * to compute a granular rundown of the cloud database storage size.
 */
export function calculateStorageFootprint(
  wargaList: WargaBill[],
  rombongList: RombongBill[],
  ledgerList: LedgerEntry[]
): StorageDetails {
  let wargaPhotosBytes = 0;
  let wargaKtpBytes = 0;
  let wargaKkBytes = 0;
  let wargaReceiptsBytes = 0;
  let rombongPhotosBytes = 0;
  let rombongReceiptsBytes = 0;
  let ledgerReceiptsBytes = 0;
  let totalFilesCount = 0;

  wargaList.forEach(w => {
    if (w.fotoBase64) {
      wargaPhotosBytes += getBase64SizeInBytes(w.fotoBase64);
      totalFilesCount++;
    }
    if (w.ktpBase64) {
      wargaKtpBytes += getBase64SizeInBytes(w.ktpBase64);
      totalFilesCount++;
    }
    if (w.kkBase64) {
      wargaKkBytes += getBase64SizeInBytes(w.kkBase64);
      totalFilesCount++;
    }
    if (w.iuranRT) {
      w.iuranRT.forEach(b => {
        if (b.fotoBase64) {
          wargaReceiptsBytes += getBase64SizeInBytes(b.fotoBase64);
          totalFilesCount++;
        }
      });
    }
  });

  rombongList.forEach(r => {
    if (r.fotoBase64) {
      rombongPhotosBytes += getBase64SizeInBytes(r.fotoBase64);
      totalFilesCount++;
    }
    if (r.iuranRombong) {
      r.iuranRombong.forEach(b => {
        if (b.fotoBase64) {
          rombongReceiptsBytes += getBase64SizeInBytes(b.fotoBase64);
          totalFilesCount++;
        }
      });
    }
  });

  ledgerList.forEach(e => {
    if (e.fotoBase64) {
      ledgerReceiptsBytes += getBase64SizeInBytes(e.fotoBase64);
      totalFilesCount++;
    }
  });

  const totalBytes = 
    wargaPhotosBytes + 
    wargaKtpBytes + 
    wargaKkBytes + 
    wargaReceiptsBytes + 
    rombongPhotosBytes + 
    rombongReceiptsBytes + 
    ledgerReceiptsBytes;

  return {
    totalBytes,
    wargaPhotosBytes,
    wargaKtpBytes,
    wargaKkBytes,
    wargaReceiptsBytes,
    rombongPhotosBytes,
    rombongReceiptsBytes,
    ledgerReceiptsBytes,
    totalFilesCount
  };
}
