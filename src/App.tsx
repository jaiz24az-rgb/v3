import React, { useState, useEffect, useRef } from 'react';
import { Balance, LedgerEntry, WargaBill, RombongBill, AppUser, OfficialLetter } from './types';
import { INITIAL_BALANCES, INITIAL_LEDGER, INITIAL_WARGA, INITIAL_ROMBONG, INITIAL_USERS } from './data';
import { 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, OperationType, handleFirestoreError, sanitizeData, isFirebaseConfigured } from './firebase';
import { 
  isSupabaseConfigured,
  supabase,
  getGeneralSettings,
  upsertGeneralSettings,
  getAppUsers,
  saveAppUser,
  deleteAppUser,
  getLedgerEntries,
  saveLedgerEntry,
  deleteLedgerEntry,
  getWargaBills,
  saveWargaBill,
  deleteWargaBill,
  getRombongBills,
  saveRombongBill,
  deleteRombongBill,
  getOfficialLetters,
  saveOfficialLetter,
  deleteOfficialLetter
} from './supabase';
import Dashboard from './components/Dashboard';
import TagihanWarga, { getDefaultRombongRate } from './components/TagihanWarga';
import Ledger from './components/Ledger';
import BukuKolektor from './components/BukuKolektor';
import UserGuide from './components/UserGuide';
import LoginModal from './components/LoginModal';
import UserManagementModal from './components/UserManagementModal';
import LandingPage from './components/LandingPage';
import Undangan from './components/Undangan';
import { 
  Coins, 
  LayoutDashboard, 
  Receipt, 
  BookOpen, 
  PlusSquare, 
  LogOut, 
  LogIn, 
  RotateCcw,
  RefreshCw,
  Sparkles,
  Calendar,
  ShieldAlert,
  User,
  Menu,
  CheckCircle2,
  Users,
  ClipboardCheck,
  HelpCircle,
  Lock,
  Unlock,
  Mail,
  X,
  Wifi
} from 'lucide-react';

