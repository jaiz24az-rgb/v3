import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  onAuthStateChanged,
  User 
} from 'firebase/auth';

// State global pemegang token di memori (tidak disimpan di localStorage demi keamanan)
let cachedAccessToken: string | null = null;
let workspaceUser: User | null = null;
let authListenerInitialized = false;

// Instance Auth dari Firebase
const getWorkspaceAuth = () => {
  return getAuth();
};

/**
 * Inisialisasi pengecekan auth state Google Workspace
 */
export const initWorkspaceAuth = (
  onSuccess: (user: User, token: string) => void,
  onFailure: () => void
) => {
  const auth = getWorkspaceAuth();
  
  if (authListenerInitialized) {
    if (workspaceUser && cachedAccessToken) {
      onSuccess(workspaceUser, cachedAccessToken);
    }
    return;
  }

  authListenerInitialized = true;
  return onAuthStateChanged(auth, (user) => {
    if (user) {
      workspaceUser = user;
      // Token harus didapatkan kembali melalui login popup jika session selesai,
      // kita cache token in-memory saat login popup berhasil dilakukan.
      if (cachedAccessToken) {
        onSuccess(user, cachedAccessToken);
      } else {
        onFailure();
      }
    } else {
      workspaceUser = null;
      cachedAccessToken = null;
      onFailure();
    }
  });
};

/**
 * Melakukan popup Login Google guna memperoleh token OAuth Workspace
 */
export const signInWithGoogleForWorkspace = async (): Promise<{ user: User; accessToken: string } | null> => {
  const auth = getWorkspaceAuth();
  const provider = new GoogleAuthProvider();
  
  // Daftarkan scopes Google Calendar, Sheets (Spreadsheets), dan Drive
  provider.addScope('https://www.googleapis.com/auth/calendar');
  provider.addScope('https://www.googleapis.com/auth/spreadsheets');
  provider.addScope('https://www.googleapis.com/auth/drive');
  
  try {
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    
    if (!token) {
      throw new Error('Gagal mendapatkan Kunci Akses OAuth Google.');
    }
    
    cachedAccessToken = token;
    workspaceUser = result.user;
    
    return { user: result.user, accessToken: token };
  } catch (error) {
    console.error('Error saat login Google Workspace:', error);
    throw error;
  }
};

/**
 * Log out dari Google Workspace Auth
 */
export const logoutWorkspace = async () => {
  const auth = getWorkspaceAuth();
  await signOut(auth);
  cachedAccessToken = null;
  workspaceUser = null;
};

/**
 * Mengambil token saat ini jika ada
 */
export const getCachedToken = (): string | null => {
  return cachedAccessToken;
};

/**
 * Mengetahui apakah token aktif sudah tersedia
 */
export const isWorkspaceConnected = (): boolean => {
  return !!cachedAccessToken;
};

// ============================================
// 1. GOOGLE DRIVE API INTEGRATION (BACKUP CLOUD)
// ============================================

/**
 * Unggah berkas JSON Backup RT 08 langsung ke Google Drive
 */
