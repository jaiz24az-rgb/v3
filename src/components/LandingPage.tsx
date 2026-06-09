import React, { useState } from 'react';
import { 
  ShieldCheck, 
  LogIn, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Users, 
  Store, 
  Coins, 
  ArrowRight, 
  Lock, 
  HelpCircle,
  Clock,
  Sparkles,
  BookOpen,
  Unlock,
  ShieldAlert
} from 'lucide-react';
import { AppUser } from '../types';

interface LandingPageProps {
  users: AppUser[];
  onLoginSuccess: (user: AppUser) => void;
  rtTitle: string;
  rtAddress: string;
  isFirebaseConfigured: boolean;
  isSupabaseConfigured: boolean;
  onUpdateUsersList?: (newUsers: AppUser[]) => void;
  appName: string;
  appLogo: string;
  labelWargaSingular: string;
  labelWargaPlural: string;
  labelRombongSingular: string;
  labelRombongPlural: string;
}

export default function LandingPage({ 
  users, 
  onLoginSuccess, 
  rtTitle, 
  rtAddress,
  isFirebaseConfigured,
  isSupabaseConfigured,
  onUpdateUsersList,
  appName,
  appLogo,
  labelWargaSingular,
  labelWargaPlural,
  labelRombongSingular,
  labelRombongPlural
}: LandingPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // States for Admin PIN Recovery
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPin, setNewPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [recoverySuccess, setRecoverySuccess] = useState('');

  const typedUser = users.find(
    u => u.username.toLowerCase() === username.trim().toLowerCase()
  );
  const isAdmin = typedUser?.role === 'admin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Simulate small smooth delay for luxury premium feel
    setTimeout(() => {
      const foundUser = users.find(
        u => u.username.toLowerCase() === username.trim().toLowerCase() && u.pin.trim() === password.trim()
      );

      if (foundUser) {
        onLoginSuccess(foundUser);
      } else {
        setError('Kombinasi ID Login (Username) atau PIN keamanan salah!');
        setLoading(false);
      }
    }, 600);
  };

  const handleRecoverPinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    setRecoverySuccess('');

    if (recoveryCode.trim() !== 'RT08_PULIH_DARURAT_2026') {
      setRecoveryError('Kode Kunci Pemulihan Darurat Salah/Tidak Valid!');
      return;
    }

    if (newPin.trim().length < 4) {
      setRecoveryError('PIN baru harus minimal 4 karakter!');
      return;
    }

    if (!typedUser) {
      setRecoveryError('Akun admin tidak ditemukan!');
      return;
    }

    const updatedUsers = users.map(u => {
      if (u.id === typedUser.id) {
        return {
          ...u,
          pin: newPin.trim()
        };
      }
      return u;
    });

    if (onUpdateUsersList) {
      onUpdateUsersList(updatedUsers);
    }

    setPassword(newPin.trim()); // Autofill the PIN input field
    setRecoverySuccess(`Sukses! PIN Admin untuk "${typedUser.username}" berhasil diatur ulang menjadi "${newPin.trim()}".`);
    setNewPin('');
    setRecoveryCode('');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-between relative overflow-hidden text-slate-100 font-sans">
      
      {/* Decorative ambient blurred glowing circles */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-sky-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />

      {/* Top micro status bar */}
      <div className="w-full px-6 py-3 border-b border-white/5 bg-slate-900/40 backdrop-blur-md flex items-center justify-between text-xs z-20">
        <div className="flex items-center gap-2 text-slate-400 font-medium">
          <Coins className="w-4 h-4 text-sky-400" />
          <span className="hidden sm:inline">Portal Keuangan Mandiri</span>
          <span className="text-white/10 hidden sm:inline">|</span>
          <span>RT 08 RW 04 Popoh</span>
        </div>
        <div className="flex items-center gap-2">
          {(isFirebaseConfigured || isSupabaseConfigured) ? (
            <span className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              {isSupabaseConfigured ? 'Supabase Connected' : 'Firebase Connected'}
            </span>
          ) : (
            <span className="flex items-center gap-1.5 bg-amber-500/10 text-amber-400 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono uppercase tracking-wide border border-amber-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
              Local Database Mode
            </span>
          )}
        </div>
      </div>

      {/* Main split grid panel containing Logo + Description and the Login Card */}
      <div className="max-w-5xl w-full mx-auto px-4 py-8 md:py-16 flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-14 z-10">
        
        {/* Left Side: Titles & Description */}
        <div className="flex-1 text-center lg:text-left space-y-6">

          <div className="space-y-3.5">
            <div className="flex items-center justify-center lg:justify-start">
              <div className="w-20 h-20 rounded-3xl overflow-hidden bg-slate-950 p-0.5 border border-sky-400/40 shadow-xl shadow-sky-500/15 mb-2 hover:scale-105 transition duration-300">
                <img src={appLogo || "/favicon.png"} alt="App Logo" className="w-full h-full object-cover rounded-[22px]" referrerPolicy="no-referrer" />
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 bg-sky-500/10 text-sky-300 px-3.5 py-1.5 rounded-full text-xs font-black tracking-wider uppercase font-mono">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              SISTEM DIGITALISASI {labelWargaPlural.toUpperCase()} &amp; {labelRombongPlural.toUpperCase()}
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent whitespace-pre-line">
              {appName}
            </h2>

          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto lg:mx-0 pt-2 text-left">
            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3.5 hover:border-sky-500/20 transition group">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 mb-2 group-hover:scale-110 transition">
                <Users className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-white">Iuran {labelWargaSingular}</h4>
              <p className="text-[11px] text-slate-450 mt-1 font-medium leading-normal">
                Lihat tagihan bulanan langsung lewat akun {labelWargaSingular.toLowerCase()} sendiri.
              </p>
            </div>

            <div className="bg-slate-900/60 border border-white/5 rounded-2xl p-3.5 hover:border-emerald-500/20 transition group">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-2 group-hover:scale-110 transition">
                <Store className="w-4.5 h-4.5" />
              </div>
              <h4 className="text-xs font-bold text-white">Iuran {labelRombongSingular}</h4>
              <p className="text-[11px] text-slate-450 mt-1 font-medium leading-normal">
                Lihat Tagihan Iuran bulanan sewa {labelRombongSingular.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: High-end Login Card Portal */}
        <div className="w-full max-w-md bg-gradient-to-b from-slate-900 to-slate-950 border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300">
          
          {/* Top aesthetic accent line */}
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-sky-400 via-sky-500 to-indigo-500" />
          
          <div className="mb-6 text-center lg:text-left">
            <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center justify-center lg:justify-start gap-2">
              <ShieldCheck className="w-5 h-5 text-sky-400 shrink-0" />
              <span>Otentikasi Akun</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed font-medium">
              Silakan masukkan Username ID dan PIN keamanan Anda untuk masuk ke sistem.
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 text-xs flex items-start gap-2 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 font-mono">
                Username / ID Pengguna
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
                className="w-full bg-slate-950 border border-white/10 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl px-4 py-3 text-sm text-white focus:outline-none placeholder-slate-600 font-mono transition duration-150 disabled:opacity-50"
                placeholder="cth: bendahara / nama_warga"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono">
                  PIN Keamanan
                </label>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => {
                      setRecoveryCode('');
                      setNewPin('');
                      setRecoveryError('');
                      setRecoverySuccess('');
                      setShowRecoveryModal(true);
                    }}
                    className="text-[10px] text-rose-450 hover:text-rose-400 font-bold transition cursor-pointer flex items-center gap-1 active:scale-95 border-b border-rose-500/20 hover:border-rose-400"
                  >
                    <Unlock className="w-3 h-3 text-rose-400" />
                    <span>Lupa PIN?</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] text-sky-400 font-bold font-mono">
                    <Lock className="w-3" />
                    <span>PIN numeric</span>
                  </div>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  className="w-full bg-slate-950 border border-white/10 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 rounded-xl pl-4 pr-11 py-3 text-sm text-white focus:outline-none placeholder-slate-600 font-mono tracking-widest transition duration-150 disabled:opacity-50"
                  placeholder="••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-500 hover:text-slate-350 transition cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-500 text-slate-950 font-black py-3 rounded-xl cursor-pointer transition-all duration-200 text-sm flex items-center justify-center gap-2 shadow-xl shadow-sky-500/10 mt-6 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4.5 w-4.5 text-slate-950" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Memverifikasi Sandi...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight className="w-4 h-4 text-slate-950 shrink-0" strokeWidth={2.5} />
                </>
              )}
            </button>
          </form>

          {/* Guide section */}
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-xs font-bold text-slate-400 hover:text-white flex items-center gap-1.5 transition cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-sky-400 shrink-0" />
                <span>Petunjuk Akses Akun</span>
              </button>
            </div>

            {showGuide && (
              <div className="bg-slate-950/60 border border-white/5 rounded-2xl p-4 text-xs text-slate-400 space-y-2.5 animate-in slide-in-from-top-1 duration-200">
                <p className="leading-relaxed">
                  📢 <strong className="text-white">Untuk Pengurus (Admin/Bendahara):</strong> Gunakan username admin/bendahara yang telah disediakan Ketua RT untuk menyunting mutasi & register iuran.
                </p>
                <p className="leading-relaxed">
                  🏡 <strong className="text-white">Untuk Warga RT 08 & Rombong:</strong> Anda kini bisa masuk menggunakan username nama Anda yang didaftarkan oleh Bendahara untuk memantau status iuran sendiri secara aman. Hubungi pengurus RT jika Anda belum memiliki User Akun.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Admin PIN Recovery Modal */}
      {showRecoveryModal && typedUser && (
        <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 max-w-md w-full text-slate-200 shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200 relative">
            <button
              onClick={() => setShowRecoveryModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition text-lg p-1.5 hover:bg-white/5 rounded-full"
              title="Tutup"
            >
              ✕
            </button>
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-rose-500/10 text-rose-450 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/25">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-black text-white tracking-tight">Sistem Pemulihan PIN Admin</h3>
              <p className="text-xs text-slate-404 leading-relaxed max-w-sm mx-auto font-sans text-slate-400">
                Menu pemulihan darurat khusus untuk administrator akun: <strong className="text-white font-mono">{typedUser.username}</strong>.
              </p>
            </div>

            <form onSubmit={handleRecoverPinSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5 text-slate-400">
                  Kode Kunci Pemulihan RT 08:
                </label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan Kode Kunci Pemulihan RT"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 focus:border-red-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:ring-1 focus:ring-red-500 focus:outline-none placeholder-slate-800"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-450 uppercase tracking-widest font-mono mb-1.5 text-slate-400">
                  PIN Keamanan Baru (min 4 digit):
                </label>
                <input
                  type="password"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  placeholder="PIN Angka Baru"
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold text-white focus:ring-1 focus:ring-emerald-500 focus:outline-none placeholder-slate-700"
                />
              </div>

              {recoveryError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-rose-400 text-xs font-semibold leading-normal font-sans">
                  ⚠️ {recoveryError}
                </div>
              )}

              {recoverySuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold leading-normal font-sans">
                  ✅ {recoverySuccess}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRecoveryModal(false)}
                  className="flex-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-400 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Tutup
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-red-650 to-rose-650 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs py-2.5 rounded-xl transition shadow-xl flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Unlock className="w-4 h-4" />
                  <span>Atur Ulang PIN</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Footer Area with details of location */}
      <footer className="w-full text-center py-6 px-4 border-t border-white/5 bg-slate-950 text-slate-500 text-xs z-10 flex flex-col gap-1">
        <p className="font-extrabold text-[11px] text-slate-400 font-mono tracking-widest uppercase">{rtTitle}</p>
        <p className="text-[10px] text-slate-500 tracking-wide font-medium leading-relaxed max-w-2xl mx-auto">{rtAddress}</p>
        <p className="text-[10px] text-slate-600 font-mono mt-2">© {new Date().getFullYear()} RT08 RW04 Perumtas 3 Sidoarjo. All Rights Secured.</p>
      </footer>

    </div>
  );
}