const ensurePaidFor2024toMei2026_Warga = (wList: WargaBill[]): WargaBill[] => {
  const fullMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const monthsOrder = fullMonths.map(m => m.toLowerCase());
  
  return wList.map(w => {
    const newIuran = w.iuranRT.map(b => ({ ...b }));
    
    const startMonthIndex = w.mulaiBulan ? monthsOrder.indexOf(w.mulaiBulan.toLowerCase()) : -1;
    const startYear = w.mulaiTahun || 2026;

    const isBeforePlacement = (yr: number, mName: string) => {
      if (!w.isWargaBaru) return false;
      if (yr < startYear) return true;
      if (yr > startYear) return false;
      const mIdx = monthsOrder.indexOf(mName.toLowerCase());
      return mIdx < startMonthIndex;
    };

    // 1. Process 2024 and 2025 iuran
    [2024, 2025].forEach((yr) => {
      fullMonths.forEach((m) => {
        const shortM = m.slice(0, 3);
        const idx = newIuran.findIndex(b => 
          (b.tahun === yr) && 
          (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
        );
        const beforePlacement = isBeforePlacement(yr, m);
        
        if (idx === -1) {
          newIuran.push({
            bulan: m,
            lunas: true,
            nominal: beforePlacement ? 0 : 35000,
            tahun: yr,
            catatan: beforePlacement ? 'Bebas (Warga Baru)' : 'Lunas Otomatis (2024-2026)',
            tanggalBayar: beforePlacement ? 'Sistem' : `${yr}-12-31`,
            jamBayar: beforePlacement ? undefined : '23:59'
          });
        } else {
          const slot = newIuran[idx];
          if (slot.manualKoreksi !== true) {
            if (beforePlacement) {
              slot.lunas = true;
              slot.nominal = 0;
              slot.catatan = 'Bebas (Warga Baru)';
              slot.tanggalBayar = 'Sistem';
              slot.jamBayar = undefined;
            } else {
              if (!w.isWargaBaru) {
                slot.lunas = true;
                slot.nominal = slot.nominal === 0 ? 35000 : slot.nominal; // Restore if it was zero
                slot.catatan = slot.catatan || 'Lunas Otomatis (2024-2026)';
                slot.tanggalBayar = slot.tanggalBayar || `${yr}-12-31`;
                slot.jamBayar = slot.jamBayar || '23:59';
              } else {
                if (slot.catatan === 'Lunas Otomatis (2024-2026)') {
                  slot.lunas = false;
                  slot.catatan = undefined;
                  slot.tanggalBayar = undefined;
                  slot.jamBayar = undefined;
                }
              }
            }
          }
        }
      });
    });

    // 2. Process Jan-Mei 2026 iuran
    fullMonths.slice(0, 5).forEach((m) => {
      const shortM = m.slice(0, 3);
      const idx = newIuran.findIndex(b => 
        (b.tahun === 2026 || !b.tahun) && 
        (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
      );
      const beforePlacement = isBeforePlacement(2026, m);
      
      if (idx === -1) {
        if (!w.isWargaBaru || beforePlacement) {
          newIuran.push({
            bulan: m,
            lunas: true,
            nominal: beforePlacement ? 0 : 35000,
            tahun: 2026,
            catatan: beforePlacement ? 'Bebas (Warga Baru)' : 'Lunas Otomatis (2024-2026)',
            tanggalBayar: beforePlacement ? 'Sistem' : '2026-05-01',
            jamBayar: beforePlacement ? undefined : '12:00'
          });
        } else {
          newIuran.push({
            bulan: m,
            lunas: false,
            nominal: 35000,
            tahun: 2026,
            catatan: undefined,
            tanggalBayar: undefined,
            jamBayar: undefined
          });
        }
      } else {
        const slot = newIuran[idx];
        if (slot.manualKoreksi !== true) {
          if (beforePlacement) {
            slot.lunas = true;
            slot.nominal = 0;
            slot.catatan = 'Bebas (Warga Baru)';
            slot.tanggalBayar = 'Sistem';
            slot.jamBayar = undefined;
            if (!slot.tahun) {
              slot.tahun = 2026;
            }
          } else {
            if (!w.isWargaBaru) {
              slot.lunas = true;
              slot.nominal = slot.nominal === 0 ? 35000 : slot.nominal;
              slot.catatan = slot.catatan || 'Lunas Otomatis (2024-2026)';
              slot.tanggalBayar = slot.tanggalBayar || '2026-05-01';
              slot.jamBayar = slot.jamBayar || '12:00';
              if (!slot.tahun) {
                slot.tahun = 2026;
              }
            } else {
              if (slot.catatan === 'Lunas Otomatis (2024-2026)') {
                slot.lunas = false;
                slot.catatan = undefined;
                slot.tanggalBayar = undefined;
                slot.jamBayar = undefined;
              }
              if (!slot.tahun) {
                slot.tahun = 2026;
              }
            }
          }
        }
      }
    });

    // 3. Process all remaining months in other years
    const allYears = Array.from(new Set([2024, 2025, 2026, 2027, ...(w.iuranRT.map(b => b.tahun).filter(Boolean) as number[])]));
    allYears.forEach(yr => {
      fullMonths.forEach(m => {
        const isJanMei2026 = yr === 2026 && monthsOrder.indexOf(m.toLowerCase()) < 5;
        if (yr === 2024 || yr === 2025 || isJanMei2026) return;

        const shortM = m.slice(0, 3);
        const idx = newIuran.findIndex(b =>
          (b.tahun === yr) &&
          (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
        );

        const beforePlacement = isBeforePlacement(yr, m);
        if (beforePlacement) {
          if (idx === -1) {
            newIuran.push({
              bulan: m,
              lunas: true,
              nominal: 0,
              tahun: yr,
              catatan: 'Bebas (Warga Baru)',
              tanggalBayar: 'Sistem',
              jamBayar: undefined
            });
          } else {
            const slot = newIuran[idx];
            if (slot.manualKoreksi !== true) {
              slot.lunas = true;
              slot.nominal = 0;
              slot.catatan = 'Bebas (Warga Baru)';
              slot.tanggalBayar = 'Sistem';
              slot.jamBayar = undefined;
            }
          }
        }
      });
    });

    return {
      ...w,
      iuranRT: newIuran
    };
  });
};

const ensurePaidFor2024toMei2026_Rombong = (rList: RombongBill[]): RombongBill[] => {
  const fullMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  return rList.map(r => {
    const newIuran = r.iuranRombong.map(b => ({ ...b }));
    [2024, 2025].forEach((yr) => {
      fullMonths.forEach((m) => {
        const shortM = m.slice(0, 3);
        const idx = newIuran.findIndex(b => 
          (b.tahun === yr) && 
          (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
        );
        if (idx === -1) {
          newIuran.push({
            bulan: m,
            lunas: true,
            nominal: 50000,
            tahun: yr,
            catatan: 'Lunas Otomatis (2024-2026)',
            tanggalBayar: `${yr}-12-31`,
            jamBayar: '23:59'
          });
        } else {
          const slot = newIuran[idx];
          if (slot.manualKoreksi !== true) {
            slot.lunas = true;
            slot.catatan = slot.catatan || 'Lunas Otomatis (2024-2026)';
            slot.tanggalBayar = slot.tanggalBayar || `${yr}-12-31`;
            slot.jamBayar = slot.jamBayar || '23:59';
          }
        }
      });
    });

    fullMonths.slice(0, 5).forEach((m) => {
      const shortM = m.slice(0, 3);
      const idx = newIuran.findIndex(b => 
        (b.tahun === 2026 || !b.tahun) && 
        (b.bulan.toLowerCase() === m.toLowerCase() || b.bulan.toLowerCase() === shortM.toLowerCase())
      );
      if (idx === -1) {
        newIuran.push({
          bulan: m,
          lunas: true,
          nominal: 50000,
          tahun: 2026,
          catatan: 'Lunas Otomatis (2024-2026)',
          tanggalBayar: '2026-05-01',
          jamBayar: '12:00'
        });
      } else {
        const slot = newIuran[idx];
        if (slot.manualKoreksi !== true) {
          slot.lunas = true;
          slot.catatan = slot.catatan || 'Lunas Otomatis (2024-2026)';
          slot.tanggalBayar = slot.tanggalBayar || '2026-05-01';
          slot.jamBayar = slot.jamBayar || '12:00';
          if (!slot.tahun) {
            slot.tahun = 2026;
          }
        }
      }
    });

    return {
      ...r,
      iuranRombong: newIuran
    };
  });
};

// Help helper functions to safely transmit data to the local server, stripping large photos if payload sizes are exceeded.
const stripPayloadImages = (p: any): any => {
  return {
    ...p,
    wargaList: p.wargaList?.map((w: any) => {
      // Create a shallow copy without large profile photos
      const newW = { ...w };
      if (newW.fotoBase64) delete newW.fotoBase64;
      if (newW.iuranWarga) {
        newW.iuranWarga = newW.iuranWarga.map((i: any) => {
          if (i.fotoBase64) {
            const newI = { ...i };
            delete newI.fotoBase64;
            return newI;
          }
          return i;
        });
      }
      return newW;
    }),
    rombongList: p.rombongList?.map((r: any) => {
      // Create a shallow copy without large lapak photos
      const newR = { ...r };
      if (newR.fotoBase64) delete newR.fotoBase64;
      if (newR.iuranRombong) {
        newR.iuranRombong = newR.iuranRombong.map((i: any) => {
          if (i.fotoBase64) {
            const newI = { ...i };
            delete newI.fotoBase64;
            return newI;
          }
          return i;
        });
      }
      return newR;
    }),
    ledger: p.ledger?.map((l: any) => {
      if (l.fotoBase64) {
        const newL = { ...l };
        delete newL.fotoBase64;
        return newL;
      }
      return l;
    })
  };
};

const safeFetchSaveLocalSync = async (baseUrl: string, payload: any): Promise<any> => {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/local-sync/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  } catch (netErr) {
    throw new Error(`Koneksi terputus atau server tidak dapat dijangkau: ${netErr instanceof Error ? netErr.message : String(netErr)}`);
  }

  if (!response.ok) {
    if (response.status === 413) {
      throw new Error('413: Ukuran data terlalu besar untuk dikirim melalui jaringan ini');
    }
    throw new Error(`HTTP Error ${response.status}: Silakan hubungi admin`);
  }

  const contentType = response.headers.get('content-type');
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('Server mengembalikan respon non-JSON (Kemungkinan limit transmisi nirkabel/proxy terlampaui)');
  }

  try {
    const data = await response.json();
    return data;
  } catch (jsonErr) {
    throw new Error('Gagal mengurai respon JSON dari server');
  }
};

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'tagihan' | 'buku_kas' | 'buku_kolektor' | 'undangan' | 'panduan'>('dashboard');
  const [usersList, setUsersList] = useState<AppUser[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [currentUser, setCurrentUser] = useState<AppUser | null>(() => {
    const saved = localStorage.getItem('perumtas_rt08_current_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [blocksList, setBlocksList] = useState<string[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_blocks');
    return saved ? JSON.parse(saved) : ['A4', 'A3', 'C5', 'C3'];
  });
  const [yearsList, setYearsList] = useState<number[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_years');
    return saved ? JSON.parse(saved) : [2024, 2025, 2026, 2027, 2028];
  });
  const [rateRT, setRateRT] = useState<number>(() => {
    const saved = localStorage.getItem('perumtas_rt08_rate_rt');
    return saved ? parseInt(saved, 10) : 110000;
  });
  const [rateRombong, setRateRombong] = useState<number>(() => {
    const saved = localStorage.getItem('perumtas_rt08_rate_rombong');
    return saved ? parseInt(saved, 10) : 130000;
  });
  const [rtTitle, setRtTitle] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_title');
    return saved || 'PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04';
  });
  const [rtAddress, setRtAddress] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_address');
    return saved || 'PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.';
  });
  const [rtEmail, setRtEmail] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_email');
    return saved && saved !== 'tas3.rt.08@gmail.com' ? saved : '';
  });
  const [appName, setAppName] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_app_name');
    return saved || 'Kas Perumtas 3 RT 08';
  });
  const [appLogo, setAppLogo] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_app_logo');
    return saved || '';
  });
  const [labelWargaSingular, setLabelWargaSingular] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_label_warga_singular');
    return saved || 'Warga';
  });
  const [labelWargaPlural, setLabelWargaPlural] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_label_warga_plural');
    return saved || 'Warga';
  });
  const [labelRombongSingular, setLabelRombongSingular] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_label_rombong_singular');
    return saved || 'Rombong';
  });
  const [labelRombongPlural, setLabelRombongPlural] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_label_rombong_plural');
    return saved || 'Lapak Rombong';
  });

  const [bankNama, setBankNama] = useState<string>(() => localStorage.getItem('perumtas_rt08_bank_nama') || 'Bank Mandiri');
  const [bankNoRek, setBankNoRek] = useState<string>(() => localStorage.getItem('perumtas_rt08_bank_norek') || '');
  const [bankPenerima, setBankPenerima] = useState<string>(() => localStorage.getItem('perumtas_rt08_bank_penerima') || '');
  const [bankCatatanVendor, setBankCatatanVendor] = useState<string>(() => localStorage.getItem('perumtas_rt08_bank_catatan_vendor') || '');
  const [meetingNotulen, setMeetingNotulen] = useState<string>(() => localStorage.getItem('perumtas_rt08_meeting_notulen') || '');

  const updateBankNama = (val: string) => {
    setBankNama(val);
    localStorage.setItem('perumtas_rt08_bank_nama', val);
    upsertGeneralSettings({ bankNama: val });
  };
  const updateBankNoRek = (val: string) => {
    setBankNoRek(val);
    localStorage.setItem('perumtas_rt08_bank_norek', val);
    upsertGeneralSettings({ bankNoRek: val });
  };
  const updateBankPenerima = (val: string) => {
    setBankPenerima(val);
    localStorage.setItem('perumtas_rt08_bank_penerima', val);
    upsertGeneralSettings({ bankPenerima: val });
  };
  const updateBankCatatanVendor = (val: string) => {
    setBankCatatanVendor(val);
    localStorage.setItem('perumtas_rt08_bank_catatan_vendor', val);
    upsertGeneralSettings({ bankCatatanVendor: val });
  };
  const updateMeetingNotulen = (val: string) => {
    setMeetingNotulen(val);
    localStorage.setItem('perumtas_rt08_meeting_notulen', val);
    upsertGeneralSettings({ meetingNotulen: val });
  };

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_app_name', appName);
  }, [appName]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_app_logo', appLogo);
  }, [appLogo]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_label_warga_singular', labelWargaSingular);
  }, [labelWargaSingular]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_label_warga_plural', labelWargaPlural);
  }, [labelWargaPlural]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_label_rombong_singular', labelRombongSingular);
  }, [labelRombongSingular]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_label_rombong_plural', labelRombongPlural);
  }, [labelRombongPlural]);
  const [showUserManagement, setShowUserManagement] = useState<boolean>(false);
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [isInputFocused, setIsInputFocused] = useState<boolean>(false);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [resetConfirmInput, setResetConfirmInput] = useState<string>('');
  const [resetDataMode, setResetDataMode] = useState<'transaksi' | 'warga' | 'semua'>('transaksi');
  const [cloudStatus, setCloudStatus] = useState<'connected' | 'offline' | 'error'>('connected');
  const [cloudErrorMsg, setCloudErrorMsg] = useState<string>('');

  // Real-time dynamic calendar date formatting (id-ID)
  const [currentDateString, setCurrentDateString] = useState<string>(() => {
    try {
      return new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(new Date());
    } catch {
      return 'Selasa, 26 Mei 2026';
    }
  });

  useEffect(() => {
    const timer = setInterval(() => {
      try {
        const formatted = new Intl.DateTimeFormat('id-ID', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }).format(new Date());
        setCurrentDateString(formatted);
      } catch (err) {
        console.error(err);
      }
    }, 1000); // Check and update every second so it reacts instantly
    return () => clearInterval(timer);
  }, []);

  // Track browser connection status
  useEffect(() => {
    const handleOnline = () => setCloudStatus(prev => prev === 'offline' ? 'connected' : prev);
    const handleOffline = () => setCloudStatus('offline');

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (!navigator.onLine) {
      setCloudStatus('offline');
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Track initial Firestore synchronization checks (avoids resurrecting deleted items)
  const wargaInitCheckDone = useRef(false);
  const rombongInitCheckDone = useRef(false);
  const ledgerInitCheckDone = useRef(false);
  const usersInitCheckDone = useRef(false);
  const lettersInitCheckDone = useRef(false);
  const hasAutoBackedUpRef = useRef(false);

  useEffect(() => {
    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (
        target && 
        (target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.tagName === 'SELECT' || 
         target.isContentEditable)
      ) {
        setIsInputFocused(true);
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        const activeEl = document.activeElement as HTMLElement | null;
        if (
          !activeEl || 
          (activeEl.tagName !== 'INPUT' && 
           activeEl.tagName !== 'TEXTAREA' && 
           activeEl.tagName !== 'SELECT' && 
           !activeEl.isContentEditable)
        ) {
          setIsInputFocused(false);
        }
      }, 60);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  const isLoggedIn = !!currentUser;

  // Sync currentUser with usersList updates automatically
  useEffect(() => {
    if (currentUser) {
      const updatedMe = usersList.find(u => u.id === currentUser.id);
      if (updatedMe && (
        updatedMe.nama !== currentUser.nama || 
        updatedMe.username !== currentUser.username || 
        updatedMe.role !== currentUser.role || 
        updatedMe.pin !== currentUser.pin
      )) {
        setCurrentUser(updatedMe);
      }
    }
  }, [usersList, currentUser]);

  // Core financial states persisted to Local Storage
  const [kas, setKas] = useState<Balance>(() => {
    const saved = localStorage.getItem('perumtas_rt08_kas');
    return saved ? JSON.parse(saved) : INITIAL_BALANCES;
  });

  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_ledger');
    return saved ? JSON.parse(saved) : INITIAL_LEDGER;
  });

  const [wargaList, setWargaList] = useState<WargaBill[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_warga');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && ('iuranKebersihan' in parsed[0])) {
          localStorage.removeItem('perumtas_rt08_warga');
          return ensurePaidFor2024toMei2026_Warga(INITIAL_WARGA);
        }
        return ensurePaidFor2024toMei2026_Warga(parsed);
      } catch (e) {
        return ensurePaidFor2024toMei2026_Warga(INITIAL_WARGA);
      }
    }
    return ensurePaidFor2024toMei2026_Warga(INITIAL_WARGA);
  });

  const [rombongList, setRombongList] = useState<RombongBill[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_rombong');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.length > 0 && ('iuranSewa' in parsed[0])) {
          localStorage.removeItem('perumtas_rt08_rombong');
          return ensurePaidFor2024toMei2026_Rombong(INITIAL_ROMBONG);
        }
        return ensurePaidFor2024toMei2026_Rombong(parsed);
      } catch (e) {
        return ensurePaidFor2024toMei2026_Rombong(INITIAL_ROMBONG);
      }
    }
    return ensurePaidFor2024toMei2026_Rombong(INITIAL_ROMBONG);
  });

  const [lettersList, setLettersList] = useState<OfficialLetter[]>(() => {
    const saved = localStorage.getItem('perumtas_rt08_letters');
    return saved ? JSON.parse(saved) : [];
  });

  // --- STATE-STATE UNTUK SINKRONISASI SERVER LOKAL WI-FI ---
  const [localSyncEnabled, setLocalSyncEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('perumtas_rt08_local_sync_enabled');
    return saved ? saved === 'true' : true;
  });

  const [localServerIp, setLocalServerIp] = useState<string>(() => {
    const saved = localStorage.getItem('perumtas_rt08_local_server_ip');
    return saved || window.location.origin;
  });

  const [localServerStatus, setLocalServerStatus] = useState<'connected' | 'scanning' | 'error' | 'offline'>('offline');
  const [serverDiscoveredIps, setServerDiscoveredIps] = useState<string[]>([]);
  const [localSyncMessage, setLocalSyncMessage] = useState<string>('');

  // Simpan setelan ke localStorage saat berubah
  useEffect(() => {
    localStorage.setItem('perumtas_rt08_local_sync_enabled', localSyncEnabled.toString());
  }, [localSyncEnabled]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_local_server_ip', localServerIp);
  }, [localServerIp]);

  // Fungsi pengecekan dan pengunduhan data awal dari server lokal
  const checkAndSyncLocalServer = async () => {
    if (!localSyncEnabled) {
      setLocalServerStatus('offline');
      return;
    }
    
    setLocalServerStatus('scanning');
    setLocalSyncMessage('Menghubungi server penyimpanan bersama...');
    
    try {
      let baseUrl = localServerIp.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
      }
      
      // Standarisasi URL
      if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        if (!baseUrl.includes(':')) {
          baseUrl = `http://${baseUrl}:3000`;
        } else {
          baseUrl = `http://${baseUrl}`;
        }
      }
      
      const statusRes = await fetch(`${baseUrl}/api/local-sync/status`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      
      if (!statusRes.ok) {
        throw new Error(`HTTP Error status ${statusRes.status}`);
      }
      
      const statusObj = await statusRes.json();
      if (statusObj && statusObj.status === 'online') {
        setLocalServerStatus('connected');
        setServerDiscoveredIps(statusObj.localIps || []);
        setLocalSyncMessage('Terhubung dengan penyimpanan bersama lokal.');
        
        // Unduh data dari database bersama
        const dataRes = await fetch(`${baseUrl}/api/local-sync/data`);
        const dataObj = await dataRes.json();
        
        if (dataObj.success && dataObj.data && Object.keys(dataObj.data).length > 0) {
          const d = dataObj.data;
          if (d.kas) setKas(d.kas);
          if (d.ledger) setLedger(d.ledger);
          if (d.wargaList) setWargaList(ensurePaidFor2024toMei2026_Warga(d.wargaList));
          if (d.rombongList) setRombongList(ensurePaidFor2024toMei2026_Rombong(d.rombongList));
          if (d.usersList) setUsersList(d.usersList);
          if (d.blocksList) setBlocksList(d.blocksList);
          if (d.yearsList) setYearsList(d.yearsList);
          if (d.rateRT !== undefined) setRateRT(d.rateRT);
          if (d.rateRombong !== undefined) setRateRombong(d.rateRombong);
          if (d.rtTitle !== undefined) setRtTitle(d.rtTitle);
          if (d.rtAddress !== undefined) setRtAddress(d.rtAddress);
          if (d.rtEmail !== undefined) setRtEmail(d.rtEmail);
          if (d.lettersList) setLettersList(d.lettersList);
          if (d.appName !== undefined) setAppName(d.appName);
          if (d.appLogo !== undefined) setAppLogo(d.appLogo);
          if (d.labelWargaSingular !== undefined) setLabelWargaSingular(d.labelWargaSingular);
          if (d.labelWargaPlural !== undefined) setLabelWargaPlural(d.labelWargaPlural);
          if (d.labelRombongSingular !== undefined) setLabelRombongSingular(d.labelRombongSingular);
          if (d.labelRombongPlural !== undefined) setLabelRombongPlural(d.labelRombongPlural);
          if (d.bankNama !== undefined) setBankNama(d.bankNama);
          if (d.bankNoRek !== undefined) setBankNoRek(d.bankNoRek);
          if (d.bankPenerima !== undefined) setBankPenerima(d.bankPenerima);
          if (d.bankCatatanVendor !== undefined) setBankCatatanVendor(d.bankCatatanVendor);
          if (d.meetingNotulen !== undefined) setMeetingNotulen(d.meetingNotulen);
          
          console.log('✓ Sinkronisasi data sukses dari server lokal.');
        } else {
          // Database kosong, unggah state lokal kita sebagai indukan pertama (seeding)
          console.info('Database server kosong. Mengunggah data lokal sebagai data awal...');
          const payload = {
            kas,
            ledger,
            wargaList,
            rombongList,
            usersList,
            blocksList,
            yearsList,
            rateRT,
            rateRombong,
            rtTitle,
            rtAddress,
            rtEmail,
            lettersList,
            appName,
            appLogo,
            labelWargaSingular,
            labelWargaPlural,
            labelRombongSingular,
            labelRombongPlural,
            bankNama,
            bankNoRek,
            bankPenerima,
            bankCatatanVendor,
            meetingNotulen
          };
          
          try {
            await safeFetchSaveLocalSync(baseUrl, payload);
            console.log('✓ Berhasil melakukan seeding awal ke server lokal.');
          } catch (seedErr) {
            console.warn('Seeding awal penuh gagal karena limit ukuran/jaringan. Mencoba seeding data inti tanpa foto...', seedErr);
            const strippedPayload = stripPayloadImages(payload);
            await safeFetchSaveLocalSync(baseUrl, strippedPayload);
            console.log('✓ Berhasil melakukan seeding awal (tanpa foto) ke server lokal.');
          }
        }
      } else {
        throw new Error('Respon server tidak valid.');
      }
    } catch (err) {
      console.warn('Gagal terhubung dengan server sinkronisasi lokal:', err);
      setLocalServerStatus('error');
      setLocalSyncMessage(err instanceof Error ? err.message : String(err));
    }
  };

  // Pengecekan awal saat startup
  useEffect(() => {
    checkAndSyncLocalServer();
  }, [localSyncEnabled, localServerIp]);

  // Efek debounced untuk mengirim pembaruan data secara otomatis ke server lokal saat ada perubahan state
  useEffect(() => {
    if (!localSyncEnabled || localServerStatus !== 'connected') return;

    const delayDebounceFn = setTimeout(async () => {
      let baseUrl = localServerIp.trim();
      if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.substring(0, baseUrl.length - 1);
      }
      if (baseUrl && !baseUrl.startsWith('http://') && !baseUrl.startsWith('https://')) {
        if (!baseUrl.includes(':')) {
          baseUrl = `http://${baseUrl}:3000`;
        } else {
          baseUrl = `http://${baseUrl}`;
        }
      }

      const payload = {
        kas,
        ledger,
        wargaList,
        rombongList,
        usersList,
        blocksList,
        yearsList,
        rateRT,
        rateRombong,
        rtTitle,
        rtAddress,
        rtEmail,
        lettersList,
        appName,
        appLogo,
        labelWargaSingular,
        labelWargaPlural,
        labelRombongSingular,
        labelRombongPlural,
        bankNama,
        bankNoRek,
        bankPenerima,
        bankCatatanVendor,
        meetingNotulen
      };

      try {
        const data = await safeFetchSaveLocalSync(baseUrl, payload);
        if (data && data.success) {
          console.log('✓ Pembaruan data lengkap terunggah otomatis ke penyimpanan bersama lokal.');
        }
      } catch (err) {
        console.warn('Pembaruan data lengkap gagal, mencoba mengirim data inti tanpa foto...', err);
        try {
          const strippedPayload = stripPayloadImages(payload);
          const data = await safeFetchSaveLocalSync(baseUrl, strippedPayload);
          if (data && data.success) {
            console.log('✓ Pembaruan data inti (tanpa foto) terunggah otomatis ke penyimpanan bersama lokal.');
          }
        } catch (strippedErr) {
          console.error('Gagal mengirim pembaruan otomatis ke server lokal:', strippedErr);
        }
      }
    }, 1200);

    return () => clearTimeout(delayDebounceFn);
  }, [
    lettersList, kas, ledger, wargaList, rombongList, usersList, 
    blocksList, yearsList, rateRT, rateRombong, rtTitle, rtAddress, rtEmail,
    appName, appLogo, labelWargaSingular, labelWargaPlural, labelRombongSingular, labelRombongPlural,
    bankNama, bankNoRek, bankPenerima, bankCatatanVendor, meetingNotulen,
    localSyncEnabled, localServerStatus, localServerIp
  ]);

  // Sync to localStorage on state changes
  useEffect(() => {
    localStorage.setItem('perumtas_rt08_letters', JSON.stringify(lettersList));
  }, [lettersList]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_kas', JSON.stringify(kas));
  }, [kas]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_ledger', JSON.stringify(ledger));
  }, [ledger]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_warga', JSON.stringify(wargaList));
  }, [wargaList]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_rombong', JSON.stringify(rombongList));
  }, [rombongList]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_users', JSON.stringify(usersList));
  }, [usersList]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_blocks', JSON.stringify(blocksList));
  }, [blocksList]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_years', JSON.stringify(yearsList));
  }, [yearsList]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_rate_rt', rateRT.toString());
  }, [rateRT]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_rate_rombong', rateRombong.toString());
  }, [rateRombong]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_title', rtTitle);
  }, [rtTitle]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_address', rtAddress);
  }, [rtAddress]);

  useEffect(() => {
    localStorage.setItem('perumtas_rt08_email', rtEmail);
  }, [rtEmail]);

  // Migration for old cached double-zero RT titles/addresses to sync perfectly with new official letterhead
  useEffect(() => {
    if (rtTitle === 'PENGURUS RUKUN TETANGGA 008 RUKUN WARGA 004') {
      setRtTitle('PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04');
    }
    if (
      rtAddress === 'PERUMTAS 3 RT.008 RW.004 DESA POPOH KEC WONOAYU KABUPATEN SIDOARJO 61261' ||
      rtAddress === 'PERUMTAS 3 BLOK A4-C5, RT.08 RW.04, DESA POPOH, KEC. WONOAYU, SIDOARJO 61261'
    ) {
      setRtAddress('PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.');
    }
  }, [rtTitle, rtAddress]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('perumtas_rt08_current_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('perumtas_rt08_current_user');
    }
  }, [currentUser]);

  // Force warga or rombong roles immediately to their respective billing page and block other views
  useEffect(() => {
    if (currentUser && (currentUser.role === 'warga' || currentUser.role === 'rombong')) {
      if (activeTab !== 'tagihan') {
        setActiveTab('tagihan');
      }
    }
  }, [currentUser, activeTab]);

  // Real-time synchronization with Supabase
  useEffect(() => {
    if (!isSupabaseConfigured) return;

    let isMounted = true;
    setCloudStatus('connected');

    const loadAllSupabaseData = async () => {
      try {
        // 1. Load Settings
        const settings = await getGeneralSettings();
        if (isMounted) {
          if (settings) {
            if (settings.kas) setKas(settings.kas);
            if (settings.blocksList) setBlocksList(settings.blocksList);
            if (settings.yearsList) setYearsList(settings.yearsList);
            if (settings.rateRT !== undefined) setRateRT(settings.rateRT);
            if (settings.rateRombong !== undefined) setRateRombong(settings.rateRombong);
            if (settings.rtTitle !== undefined) setRtTitle(settings.rtTitle);
            if (settings.rtAddress !== undefined) setRtAddress(settings.rtAddress);
            if (settings.rtEmail !== undefined) setRtEmail(settings.rtEmail);
            if (settings.appName !== undefined) setAppName(settings.appName);
            if (settings.appLogo !== undefined) setAppLogo(settings.appLogo);
            if (settings.labelWargaSingular !== undefined) setLabelWargaSingular(settings.labelWargaSingular);
            if (settings.labelWargaPlural !== undefined) setLabelWargaPlural(settings.labelWargaPlural);
            if (settings.labelRombongSingular !== undefined) setLabelRombongSingular(settings.labelRombongSingular);
            if (settings.labelRombongPlural !== undefined) setLabelRombongPlural(settings.labelRombongPlural);
            if (settings.bankNama !== undefined) setBankNama(settings.bankNama);
            if (settings.bankNoRek !== undefined) setBankNoRek(settings.bankNoRek);
            if (settings.bankPenerima !== undefined) setBankPenerima(settings.bankPenerima);
            if (settings.bankCatatanVendor !== undefined) setBankCatatanVendor(settings.bankCatatanVendor);
            if (settings.meetingNotulen !== undefined) setMeetingNotulen(settings.meetingNotulen);
          } else {
            // Seed settings
            await upsertGeneralSettings({
              kas,
              blocksList,
              yearsList,
              rateRT,
              rateRombong,
              rtTitle,
              rtAddress,
              rtEmail,
              appName,
              appLogo,
              labelWargaSingular,
              labelWargaPlural,
              labelRombongSingular,
              labelRombongPlural,
              bankNama,
              bankNoRek,
              bankPenerima,
              bankCatatanVendor,
              meetingNotulen
            });
          }
        }

        // 2. Load Users
        const users = await getAppUsers();
        if (isMounted) {
          if (users.length > 0) {
            setUsersList(users);
          } else {
            // Seed initial users
            for (const u of usersList) {
              await saveAppUser(u);
            }
          }
        }

        // 3. Load Ledger
        const ledgers = await getLedgerEntries();
        if (isMounted) {
          if (ledgers.length > 0) {
            setLedger(ledgers);
          } else if (ledger.length > 0) {
            for (const e of ledger) {
              await saveLedgerEntry(e);
            }
          }
        }

        // 4. Load Warga
        const wargasList = await getWargaBills();
        if (isMounted) {
          if (wargasList.length > 0) {
            setWargaList(ensurePaidFor2024toMei2026_Warga(wargasList));
          } else if (wargaList.length > 0) {
            for (const w of wargaList) {
              await saveWargaBill(w);
            }
          }
        }

        // 5. Load Rombong
        const rombongsList = await getRombongBills();
        if (isMounted) {
          if (rombongsList.length > 0) {
            setRombongList(ensurePaidFor2024toMei2026_Rombong(rombongsList));
          } else if (rombongList.length > 0) {
            for (const r of rombongList) {
              await saveRombongBill(r);
            }
          }
        }

        // 6. Load Letters
        const letters = await getOfficialLetters();
        if (isMounted) {
          if (letters.length > 0) {
            setLettersList(letters);
          } else if (lettersList.length > 0) {
            for (const letItem of lettersList) {
              await saveOfficialLetter(letItem);
            }
          }
        }

        setCloudStatus('connected');
      } catch (err) {
        console.error('Error during Supabase initial loading:', err);
        if (isMounted) {
          setCloudStatus('error');
          setCloudErrorMsg(err instanceof Error ? err.message : String(err));
        }
      }
    };

    loadAllSupabaseData();

    // Subscribe to any changes for automatic real-time sync with Supabase Realtime!
    if (!supabase) return;
    const realTimeSubscription = supabase
      .channel('schema-changes-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
        },
        async (payload) => {
          console.info('🔔 Real-time change detected in Supabase:', payload);
          // Gently reload data on background changes
          await loadAllSupabaseData();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      if (realTimeSubscription) {
        supabase.removeChannel(realTimeSubscription);
      }
    };
  }, []);

  // Real-time synchronization with Firestore (HP & Laptop Sync)
  useEffect(() => {
    if (isSupabaseConfigured) {
      // Bypassed: Supabase is configured and takes highest priority
      return;
    }
    if (!isFirebaseConfigured) {
      console.log('Firebase not configured. Operating in complete secure offline Local Storage mode.');
      return;
    }
    // 1. settings/general
    const settingsRef = doc(db, 'settings', 'general');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      setCloudStatus('connected');
      if (snapshot.exists()) {
        const data = snapshot.data();
        if (data.kas) setKas(data.kas);
        if (data.blocksList) setBlocksList(data.blocksList);
        if (data.yearsList) setYearsList(data.yearsList);
        if (data.rateRT !== undefined) setRateRT(data.rateRT);
        if (data.rateRombong !== undefined) setRateRombong(data.rateRombong);
        if (data.rtTitle !== undefined) setRtTitle(data.rtTitle);
        if (data.rtAddress !== undefined) setRtAddress(data.rtAddress);
        if (data.rtEmail !== undefined) setRtEmail(data.rtEmail);
        if (data.appName !== undefined) setAppName(data.appName);
        if (data.appLogo !== undefined) setAppLogo(data.appLogo);
        if (data.labelWargaSingular !== undefined) setLabelWargaSingular(data.labelWargaSingular);
        if (data.labelWargaPlural !== undefined) setLabelWargaPlural(data.labelWargaPlural);
        if (data.labelRombongSingular !== undefined) setLabelRombongSingular(data.labelRombongSingular);
        if (data.labelRombongPlural !== undefined) setLabelRombongPlural(data.labelRombongPlural);
      } else {
        // Initial seed of Settings to Firestore
        setDoc(settingsRef, {
          kas,
          blocksList,
          yearsList,
          rateRT,
          rateRombong,
          rtTitle,
          rtAddress,
          rtEmail,
          appName,
          appLogo,
          labelWargaSingular,
          labelWargaPlural,
          labelRombongSingular,
          labelRombongPlural
        }).catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'settings/general');
      setCloudStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : String(err));
    });

    // 2. app_users
    const unsubscribeUsers = onSnapshot(collection(db, 'app_users'), (snapshot) => {
      setCloudStatus('connected');
      if (snapshot.empty) {
        if (!usersInitCheckDone.current) {
          usersInitCheckDone.current = true;
          usersList.forEach((u) => {
            setDoc(doc(db, 'app_users', u.id), u)
              .catch((err) => handleFirestoreError(err, OperationType.WRITE, `app_users/${u.id}`));
          });
        } else {
          setUsersList([]);
        }
      } else {
        usersInitCheckDone.current = true;
        const list: AppUser[] = [];
        snapshot.forEach((docSnap) => {
          const u = docSnap.data() as AppUser;
          if (u) {
            if (!u.id) u.id = docSnap.id;
            list.push(u);
          }
        });

        // Simply update local list state from fetched content in DB
        setUsersList(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'app_users');
      setCloudStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : String(err));
    });

    // 3. ledger_entries
    const ledgerQuery = query(collection(db, 'ledger_entries'), orderBy('tanggal', 'desc'));
    const unsubscribeLedger = onSnapshot(ledgerQuery, (snapshot) => {
      setCloudStatus('connected');
      if (snapshot.empty) {
        if (!ledgerInitCheckDone.current) {
          ledgerInitCheckDone.current = true;
          if (ledger.length > 0) {
            ledger.forEach((e) => {
              setDoc(doc(db, 'ledger_entries', e.id), e)
                .catch((err) => handleFirestoreError(err, OperationType.WRITE, `ledger_entries/${e.id}`));
            });
          }
        } else {
          setLedger([]);
        }
      } else {
        ledgerInitCheckDone.current = true;
        const list: LedgerEntry[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as LedgerEntry));
        setLedger(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'ledger_entries');
      setCloudStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : String(err));
    });

    // 4. warga_bills
    const unsubscribeWarga = onSnapshot(collection(db, 'warga_bills'), (snapshot) => {
      setCloudStatus('connected');
      if (snapshot.empty) {
        if (!wargaInitCheckDone.current) {
          wargaInitCheckDone.current = true;
          if (wargaList.length > 0) {
            wargaList.forEach((w) => {
              setDoc(doc(db, 'warga_bills', w.id), w)
                .catch((err) => handleFirestoreError(err, OperationType.WRITE, `warga_bills/${w.id}`));
            });
          }
        } else {
          setWargaList(ensurePaidFor2024toMei2026_Warga([]));
        }
      } else {
        wargaInitCheckDone.current = true;
        const list: WargaBill[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as WargaBill));
        setWargaList(ensurePaidFor2024toMei2026_Warga(list));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'warga_bills');
      setCloudStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : String(err));
    });

    // 5. rombong_bills
    const unsubscribeRombong = onSnapshot(collection(db, 'rombong_bills'), (snapshot) => {
      setCloudStatus('connected');
      if (snapshot.empty) {
        if (!rombongInitCheckDone.current) {
          rombongInitCheckDone.current = true;
          if (rombongList.length > 0) {
            rombongList.forEach((r) => {
              setDoc(doc(db, 'rombong_bills', r.id), r)
                .catch((err) => handleFirestoreError(err, OperationType.WRITE, `rombong_bills/${r.id}`));
            });
          }
        } else {
          setRombongList(ensurePaidFor2024toMei2026_Rombong([]));
        }
      } else {
        rombongInitCheckDone.current = true;
        const list: RombongBill[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as RombongBill));
        setRombongList(ensurePaidFor2024toMei2026_Rombong(list));
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'rombong_bills');
      setCloudStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : String(err));
    });

    // 6. official_letters
    const unsubscribeLetters = onSnapshot(collection(db, 'official_letters'), (snapshot) => {
      setCloudStatus('connected');
      if (snapshot.empty) {
        if (!lettersInitCheckDone.current) {
          lettersInitCheckDone.current = true;
          if (lettersList.length > 0) {
            lettersList.forEach((letter) => {
              setDoc(doc(db, 'official_letters', letter.id), letter)
                .catch((err) => handleFirestoreError(err, OperationType.WRITE, `official_letters/${letter.id}`));
            });
          }
        } else {
          setLettersList([]);
        }
      } else {
        lettersInitCheckDone.current = true;
        const list: OfficialLetter[] = [];
        snapshot.forEach((docSnap) => list.push(docSnap.data() as OfficialLetter));
        setLettersList(list);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'official_letters');
      setCloudStatus('error');
      setCloudErrorMsg(err instanceof Error ? err.message : String(err));
    });

    return () => {
      unsubscribeSettings();
      unsubscribeUsers();
      unsubscribeLedger();
      unsubscribeWarga();
      unsubscribeRombong();
      unsubscribeLetters();
    };
  }, []);

  // Intercepting and proxying mutators directly to Firestore / Supabase + Local State
  const handleUpdateLettersList = async (newLetters: OfficialLetter[] | ((prev: OfficialLetter[]) => OfficialLetter[])) => {
    const nextLetters = typeof newLetters === 'function' ? newLetters(lettersList) : newLetters;
    setLettersList(nextLetters);
    if (isSupabaseConfigured) {
      const deleted = lettersList.filter(l => !nextLetters.some(nextL => nextL.id === l.id));
      for (const delL of deleted) {
        deleteOfficialLetter(delL.id);
      }
      const addedOrUpdated = nextLetters.filter(nextL => {
        const orig = lettersList.find(l => l.id === nextL.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextL);
      });
      for (const upL of addedOrUpdated) {
        saveOfficialLetter(upL);
      }
    } else if (isFirebaseConfigured) {
      const deleted = lettersList.filter(l => !nextLetters.some(nextL => nextL.id === l.id));
      for (const delL of deleted) {
        deleteDoc(doc(db, 'official_letters', delL.id))
          .catch((err) => handleFirestoreError(err, OperationType.DELETE, `official_letters/${delL.id}`));
      }
      const addedOrUpdated = nextLetters.filter(nextL => {
        const orig = lettersList.find(l => l.id === nextL.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextL);
      });
      for (const upL of addedOrUpdated) {
        setDoc(doc(db, 'official_letters', upL.id), sanitizeData(upL))
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `official_letters/${upL.id}`));
      }
    }
  };

  const updateKas = (newKas: Balance) => {
    setKas(newKas);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ kas: newKas });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), sanitizeData({ kas: newKas }), { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const addLedgerEntry = (entry: Omit<LedgerEntry, 'id'>) => {
    const newId = `tx-${Date.now()}`;
    const newEntry: LedgerEntry = {
      ...entry,
      id: newId
    };
    setLedger((prev) => [newEntry, ...prev]);
    if (isSupabaseConfigured) {
      saveLedgerEntry(newEntry);
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'ledger_entries', newId), sanitizeData(newEntry))
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, `ledger_entries/${newId}`));
    }
  };

  const handleApproveRombongCustomPayment = async (ledgerId: string) => {
    // 1. Find the ledger entry
    const entry = ledger.find(e => e.id === ledgerId);
    if (!entry) return;

    // 2. Mark the ledger entry as approved
    const updatedEntry: LedgerEntry = {
      ...entry,
      approvedByAdmin: true,
      needApproval: false
    };

    // Save updated ledger entry
    setLedger((prev) => prev.map(e => e.id === ledgerId ? updatedEntry : e));

    if (isSupabaseConfigured) {
      await saveLedgerEntry(updatedEntry);
    } else if (isFirebaseConfigured) {
      await setDoc(doc(db, 'ledger_entries', ledgerId), sanitizeData(updatedEntry))
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, `ledger_entries/${ledgerId}`));
    }

    // 3. Mark the corresponding slot inside `rombongList` as approved!
    if (entry.rombongId && entry.bulan && entry.tahun) {
      const targetRombongId = entry.rombongId;
      const targetBulan = entry.bulan;
      const targetTahun = entry.tahun;

      const updatedRombongList = rombongList.map(r => {
        if (r.id === targetRombongId) {
          const updatedIuran = r.iuranRombong.map(b => {
            if (b.bulan.toLowerCase() === targetBulan.toLowerCase() && (b.tahun === targetTahun || (!b.tahun && targetTahun === 2026))) {
              return {
                ...b,
                approved: true
              };
            }
            return b;
          });
          return {
            ...r,
            iuranRombong: updatedIuran
          };
        }
        return r;
      });

      await handleUpdateRombongList(updatedRombongList);
    }

    // 4. Increase the global `kas` for the approved nominal since we deferred adding it when paying!
    const targetKas = entry.sumberKas || 'rombongTunai';
    const amountToIncrease = entry.jumlah;

    const nextKas = { ...kas };
    nextKas[targetKas] += amountToIncrease;
    updateKas(nextKas);
  };

  const handleRejectRombongCustomPayment = async (ledgerId: string) => {
    const entry = ledger.find(e => e.id === ledgerId);
    if (!entry) return;

    // Delete the ledger entry
    setLedger((prev) => prev.filter(e => e.id !== ledgerId));

    if (isSupabaseConfigured) {
      await deleteLedgerEntry(ledgerId);
    } else if (isFirebaseConfigured) {
      await deleteDoc(doc(db, 'ledger_entries', ledgerId))
        .catch((err) => handleFirestoreError(err, OperationType.DELETE, `ledger_entries/${ledgerId}`));
    }

    // Mark the slot as unpaid/not lunas
    if (entry.rombongId && entry.bulan && entry.tahun) {
      const targetRombongId = entry.rombongId;
      const targetBulan = entry.bulan;
      const targetTahun = entry.tahun;

      const updatedRombongList = rombongList.map(r => {
        if (r.id === targetRombongId) {
          const updatedIuran = r.iuranRombong.map(b => {
             if (b.bulan.toLowerCase() === targetBulan.toLowerCase() && (b.tahun === targetTahun || (!b.tahun && targetTahun === 2026))) {
               return {
                 ...b,
                 lunas: false,
                 nominal: getDefaultRombongRate(targetTahun, targetBulan, rateRombong),
                 tanggalBayar: undefined,
                 jamBayar: undefined,
                 fotoBase64: undefined,
                 fotoNamaFile: undefined,
                 isCustom: false,
                 approved: false
               };
             }
             return b;
          });
          return {
            ...r,
            iuranRombong: updatedIuran
          };
        }
        return r;
      });

      await handleUpdateRombongList(updatedRombongList);
    }
  };

  const handleSetLedger = async (newLedger: LedgerEntry[] | ((prev: LedgerEntry[]) => LedgerEntry[])) => {
    const nextLedger = typeof newLedger === 'function' ? newLedger(ledger) : newLedger;
    setLedger(nextLedger);
    if (isSupabaseConfigured) {
      const deleted = ledger.filter(e => !nextLedger.some(nextE => nextE.id === e.id));
      for (const delEntry of deleted) {
        deleteLedgerEntry(delEntry.id);
      }
      const addedOrUpdated = nextLedger.filter(nextE => {
        const orig = ledger.find(e => e.id === nextE.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextE);
      });
      for (const upEntry of addedOrUpdated) {
        saveLedgerEntry(upEntry);
      }
    } else if (isFirebaseConfigured) {
      const deleted = ledger.filter(e => !nextLedger.some(nextE => nextE.id === e.id));
      for (const delEntry of deleted) {
        deleteDoc(doc(db, 'ledger_entries', delEntry.id))
          .catch((err) => handleFirestoreError(err, OperationType.DELETE, `ledger_entries/${delEntry.id}`));
      }
      const addedOrUpdated = nextLedger.filter(nextE => {
        const orig = ledger.find(e => e.id === nextE.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextE);
      });
      for (const upEntry of addedOrUpdated) {
        setDoc(doc(db, 'ledger_entries', upEntry.id), sanitizeData(upEntry))
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `ledger_entries/${upEntry.id}`));
      }
    }
  };

  const handleUpdateWargaList = async (newWarga: WargaBill[] | ((prev: WargaBill[]) => WargaBill[])) => {
    const nextWarga = typeof newWarga === 'function' ? newWarga(wargaList) : newWarga;
    const processedWarga = ensurePaidFor2024toMei2026_Warga(nextWarga);
    setWargaList(processedWarga);
    if (isSupabaseConfigured) {
      const deleted = wargaList.filter(w => !processedWarga.some(nextW => nextW.id === w.id));
      for (const delW of deleted) {
        deleteWargaBill(delW.id);
      }
      const addedOrUpdated = processedWarga.filter(nextW => {
        const orig = wargaList.find(w => w.id === nextW.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextW);
      });
      for (const upW of addedOrUpdated) {
        saveWargaBill(upW);
      }
    } else if (isFirebaseConfigured) {
      const deleted = wargaList.filter(w => !processedWarga.some(nextW => nextW.id === w.id));
      
      for (const delW of deleted) {
        deleteDoc(doc(db, 'warga_bills', delW.id))
          .catch((err) => handleFirestoreError(err, OperationType.DELETE, `warga_bills/${delW.id}`));
      }

      const addedOrUpdated = processedWarga.filter(nextW => {
        const orig = wargaList.find(w => w.id === nextW.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextW);
      });
      for (const upW of addedOrUpdated) {
        setDoc(doc(db, 'warga_bills', upW.id), sanitizeData(upW))
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `warga_bills/${upW.id}`));
      }
    }
  };

  const handleUpdateRombongList = async (newRombong: RombongBill[] | ((prev: RombongBill[]) => RombongBill[])) => {
    const nextRombong = typeof newRombong === 'function' ? newRombong(rombongList) : newRombong;
    const processedRombong = ensurePaidFor2024toMei2026_Rombong(nextRombong);
    setRombongList(processedRombong);
    if (isSupabaseConfigured) {
      const deleted = rombongList.filter(r => !processedRombong.some(nextR => nextR.id === r.id));
      for (const delR of deleted) {
        deleteRombongBill(delR.id);
      }
      const addedOrUpdated = processedRombong.filter(nextR => {
        const orig = rombongList.find(r => r.id === nextR.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextR);
      });
      for (const upR of addedOrUpdated) {
        saveRombongBill(upR);
      }
    } else if (isFirebaseConfigured) {
      const deleted = rombongList.filter(r => !processedRombong.some(nextR => nextR.id === r.id));
      
      for (const delR of deleted) {
        deleteDoc(doc(db, 'rombong_bills', delR.id))
          .catch((err) => handleFirestoreError(err, OperationType.DELETE, `rombong_bills/${delR.id}`));
      }

      const addedOrUpdated = processedRombong.filter(nextR => {
        const orig = rombongList.find(r => r.id === nextR.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextR);
      });
      for (const upR of addedOrUpdated) {
        setDoc(doc(db, 'rombong_bills', upR.id), sanitizeData(upR))
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `rombong_bills/${upR.id}`));
      }
    }
  };

  const handleUpdateUsersList = async (newUsers: AppUser[] | ((prev: AppUser[]) => AppUser[])) => {
    const nextUsers = typeof newUsers === 'function' ? newUsers(usersList) : newUsers;
    setUsersList(nextUsers);
    if (isSupabaseConfigured) {
      const deleted = usersList.filter(u => !nextUsers.some(nextU => nextU.id === u.id));
      for (const delU of deleted) {
        deleteAppUser(delU.id);
      }
      const addedOrUpdated = nextUsers.filter(nextU => {
        const orig = usersList.find(u => u.id === nextU.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextU);
      });
      for (const upU of addedOrUpdated) {
        saveAppUser(upU);
      }
    } else if (isFirebaseConfigured) {
      const deleted = usersList.filter(u => !nextUsers.some(nextU => nextU.id === u.id));
      for (const delU of deleted) {
        deleteDoc(doc(db, 'app_users', delU.id))
          .catch((err) => handleFirestoreError(err, OperationType.DELETE, `app_users/${delU.id}`));
      }
      const addedOrUpdated = nextUsers.filter(nextU => {
        const orig = usersList.find(u => u.id === nextU.id);
        return !orig || JSON.stringify(orig) !== JSON.stringify(nextU);
      });
      for (const upU of addedOrUpdated) {
        setDoc(doc(db, 'app_users', upU.id), sanitizeData(upU))
          .catch((err) => handleFirestoreError(err, OperationType.WRITE, `app_users/${upU.id}`));
      }
    }
  };

  const updateBlocksList = (newBlocks: string[] | ((prev: string[]) => string[])) => {
    const nextVal = typeof newBlocks === 'function' ? newBlocks(blocksList) : newBlocks;
    setBlocksList(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ blocksList: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { blocksList: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateYearsList = (newYears: number[] | ((prev: number[]) => number[])) => {
    const nextVal = typeof newYears === 'function' ? newYears(yearsList) : newYears;
    setYearsList(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ yearsList: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { yearsList: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateRateRT = (newRate: number | ((prev: number) => number)) => {
    const nextVal = typeof newRate === 'function' ? newRate(rateRT) : newRate;
    setRateRT(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ rateRT: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { rateRT: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateRateRombong = (newRate: number | ((prev: number) => number)) => {
    const nextVal = typeof newRate === 'function' ? newRate(rateRombong) : newRate;
    setRateRombong(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ rateRombong: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { rateRombong: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateRtTitle = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(rtTitle) : newVal;
    setRtTitle(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ rtTitle: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { rtTitle: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateRtAddress = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(rtAddress) : newVal;
    setRtAddress(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ rtAddress: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { rtAddress: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateRtEmail = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(rtEmail) : newVal;
    setRtEmail(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ rtEmail: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { rtEmail: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateAppName = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(appName) : newVal;
    setAppName(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ appName: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { appName: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateAppLogo = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(appLogo) : newVal;
    setAppLogo(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ appLogo: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { appLogo: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateLabelWargaSingular = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(labelWargaSingular) : newVal;
    setLabelWargaSingular(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ labelWargaSingular: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { labelWargaSingular: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateLabelWargaPlural = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(labelWargaPlural) : newVal;
    setLabelWargaPlural(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ labelWargaPlural: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { labelWargaPlural: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateLabelRombongSingular = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(labelRombongSingular) : newVal;
    setLabelRombongSingular(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ labelRombongSingular: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { labelRombongSingular: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  const updateLabelRombongPlural = (newVal: string | ((prev: string) => string)) => {
    const nextVal = typeof newVal === 'function' ? newVal(labelRombongPlural) : newVal;
    setLabelRombongPlural(nextVal);
    if (isSupabaseConfigured) {
      upsertGeneralSettings({ labelRombongPlural: nextVal });
    } else if (isFirebaseConfigured) {
      setDoc(doc(db, 'settings', 'general'), { labelRombongPlural: nextVal }, { merge: true })
        .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/general'));
    }
  };

  // Reset Application Data Helper (Admin ONLY)
  const handleResetData = () => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Akses Ditolak: Hanya pengguna dengan peran Admin (Ketua RT) yang diberikan hak akses untuk mengosongkan pembukuan & data.');
      return;
    }
    setShowResetConfirmModal(true);
  };

  // Bersihkan cache aplikasi di browser saja tanpa menghapus basis iuran utama
  const handleRefreshCacheOnly = () => {
    const isConfirmed = window.confirm(
      "Apakah Anda ingin menyegarkan cache aplikasi di gawai ini?\n\nSegarkan Cache akan memuat ulang (reload) halaman secara penuh untuk memperbarui sisa memori sela serta memastikan skrip berjalan pada versi paling baru tanpa menghapus data iuran lokal gawai Anda."
    );
    if (!isConfirmed) return;
    window.location.reload();
  };

  // Restore snapshot data (Admin ONLY)
  const handleRestoreSnapshot = async (snapData: {
    kas: Balance;
    ledger: LedgerEntry[];
    wargaList: WargaBill[];
    rombongList: RombongBill[];
  }) => {
    if (!currentUser || currentUser.role !== 'admin') {
      alert('Akses Ditolak: Hanya Admin yang dapat memulihkan snapshot data.');
      return;
    }
    // Update state variables (which internally triggers Supabase/Firestore real-time sync automatically!)
    updateKas(snapData.kas);
    await handleSetLedger(snapData.ledger);
    await handleUpdateWargaList(snapData.wargaList);
    await handleUpdateRombongList(snapData.rombongList);
  };

  // Run once when admin logged-in / loaded to capture daily auto snapshot backup in localStorage
  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin' || hasAutoBackedUpRef.current) return;
    if (wargaList.length === 0 && ledger.length === 0) return; // avoid backup of empty states before fully loaded

    hasAutoBackedUpRef.current = true;
    try {
      const savedSnaps = localStorage.getItem('perumtas_rt08_snapshots');
      let snapshots: any[] = savedSnaps ? JSON.parse(savedSnaps) : [];

      const now = Date.now();
      const SIXTEEN_HOURS = 16 * 60 * 60 * 1000;
      const latestAuto = snapshots.find(s => s.type === 'auto');

      if (!latestAuto || (now - Number(latestAuto.id.split('-')[1])) > SIXTEEN_HOURS) {
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
          label: 'Backup Harian Otomatis',
          type: 'auto',
          kas,
          ledger,
          wargaList,
          rombongList
        };

        const updated = [newSnap, ...snapshots].slice(0, 20); // Keep last 20 elements
        localStorage.setItem('perumtas_rt08_snapshots', JSON.stringify(updated));
        console.info('✓ Captured daily auto snapshot backup in localStorage.');
      }
    } catch (e) {
      console.warn('Error during auto snapshot:', e);
    }
  }, [currentUser, wargaList.length, ledger.length]);

  if (!isLoggedIn) {
    return (
      <LandingPage 
        users={usersList}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          if (user.role === 'warga' || user.role === 'rombong') {
            setActiveTab('tagihan');
          } else {
            setActiveTab('dashboard');
          }
        }}
        rtTitle={rtTitle}
        rtAddress={rtAddress}
        isFirebaseConfigured={isFirebaseConfigured}
        isSupabaseConfigured={isSupabaseConfigured}
        onUpdateUsersList={handleUpdateUsersList}
        appName={appName}
        appLogo={appLogo}
        labelWargaSingular={labelWargaSingular}
        labelWargaPlural={labelWargaPlural}
        labelRombongSingular={labelRombongSingular}
        labelRombongPlural={labelRombongPlural}
      />
    );
  }

  return (
    <div className={`min-h-screen flex flex-col transition-all duration-300 ${
      isInputFocused ? 'pb-8' : 'pb-32'
    }`}>
      
      {/* Top Header Banner */}
      <header className={`sticky top-0 bg-white border-b border-slate-200/85 shadow-xs z-40 transition-all duration-300 ${
        isInputFocused ? 'max-md:-translate-y-full max-md:absolute max-md:opacity-0' : 'translate-y-0'
      }`}>
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-950 p-0.5 border border-sky-400/30 shadow-md shadow-sky-500/10">
              <img src={appLogo || "/favicon.png"} alt="App Logo" className="w-full h-full object-cover rounded-[10px]" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-lg md:text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5 leading-none">
                {appName}
              </h1>
              <span className="text-[10px] md:text-xs font-semibold text-sky-600 font-mono tracking-wide uppercase mt-1 block">
                {rtTitle || 'Sistem Pengelolaan Keuangan & Tagihan'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Connection/Data sync state indicator based on cloud or local availability */}
            {(isFirebaseConfigured || isSupabaseConfigured) ? (
              cloudStatus === 'connected' ? (
                <div 
                  className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-700 font-sans shadow-xs" 
                  title="Koneksi cloud berjalan lancar."
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="hidden sm:inline">Cloud: {isSupabaseConfigured ? 'Supabase' : 'Firebase'} (Stabil)</span>
                  <span className="sm:hidden">{isSupabaseConfigured ? 'Supabase' : 'Firebase'}</span>
                </div>
              ) : cloudStatus === 'offline' ? (
                <div 
                  className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-700 font-sans shadow-xs" 
                  title="Perangkat Anda offline."
                >
                  <span className="w-2 h-2 bg-amber-500 rounded-full shrink-0 animate-pulse"></span>
                  <span className="hidden sm:inline">Offline ({isSupabaseConfigured ? 'Supabase' : 'Firebase'})</span>
                  <span className="sm:hidden">Offline</span>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-rose-700 font-sans shadow-xs" 
                  title={`Gagal sync cloud: ${cloudErrorMsg}.`}
                >
                  <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse"></span>
                  <span className="hidden sm:inline">Kendala {isSupabaseConfigured ? 'Supabase' : 'Firebase'}</span>
                  <span className="sm:hidden">Error Cloud</span>
                </div>
              )
            ) : localSyncEnabled ? (
              localServerStatus === 'connected' ? (
                <div 
                  className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-emerald-700 font-sans shadow-xs" 
                  title={`Terhubung ke ${localServerIp}.`}
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
                  <span className="hidden sm:inline">Wi-Fi lokal: Terhubung</span>
                  <span className="sm:hidden">Wi-Fi Aktif</span>
                </div>
              ) : localServerStatus === 'scanning' ? (
                <div 
                  className="flex items-center gap-1.5 bg-sky-50 border border-sky-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-sky-700 font-sans shadow-xs animate-pulse" 
                  title={`Sedang menghubungkan ke server ${localServerIp}...`}
                >
                  <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                  <span className="hidden sm:inline">Cari Server Wi-Fi...</span>
                  <span className="sm:hidden">Mencari...</span>
                </div>
              ) : (
                <div 
                  className="flex items-center gap-1.5 bg-rose-50 border border-rose-200 px-3 py-1.5 rounded-xl text-[11px] font-extrabold text-rose-700 shadow-md animate-bounce" 
                  title={`Gagal terhubung dengan laptop server di ${localServerIp}.`}
                >
                  <span className="w-2 h-2 bg-rose-500 rounded-full shrink-0 animate-pulse"></span>
                  <span className="hidden sm:inline">Gagal Koneksi Wi-Fi</span>
                  <span className="sm:hidden">Gagal IP</span>
                </div>
              )
            ) : (
              <div 
                className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-[11px] font-bold text-amber-700 font-sans shadow-xs" 
                title="Menggunakan database offline HP ini saja."
              >
                <span className="w-2 h-2 bg-amber-400 rounded-full shrink-0 animate-pulse"></span>
                <span>Offline Lokal HP</span>
              </div>
            )}

            {/* Real-time formatted date */}
            <div className="hidden md:flex items-center gap-1.5 bg-slate-50 border border-slate-200/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-600 font-mono">
              <Calendar className="w-3.5 h-3.5 text-sky-600" />
              <span>{currentDateString}</span>
            </div>



            {/* Admin Login Indicator Button */}
            {isLoggedIn ? (
              <button
                onClick={() => setCurrentUser(null)}
                className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100/50 text-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Keluar ({currentUser?.nama.split(' ')[0]})</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white px-4 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer shadow-md shadow-sky-600/10"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Pengurus</span>
              </button>
            )}
          </div>
        </div>
      </header>
 
      {/* Main Container Workspace */}
      <main className="max-w-6xl mx-auto px-4 py-6 w-full flex-1">
        
        {/* Admin Operational Alert Panel */}
        {isLoggedIn && activeTab === 'dashboard' && (
          <div className="mb-6 bg-gradient-to-r from-sky-50 to-indigo-50 border border-sky-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-sky-100 text-sky-700 rounded-xl">
                <CheckCircle2 className="w-5 h-5 pointer-events-none text-sky-600" />
              </div>
              <div>
                <div className="text-slate-800 font-extrabold text-sm flex flex-wrap items-center gap-1.5">
                  <span>Sesi Aktif:</span>
                  <span className="text-sky-700 font-black">{currentUser?.nama}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-wider font-mono font-black ${
                    currentUser?.role === 'admin' 
                      ? 'bg-indigo-100 border border-indigo-200 text-indigo-800' 
                      : currentUser?.role === 'bendahara'
                      ? 'bg-emerald-100 border border-emerald-250 text-emerald-800'
                      : currentUser?.role === 'sekretaris'
                      ? 'bg-teal-100 border border-teal-200 text-teal-850'
                      : currentUser?.role === 'audit'
                      ? 'bg-rose-100 border border-rose-200 text-rose-800'
                      : 'bg-purple-100 border border-purple-200 text-purple-800'
                  }`}>
                    {currentUser?.role === 'admin' ? 'Administrator' : currentUser?.role === 'bendahara' ? 'Bendahara' : currentUser?.role === 'sekretaris' ? 'Sekretaris' : currentUser?.role === 'audit' ? 'Audit' : 'Kolektor'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                  {currentUser?.role === 'admin' 
                    ? 'Akses Penuh: Anda diizinkan untuk menambah/mengedit akun pengurus RT, menyunting mutasi, register warga, dan mengurus pencatatan kas.' 
                    : currentUser?.role === 'bendahara'
                    ? 'Akses Pencatat (Bendahara): Anda diizinkan melakukan pencatatan buku kas masuk/keluar serta memperbarui status iuran warga.'
                    : currentUser?.role === 'sekretaris'
                    ? 'Akses Sekretariat (Batas Keuangan): Anda berwenang meregistrasi warga, mencetak rekap, mengelola & mengunggah berkas KTP/KK secara penuh.'
                    : currentUser?.role === 'audit'
                    ? 'Akses Pengawas (Audit): Anda diizinkan memantau seluruh kas, laporan keuangan, ledger, dan iuran warga secara menyeluruh (Baca-Saja).'
                    : 'Akses Penagihan (Kolektor Iuran): Anda diizinkan melihat saldo tunai hasil kolektif iuran warga/rombong, serta mencatat pelunasan iuran bulanan.'}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 self-end sm:self-center">
              {isLoggedIn && currentUser?.role === 'admin' && (
                <button
                  onClick={() => setShowUserManagement(true)}
                  className="flex items-center gap-1.5 bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3.5 py-1.5 rounded-xl text-xs transition cursor-pointer shadow-sm active:scale-95"
                  title="Kelola akun & nama pengurus RT"
                >
                  <Users className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
                  <span>Kelola Pengurus RT</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab content switches */}
        <div className="focus-tab-view animate-in fade-in duration-300">
          {activeTab === 'dashboard' && (
            <Dashboard 
              kas={kas} 
              updateKas={updateKas} 
              ledger={ledger} 
              addLedgerEntry={addLedgerEntry} 
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              onNavigateToTab={setActiveTab}
              onTriggerLogin={() => setShowLoginModal(true)}
              wargaList={wargaList}
              rombongList={rombongList}
            />
          )}

          {activeTab === 'tagihan' && (
            <TagihanWarga 
              wargaList={wargaList} 
              updateWargaList={handleUpdateWargaList}
              rombongList={rombongList}
              updateRombongList={handleUpdateRombongList}
              kas={kas}
              updateKas={updateKas}
              addLedgerEntry={addLedgerEntry}
              isLoggedIn={isLoggedIn}
              ledger={ledger}
              currentUser={currentUser}
              usersList={usersList}
              blocksList={blocksList}
              updateBlocksList={updateBlocksList}
              yearsList={yearsList}
              updateYearsList={updateYearsList}
              rateRT={rateRT}
              updateRateRT={updateRateRT}
              rateRombong={rateRombong}
              updateRateRombong={updateRateRombong}
              onTriggerReset={handleResetData}
              rtTitle={rtTitle}
              updateRtTitle={updateRtTitle}
              rtAddress={rtAddress}
              updateRtAddress={updateRtAddress}
              rtEmail={rtEmail}
              updateRtEmail={updateRtEmail}
              appName={appName}
              appLogo={appLogo}
              labelWargaSingular={labelWargaSingular}
              labelWargaPlural={labelWargaPlural}
              labelRombongSingular={labelRombongSingular}
              labelRombongPlural={labelRombongPlural}
              bankNama={bankNama}
              updateBankNama={updateBankNama}
              bankNoRek={bankNoRek}
              updateBankNoRek={updateBankNoRek}
              bankPenerima={bankPenerima}
              updateBankPenerima={updateBankPenerima}
              bankCatatanVendor={bankCatatanVendor}
              updateBankCatatanVendor={updateBankCatatanVendor}
              meetingNotulen={meetingNotulen}
              updateMeetingNotulen={updateMeetingNotulen}
            />
          )}

          {activeTab === 'buku_kas' && (
            <Ledger 
              ledger={ledger}
              setLedger={handleSetLedger}
              kas={kas}
              updateKas={updateKas}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              usersList={usersList}
              yearsList={yearsList}
              rtTitle={rtTitle}
              rtAddress={rtAddress}
              rtEmail={rtEmail}
              onTriggerLogin={() => setShowLoginModal(true)}
            />
          )}

          {activeTab === 'buku_kolektor' && (
            <BukuKolektor 
              ledger={ledger}
              kas={kas}
              isLoggedIn={isLoggedIn}
              currentUser={currentUser}
              yearsList={yearsList}
              addLedgerEntry={addLedgerEntry}
              users={usersList}
              onApproveRombongPayment={handleApproveRombongCustomPayment}
              onRejectRombongPayment={handleRejectRombongCustomPayment}
            />
          )}

          {activeTab === 'undangan' && (
            <Undangan 
              kas={kas}
              rtTitle={rtTitle}
              rtAddress={rtAddress}
              rtEmail={rtEmail}
              usersList={usersList}
              currentUser={currentUser}
              lettersList={lettersList}
              onUpdateLettersList={handleUpdateLettersList}
              wargaList={wargaList}
              updateWargaList={handleUpdateWargaList}
              blocksList={blocksList}
              updateBlocksList={updateBlocksList}
              yearsList={yearsList}
              updateYearsList={updateYearsList}
              rateRT={rateRT}
              updateRateRT={updateRateRT}
              rateRombong={rateRombong}
              updateRateRombong={updateRateRombong}
              onTriggerReset={handleResetData}
              onRestoreSnapshot={handleRestoreSnapshot}
              updateLedger={handleSetLedger}
              updateRtTitle={updateRtTitle}
              updateRtAddress={updateRtAddress}
              updateRtEmail={updateRtEmail}
              rombongList={rombongList}
              updateRombongList={handleUpdateRombongList}
              ledger={ledger}
              addLedgerEntry={addLedgerEntry}
              appName={appName}
              updateAppName={updateAppName}
              appLogo={appLogo}
              updateAppLogo={updateAppLogo}
              labelWargaSingular={labelWargaSingular}
              updateLabelWargaSingular={updateLabelWargaSingular}
              labelWargaPlural={labelWargaPlural}
              updateLabelWargaPlural={updateLabelWargaPlural}
              labelRombongSingular={labelRombongSingular}
              updateLabelRombongSingular={updateLabelRombongSingular}
              labelRombongPlural={labelRombongPlural}
              updateLabelRombongPlural={updateLabelRombongPlural}
            />
          )}

          {activeTab === 'panduan' && (
            <UserGuide 
              kas={kas}
              updateKas={updateKas}
              ledger={ledger}
              updateLedger={handleSetLedger}
              wargaList={wargaList}
              updateWargaList={handleUpdateWargaList}
              rombongList={rombongList}
              updateRombongList={handleUpdateRombongList}
              usersList={usersList}
              updateUsersList={handleUpdateUsersList}
              blocksList={blocksList}
              updateBlocksList={updateBlocksList}
              yearsList={yearsList}
              updateYearsList={updateYearsList}
              rateRT={rateRT}
              updateRateRT={updateRateRT}
              rateRombong={rateRombong}
              updateRateRombong={updateRateRombong}
              rtTitle={rtTitle}
              updateRtTitle={updateRtTitle}
              rtAddress={rtAddress}
              updateRtAddress={updateRtAddress}
              rtEmail={rtEmail}
              updateRtEmail={updateRtEmail}
              currentUser={currentUser}
              onTriggerReset={handleResetData}
              onClearCache={handleRefreshCacheOnly}
              localSyncEnabled={localSyncEnabled}
              updateLocalSyncEnabled={setLocalSyncEnabled}
              localServerIp={localServerIp}
              updateLocalServerIp={setLocalServerIp}
              localServerStatus={localServerStatus}
              serverDiscoveredIps={serverDiscoveredIps}
              localSyncMessage={localSyncMessage}
              onRetryLocalCheck={checkAndSyncLocalServer}
            />
          )}
        </div>

      </main>

      {/* Styled Responsive Docked Bottom Navigation Panel */}
      <div className={`fixed bottom-0 left-0 right-0 p-4 bg-white/95 border-t border-slate-200/80 z-40 transition-all duration-300 ${
        isInputFocused
          ? 'translate-y-full opacity-0 pointer-events-none'
          : 'translate-y-0 opacity-100'
      }`}>
        <div className="max-w-xl mx-auto flex items-center justify-around gap-1 sm:gap-2 bg-white border border-slate-200 p-1 sm:p-2 rounded-2xl shadow-xl">
          
          {/* Dasbor Button */}
          {(!currentUser || (currentUser.role !== 'warga' && currentUser.role !== 'rombong')) && (
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex-1 py-1.5 px-1 sm:py-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'dashboard' 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
              id="tab-dashboard"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Dasbor</span>
            </button>
          )}

          {/* Tagihan Button */}
          <button 
            onClick={() => setActiveTab('tagihan')}
            className={`flex-1 py-1.5 px-1 sm:py-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
              activeTab === 'tagihan' 
                ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
            }`}
            id="tab-tagihan"
          >
            <Receipt className="w-4 h-4" />
            <span className="hidden sm:inline">{currentUser?.role === 'warga' || currentUser?.role === 'rombong' ? 'Tagihan Saya' : 'Daftar Tagihan'}</span>
            <span className="sm:hidden">{currentUser?.role === 'warga' || currentUser?.role === 'rombong' ? 'Tagihan' : 'Tagihan'}</span>
          </button>

          {/* Buku Kas Ledger Button */}
          {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'bendahara' || currentUser?.role === 'sekretaris' || currentUser?.role === 'audit') && (
            <button 
              onClick={() => setActiveTab('buku_kas')}
              className={`flex-1 py-1.5 px-1 sm:py-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'buku_kas' 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
              id="tab-buku_kas"
            >
              <BookOpen className="w-4 h-4" />
              <span className="hidden sm:inline">Buku Kas</span>
              <span className="sm:hidden">Kas</span>
            </button>
          )}

          {/* ADM (Administrasi) Button for Secretary, Bendahara & Admin */}
          {isLoggedIn && (currentUser?.role === 'admin' || currentUser?.role === 'sekretaris' || currentUser?.role === 'bendahara') && (
            <button 
              onClick={() => setActiveTab('undangan')}
              className={`flex-1 py-1.5 px-1 sm:py-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'undangan' 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
              id="tab-undangan"
            >
              <Users className="w-4 h-4" />
              <span>ADM</span>
            </button>
          )}

          {/* Buku Kolektor Reconciliation Button */}
          {(!currentUser || (currentUser.role !== 'warga' && currentUser.role !== 'rombong' && currentUser.role !== 'sekretaris')) && (
            <button 
              onClick={() => setActiveTab('buku_kolektor')}
              className={`flex-1 py-1.5 px-1 sm:py-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'buku_kolektor' 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
              id="tab-buku_kolektor"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Buku Kolektor</span>
              <span className="sm:hidden">Kolektor</span>
            </button>
          )}

          {/* Buku Panduan / Help & Troubleshooting Button */}
          {currentUser && (currentUser.role !== 'warga' && currentUser.role !== 'rombong') && (
            <button 
              onClick={() => setActiveTab('panduan')}
              className={`flex-1 py-1.5 px-1 sm:py-3 sm:px-2.5 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-semibold flex flex-col items-center justify-center gap-1 sm:gap-1.5 transition cursor-pointer ${
                activeTab === 'panduan' 
                  ? 'bg-sky-50 text-sky-600 border border-sky-100' 
                  : 'text-slate-500 hover:text-slate-850 hover:bg-slate-50'
              }`}
              id="tab-panduan"
            >
              <HelpCircle className="w-4 h-4" />
              <span>Manual</span>
            </button>
          )}

        </div>
      </div>

      {/* Persistent Login Modal Dialog */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)}
        users={usersList}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          // Set tab to active edit tab for smooth experience
          if (user.role === 'warga' || user.role === 'rombong') {
            setActiveTab('tagihan');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />

      {/* User Management Modal */}
      <UserManagementModal
        isOpen={showUserManagement}
        onClose={() => setShowUserManagement(false)}
        users={usersList}
        onUpdateUsers={handleUpdateUsersList}
        currentUser={currentUser}
        wargaList={wargaList}
        rombongList={rombongList}
      />

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white border border-rose-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 text-slate-800 max-w-lg w-full">
            <div className="flex items-center gap-3 border-b border-rose-100 pb-3 mb-4">
              <div className="p-2.5 bg-rose-50 text-rose-600 rounded-2xl">
                <ShieldAlert className="w-5 h-5 text-rose-600 animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm">Opsi Pengosongan & Reset Data</h3>
                <p className="text-[10px] text-rose-500 font-semibold font-mono tracking-wide uppercase">Pilih Tingkat Format Data</p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-705 font-semibold">
                Silakan pilih cakupan data yang ingin di-reset/dikosongkan:
              </p>

              <div className="space-y-2">
                {/* Opsi 1 */}
                <button
                  type="button"
                  onClick={() => setResetDataMode('transaksi')}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs transition flex flex-col gap-1 cursor-pointer ${
                    resetDataMode === 'transaksi'
                      ? 'bg-amber-50 border-amber-300 text-amber-950 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      resetDataMode === 'transaksi' ? 'border-amber-600 bg-amber-600' : 'border-slate-350'
                    }`}>
                      {resetDataMode === 'transaksi' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    <span>1. Reset Data Transaksi (Mutasi Kas &amp; Iuran)</span>
                  </div>
                  <p className="text-[10px] pl-5.5 leading-relaxed text-slate-500">
                    Menghapus seluruh riwayat mutasi masuk/keluar buku kas RT &amp; rombong. Saldo kas kembali ke Rp 0, dan semua status iuran warga/lapak diatur ulang ke <strong>"Belum Lunas"</strong>. Daftar nama warga &amp; lapak tetap utuh.
                  </p>
                </button>

                {/* Opsi 2 */}
                <button
                  type="button"
                  onClick={() => setResetDataMode('warga')}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs transition flex flex-col gap-1 cursor-pointer ${
                    resetDataMode === 'warga'
                      ? 'bg-amber-50 border-amber-300 text-amber-955 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      resetDataMode === 'warga' ? 'border-amber-600 bg-amber-600' : 'border-slate-350'
                    }`}>
                      {resetDataMode === 'warga' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    <span>2. Reset Data Warga &amp; Lapak Rombong</span>
                  </div>
                  <p className="text-[10px] pl-5.5 leading-relaxed text-slate-500">
                    Menghapus seluruh database daftar nama warga, data KTP/KK, dan pendaftaran lapak rombong secara permanen. Pengaturan kas dan mutasi buku kas ledger tetap utuh.
                  </p>
                </button>

                {/* Opsi 3 */}
                <button
                  type="button"
                  onClick={() => setResetDataMode('semua')}
                  className={`w-full text-left p-3.5 rounded-2xl border text-xs transition flex flex-col gap-1 cursor-pointer ${
                    resetDataMode === 'semua'
                      ? 'bg-rose-50 border-rose-300 text-rose-955 shadow-sm'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2 font-bold text-rose-800">
                    <span className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${
                      resetDataMode === 'semua' ? 'border-rose-600 bg-rose-600' : 'border-slate-350'
                    }`}>
                      {resetDataMode === 'semua' && <span className="w-1.5 h-1.5 bg-white rounded-full"></span>}
                    </span>
                    <span className="font-extrabold">3. Reset Ke Awal Semuanya (Factory Reset)</span>
                  </div>
                  <p className="text-[10px] pl-5.5 leading-relaxed text-slate-500">
                    Format total sistem. Menghapus seluruh data mutasi kas, data warga, lapak rombong, kuitansi bayar, dokumen digital, dan memicu pemulihan parameter nilai iuran default.
                  </p>
                </button>
              </div>

              <div className="pt-2">
                <label className="block text-xs font-bold text-slate-500 mb-1.5">
                  Ketik kata kunci konfirmasi <strong className="text-rose-650 font-extrabold bg-rose-50 border border-rose-100 px-1.5 py-0.5 rounded font-mono">HAPUS</strong> untuk melanjutkan aksi ini:
                </label>
                <input
                  type="text"
                  placeholder="Ketik HAPUS untuk konfirmasi"
                  value={resetConfirmInput}
                  onChange={(e) => setResetConfirmInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-extrabold font-mono tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white transition"
                />
              </div>
            </div>

            <div className="flex gap-2.5 justify-end mt-6 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setShowResetConfirmModal(false);
                  setResetConfirmInput('');
                }}
                className="px-4 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-650 hover:text-slate-805 font-bold rounded-xl text-xs cursor-pointer transition active:scale-95 flex-1"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={resetConfirmInput.trim().toUpperCase() !== 'HAPUS'}
                onClick={async () => {
                  if (resetConfirmInput.trim().toUpperCase() === 'HAPUS') {
                    try {
                      if (isSupabaseConfigured) {
                        if (resetDataMode === 'transaksi') {
                          // 1. Reset settings General with refreshed Balance
                          await upsertGeneralSettings({
                            kas: INITIAL_BALANCES,
                            blocksList,
                            yearsList,
                            rateRT,
                            rateRombong,
                            rtTitle,
                            rtAddress,
                            rtEmail
                          });

                          // 2. Delete all ledger entries
                          for (const entry of ledger) {
                            await deleteLedgerEntry(entry.id);
                          }

                          // 3. Mark all citizen bills in Supabase as unpaid
                          const updatedWargaList = wargaList.map(w => ({
                            ...w,
                            iuranRT: w.iuranRT.map(slot => ({ 
                              ...slot, 
                              lunas: false, 
                              tanggalBayar: undefined, 
                              jamBayar: undefined, 
                              fotoBase64: undefined, 
                              fotoNamaFile: undefined 
                            }))
                          }));
                          for (const w of updatedWargaList) {
                            await saveWargaBill(w);
                          }

                          // 4. Mark all rombong bills in Supabase as unpaid
                          const updatedRombongList = rombongList.map(r => ({
                            ...r,
                            iuranRombong: r.iuranRombong.map(slot => ({ 
                              ...slot, 
                              lunas: false, 
                              tanggalBayar: undefined, 
                              jamBayar: undefined, 
                              fotoBase64: undefined, 
                              fotoNamaFile: undefined 
                            }))
                          }));
                          for (const r of updatedRombongList) {
                            await saveRombongBill(r);
                          }

                          // Sync local states
                          setKas(INITIAL_BALANCES);
                          setLedger([]);
                          setWargaList(updatedWargaList);
                          setRombongList(updatedRombongList);
                          alert('Data seluruh Transaksi, Buku Kas, dan Iuran berhasil dikosongkan!');

                        } else if (resetDataMode === 'warga') {
                          // Delete all warga bills
                          for (const w of wargaList) {
                            await deleteWargaBill(w.id);
                          }
                          // Delete all rombong bills
                          for (const r of rombongList) {
                            await deleteRombongBill(r.id);
                          }

                          setWargaList([]);
                          setRombongList([]);
                          alert('Seluruh data pendaftaran Warga & Lapak Rombong berhasil dihapus secara permanen!');

                        } else {
                          // resetDataMode === 'semua'
                          await upsertGeneralSettings({
                            kas: INITIAL_BALANCES,
                            blocksList: ['A4', 'A3', 'C5', 'C3'],
                            yearsList: [2024, 2025, 2026, 2027, 2028],
                            rateRT: 110000,
                            rateRombong: 130000,
                            rtTitle: 'PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04',
                            rtAddress: 'PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.',
                            rtEmail: ''
                          });

                          for (const entry of ledger) {
                            await deleteLedgerEntry(entry.id);
                          }
                          for (const w of wargaList) {
                            await deleteWargaBill(w.id);
                          }
                          for (const r of rombongList) {
                            await deleteRombongBill(r.id);
                          }

                          setKas(INITIAL_BALANCES);
                          setBlocksList(['A4', 'A3', 'C5', 'C3']);
                          setYearsList([2024, 2025, 2026, 2027, 2028]);
                          setRateRT(110000);
                          setRateRombong(130000);
                          setRtTitle('PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04');
                          setRtAddress('PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.');
                          setRtEmail('tas3.rt.08@gmail.com');
                          setLedger([]);
                          setWargaList([]);
                          setRombongList([]);
                          alert('Sistem berhasil pulih total (Factory Reset) ke data awal!');
                        }

                      } else if (isFirebaseConfigured) {
                        if (resetDataMode === 'transaksi') {
                          // 1. Reset Settings General Document in Firestore
                          const settingsRef = doc(db, 'settings', 'general');
                          await setDoc(settingsRef, {
                            kas: INITIAL_BALANCES,
                            blocksList,
                            yearsList,
                            rateRT,
                            rateRombong,
                            rtTitle,
                            rtAddress,
                            rtEmail,
                            appName,
                            appLogo,
                            labelWargaSingular,
                            labelWargaPlural,
                            labelRombongSingular,
                            labelRombongPlural,
                            bankNama,
                            bankNoRek,
                            bankPenerima,
                            bankCatatanVendor,
                            meetingNotulen
                          });

                          // 2. Delete all ledger entries
                          for (const entry of ledger) {
                            await deleteDoc(doc(db, 'ledger_entries', entry.id));
                          }

                          // 3. Mark all citizen bills in Firestore as unpaid
                          const updatedWargaList = wargaList.map(w => ({
                            ...w,
                            iuranRT: w.iuranRT.map(slot => ({ 
                              ...slot, 
                              lunas: false, 
                              tanggalBayar: undefined, 
                              jamBayar: undefined, 
                              fotoBase64: undefined, 
                              fotoNamaFile: undefined 
                            }))
                          }));
                          for (const w of updatedWargaList) {
                            await setDoc(doc(db, 'warga_bills', w.id), w);
                          }

                          // 4. Mark all rombong bills in Firestore as unpaid
                          const updatedRombongList = rombongList.map(r => ({
                            ...r,
                            iuranRombong: r.iuranRombong.map(slot => ({ 
                              ...slot, 
                              lunas: false, 
                              tanggalBayar: undefined, 
                              jamBayar: undefined, 
                              fotoBase64: undefined, 
                              fotoNamaFile: undefined 
                            }))
                          }));
                          for (const r of updatedRombongList) {
                            await setDoc(doc(db, 'rombong_bills', r.id), r);
                          }

                          // Sync local states
                          setKas(INITIAL_BALANCES);
                          setLedger([]);
                          setWargaList(updatedWargaList);
                          setRombongList(updatedRombongList);
                          alert('Data seluruh Transaksi, Buku Kas, dan Iuran berhasil dikosongkan!');

                        } else if (resetDataMode === 'warga') {
                          // Delete all warga bills
                          for (const w of wargaList) {
                            await deleteDoc(doc(db, 'warga_bills', w.id));
                          }
                          // Delete all rombong bills
                          for (const r of rombongList) {
                            await deleteDoc(doc(db, 'rombong_bills', r.id));
                          }

                          setWargaList([]);
                          setRombongList([]);
                          alert('Seluruh data pendaftaran Warga & Lapak Rombong berhasil dihapus secara permanen!');

                        } else {
                          // resetDataMode === 'semua'
                          const settingsRef = doc(db, 'settings', 'general');
                          await setDoc(settingsRef, {
                            kas: INITIAL_BALANCES,
                            blocksList: ['A4', 'A3', 'C5', 'C3'],
                            yearsList: [2024, 2025, 2026, 2027, 2028],
                            rateRT: 110000,
                            rateRombong: 130000,
                            rtTitle: 'PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04',
                            rtAddress: 'PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.',
                            rtEmail: '',
                            appName: 'Kas Perumtas 3 RT 08',
                            appLogo: '',
                            labelWargaSingular: 'Warga',
                            labelWargaPlural: 'Warga',
                            labelRombongSingular: 'Rombong',
                            labelRombongPlural: 'Lapak Rombong',
                            bankNama: 'Bank Mandiri',
                            bankNoRek: '',
                            bankPenerima: '',
                            bankCatatanVendor: '',
                            meetingNotulen: ''
                          });

                          for (const entry of ledger) {
                            await deleteDoc(doc(db, 'ledger_entries', entry.id));
                          }
                          for (const w of wargaList) {
                            await deleteDoc(doc(db, 'warga_bills', w.id));
                          }
                          for (const r of rombongList) {
                            await deleteDoc(doc(db, 'rombong_bills', r.id));
                          }

                          setKas(INITIAL_BALANCES);
                          setBlocksList(['A4', 'A3', 'C5', 'C3']);
                          setYearsList([2024, 2025, 2026, 2027, 2028]);
                          setRateRT(110000);
                          setRateRombong(130000);
                          setRtTitle('PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04');
                          setRtAddress('PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.');
                          setRtEmail('tas3.rt.08@gmail.com');
                          setLedger([]);
                          setWargaList([]);
                          setRombongList([]);
                          alert('Sistem berhasil pulih total (Factory Reset) ke data awal!');
                        }

                      } else {
                        // Direct Local state reset
                        if (resetDataMode === 'transaksi') {
                          setKas(INITIAL_BALANCES);
                          setLedger([]);
                          const updatedWargaList = wargaList.map(w => ({
                            ...w,
                            iuranRT: w.iuranRT.map(slot => ({ ...slot, lunas: false, tanggalBayar: undefined, jamBayar: undefined, fotoBase64: undefined, fotoNamaFile: undefined }))
                          }));
                          setWargaList(updatedWargaList);
                          const updatedRombongList = rombongList.map(r => ({
                            ...r,
                            iuranRombong: r.iuranRombong.map(slot => ({ ...slot, lunas: false, tanggalBayar: undefined, jamBayar: undefined, fotoBase64: undefined, fotoNamaFile: undefined }))
                          }));
                          setRombongList(updatedRombongList);
                          alert('Data seluruh Transaksi, Buku Kas, dan Iuran berhasil dikosongkan!');

                        } else if (resetDataMode === 'warga') {
                          setWargaList([]);
                          setRombongList([]);
                          alert('Seluruh data pendaftaran Warga & Lapak Rombong berhasil dihapus!');

                        } else {
                          // 'semua'
                          setKas(INITIAL_BALANCES);
                          setBlocksList(['A4', 'A3', 'C5', 'C3']);
                          setYearsList([2024, 2025, 2026, 2027, 2028]);
                          setRateRT(110000);
                          setRateRombong(130000);
                          setRtTitle('PENGURUS RUKUN TETANGGA 08 RUKUN WARGA 04');
                          setRtAddress('PERUMTAS 3 RT. 008 RW.004 DESA POPOH-WONOAYU-SIDOARJO.');
                          setRtEmail('tas3.rt.08@gmail.com');
                          setLedger([]);
                          setWargaList([]);
                          setRombongList([]);
                          alert('Sistem berhasil di-reset total ke kondisi awal!');
                        }
                      }

                      setActiveTab('dashboard');
                      setShowResetConfirmModal(false);
                      setResetConfirmInput('');
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, 'multiple collections reset');
                    }
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-250 text-white font-extrabold rounded-xl text-xs cursor-pointer transition flex-1 active:scale-95 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Kosongkan Sesuai Pilihan</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