export const uploadBackupToGoogleDrive = async (
  jsonData: any,
  fileName: string
): Promise<{ success: boolean; fileId?: string; error?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    return { success: false, error: 'Koneksi akun Google terputus. Silakan sambungkan ulang.' };
  }

  try {
    const backupString = JSON.stringify(jsonData, null, 2);
    
    // Tahap 1: Metadata file (Nama File & MIME type)
    const metadata = {
      name: fileName,
      mimeType: 'application/json',
      description: 'Salinan cadangan database kas & iuran RT 08 otomatis dari AI Studio App.'
    };

    // Buat multipart payload
    const boundary = 'foo_bar_boundary';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      backupString +
      closeDelimiter;

    // Response upload dari Google Drive v3
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Google Drive API returned status ${res.status}: ${errText}`);
    }

    const resultJson = await res.json();
    return { success: true, fileId: resultJson.id };
  } catch (error: any) {
    console.error('Drive upload helper error:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// ============================================
// 2. GOOGLE SHEETS API INTEGRATION (EXPORT REPORT)
// ============================================

/**
 * Ekspor & Buat Google Spreadsheet baru bermuatan keuangan Ledger RT 08
 */
export const syncLedgerToGoogleSheets = async (
  ledgerList: any[],
  wargaList: any[],
  rombongList: any[],
  rtTitle: string
): Promise<{ success: boolean; spreadsheetUrl?: string; error?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    return { success: false, error: 'Koneksi akun Google terputus. Silakan sambungkan ulang.' };
  }

  try {
    // 1. Buat Spreadsheet Struktur Kosong dengan 3 lembar kerja (Tab): Ledger, Daftar Warga, Rombong
    const sheetMetadata = {
      properties: {
        title: `Laporan Keuangan & Iuran: ${rtTitle || 'RT 08 RW 03'}`
      },
      sheets: [
        { properties: { title: 'Daftar Mutasi Kas' } },
        { properties: { title: 'Iuran Warga' } },
        { properties: { title: 'Iuran Lapak Rombong' } }
      ]
    };

    const createRes = await fetch('https://www.googleapis.com/sheets/v4/spreadsheets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sheetMetadata)
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Failed to create spreadsheet: ${errText}`);
    }

    const spreadsheet = await createRes.json();
    const spreadsheetId = spreadsheet.spreadsheetId;
    const spreadsheetUrl = spreadsheet.spreadsheetUrl;

    // 2. Format Data Tab 1: Daftar Mutasi Kas
    const ledgerRows = [
      ['No', 'Tanggal', 'Kategori', 'Deskripsi', 'Tipe', 'Kas Penerima / Pengirim', 'Jumlah (Rp)', 'Petugas Pencatat']
    ];
    ledgerList.forEach((entry, idx) => {
      ledgerRows.push([
        String(idx + 1),
        entry.tanggal || '',
        entry.kategori || '',
        entry.deskripsi || '',
        entry.tipe === 'pemasukan' ? 'Pemasukan (+)' : 'Pengeluaran (-)',
        entry.sumberKas || '',
        String(entry.jumlah || 0),
        entry.petugas || ''
      ]);
    });

    // 3. Format Data Tab 2: Iuran Warga
    const wargaRows = [
      ['No ID', 'Nama Lengkap', 'Blok', 'No Rumah', 'Nomor WA', 'Tolak Iuran', 'Status Pembuat Akun', 'Periode Lunas (2026)']
    ];
    wargaList.forEach((w) => {
      const lunasMonths = (w.iuranRT || [])
        .filter((i: any) => i.lunas)
        .map((i: any) => `${i.bulan} ${i.tahun || '2026'}`)
        .join(', ');

      wargaRows.push([
        w.id || '',
        w.nama || '',
        w.blok || '',
        w.noRumah || '',
        w.noWa || '',
        w.tolakIuran ? 'Ya (Penolakan)' : 'Tidak',
        w.usernameBind || 'Belum Terikat',
        lunasMonths || 'Tidak ada iuran lunas'
      ]);
    });

    // 4. Format Data Tab 3: Iuran Lapak Rombong
    const rombongRows = [
      ['No ID', 'Nama Pemilik Lapak', 'Nama Usaha', 'No Lapak', 'Nomor WA', 'Status Akun', 'Periode Sewa Lunas']
    ];
    rombongList.forEach((r) => {
      const lunasMonths = (r.iuranRombong || [])
        .filter((i: any) => i.lunas)
        .map((i: any) => `${i.bulan} ${i.tahun || '2026'}`)
        .join(', ');

      rombongRows.push([
        r.id || '',
        r.namaPemilik || '',
        r.namaUsaha || '',
        r.noLapak || '',
        r.noWa || '',
        r.usernameBind || 'Belum Terikat',
        lunasMonths || 'Tidak ada'
      ]);
    });

    // 5. Dorong semua data tersebut ke masing-masing Tab Spreadsheet
    const valuesPayload = {
      valueInputOption: 'USER_ENTERED',
      data: [
        {
          range: 'Daftar Mutasi Kas!A1',
          values: ledgerRows
        },
        {
          range: 'Iuran Warga!A1',
          values: wargaRows
        },
        {
          range: 'Iuran Lapak Rombong!A1',
          values: rombongRows
        }
      ]
    };

    const writeRes = await fetch(`https://www.googleapis.com/sheets/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(valuesPayload)
    });

    if (!writeRes.ok) {
      const errText = await writeRes.text();
      throw new Error(`Failed to write values into spreadsheet: ${errText}`);
    }

    return { success: true, spreadsheetUrl };
  } catch (error: any) {
    console.error('Google Sheets integration error:', error);
    return { success: false, error: error.message || String(error) };
  }
};

// ============================================
// 3. GOOGLE CALENDAR API INTEGRATION (AGENDA RT)
// ============================================

/**
 * Buat Agenda / Event baru di Google Calendar utama
 */
export const pushEventToGoogleCalendar = async (
  title: string,
  description: string,
  dateString: string, // Format 'YYYY-MM-DD'
  timeStartString: string = '08:00', // Format 'HH:MM'
  timeEndString: string = '10:00' // Format 'HH:MM'
): Promise<{ success: boolean; eventHtmlLink?: string; error?: string }> => {
  const token = cachedAccessToken;
  if (!token) {
    return { success: false, error: 'Koneksi akun Google terputus. Silakan sambungkan ulang.' };
  }

  try {
    const startDateTime = `${dateString}T${timeStartString}:00`;
    const endDateTime = `${dateString}T${timeEndString}:00`;

    // Ambil zona waktu lokal secara dinamis
    let timeZone = 'Asia/Jakarta';
    try {
      timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Jakarta';
    } catch (_) {}

    const eventData = {
      summary: title,
      description: description,
      start: {
        dateTime: startDateTime,
        timeZone: timeZone
      },
      end: {
        dateTime: endDateTime,
        timeZone: timeZone
      },
      colorId: '5', // Warna kuning pisang/emas untuk iuran/penagihan,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'popup', minutes: 60 },
          { method: 'email', minutes: 1440 } // Pengingat H-1
        ]
      }
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(eventData)
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Failed to inject Google Calendar event: ${errText}`);
    }

    const event = await res.json();
    return { success: true, eventHtmlLink: event.htmlLink };
  } catch (error: any) {
    console.error('Google Calendar integration error:', error);
    return { success: false, error: error.message || String(error) };
  }
};
