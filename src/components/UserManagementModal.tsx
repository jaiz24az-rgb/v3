import React, { useState } from 'react';
import { AppUser, WargaBill, RombongBill } from '../types';
import { X, UserPlus, Edit, Trash2, Shield, User, Key, Check, Users, Store } from 'lucide-react';

interface UserManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: AppUser[];
  onUpdateUsers: (newUsers: AppUser[]) => void;
  currentUser: AppUser | null;
  wargaList: WargaBill[];
  rombongList: RombongBill[];
}

export default function UserManagementModal({
  isOpen,
  onClose,
  users,
  onUpdateUsers,
  currentUser,
  wargaList = [],
  rombongList = []
}: UserManagementModalProps) {
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; nama: string } | null>(null);
  const [resetTarget, setResetTarget] = useState<AppUser | null>(null);
  const [resetNewPin, setResetNewPin] = useState('');
  const [resetError, setResetError] = useState('');

  // Form Fields
  const [formUsername, setFormUsername] = useState('');
  const [formPin, setFormPin] = useState('');
  const [formNama, setFormNama] = useState('');
  const [formRole, setFormRole] = useState<'admin' | 'bendahara' | 'warga' | 'rombong' | 'kolektor' | 'sekretaris' | 'audit'>('bendahara');
  const [formWargaId, setFormWargaId] = useState('');
  const [formRombongId, setFormRombongId] = useState('');

  if (!isOpen) return null;

  const resetForm = () => {
    setFormUsername('');
    setFormPin('');
    setFormNama('');
    setFormRole('bendahara');
    setFormWargaId('');
    setFormRombongId('');
    setEditingUser(null);
    setIsAdding(false);
    setError('');
    setSuccess('');
  };

  const startEdit = (user: AppUser) => {
    setEditingUser(user);
    setFormUsername(user.username);
    setFormPin(user.pin);
    setFormNama(user.nama);
    setFormRole(user.role);
    setFormWargaId(user.wargaId || '');
    setFormRombongId(user.rombongId || '');
    setIsAdding(false);
    setError('');
    setSuccess('');
  };

  const startAdd = () => {
    resetForm();
    setIsAdding(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formUsername.trim() || !formPin.trim() || !formNama.trim()) {
      setError('Semua kolom isian wajib diisi!');
      return;
    }

    // PIN length recommendation
    if (formPin.length < 4) {
      setError('PIN keamanan minimal harus terdiri dari 4 digit angka/karakter!');
      return;
    }

    if (formRole === 'warga' && !formWargaId) {
      setError('Silakan pilih data Warga yang dikaitkan dengan akun ini!');
      return;
    }
    if (formRole === 'rombong' && !formRombongId) {
      setError('Silakan pilih data Rombong/Pedagang yang dikaitkan dengan akun ini!');
      return;
    }

    if (isAdding) {
      // Check duplicate username
      const isDuplicate = users.some(u => u.username.toLowerCase() === formUsername.trim().toLowerCase());
      if (isDuplicate) {
        setError(`Username "${formUsername}" sudah terdaftar! Pilih username lain.`);
        return;
      }

      const newUser: AppUser = {
        id: `usr-${Date.now()}`,
        username: formUsername.trim(),
        pin: formPin.trim(),
        role: formRole,
        nama: formNama.trim(),
        wargaId: formRole === 'warga' ? formWargaId : undefined,
        rombongId: formRole === 'rombong' ? formRombongId : undefined
      };

      onUpdateUsers([...users, newUser]);
      setSuccess(`Akun "${newUser.nama}" berhasil ditambahkan!`);
      resetForm();
    } else if (editingUser) {
      // Check duplicate username with other users
      const isDuplicate = users.some(u => u.id !== editingUser.id && u.username.toLowerCase() === formUsername.trim().toLowerCase());
      if (isDuplicate) {
        setError(`Username "${formUsername}" sudah digunakan oleh pengurus lain!`);
        return;
      }

      const updatedUsers = users.map(u => {
        if (u.id === editingUser.id) {
          return {
            ...u,
            username: formUsername.trim(),
            pin: formPin.trim(),
            role: formRole,
            nama: formNama.trim(),
            wargaId: formRole === 'warga' ? formWargaId : undefined,
            rombongId: formRole === 'rombong' ? formRombongId : undefined
          };
        }
        return u;
      });

      onUpdateUsers(updatedUsers);
      setSuccess('Profil pengurus berhasil diperbarui!');
      resetForm();
    }
  };

  const handleDelete = (userId: string, userName: string) => {
    if (userId === currentUser?.id) {
      setError('Keamanan Sistem: Anda tidak diizinkan menghapus akun Anda sendiri saat sesi sedang berlangsung!');
      return;
    }

    if (userId === 'usr-1') {
      setError('Keamanan Sistem: Akun administrator utama tidak dapat dihapus!');
      return;
    }

    setDeleteTarget({ id: userId, nama: userName });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-[90] animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-200 text-slate-800 max-w-2xl w-full max-h-[85vh] overflow-y-auto">
        
        {/* Header */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-850 cursor-pointer p-1 rounded-full hover:bg-slate-100 transition"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-5">
          <div className="p-2.5 bg-sky-50 text-sky-600 rounded-2xl">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-lg">Manajemen Akun Pengurus RT</h3>
            <p className="text-xs text-slate-500">Tambah, ubah, atau hapus kredensial akses Admin &amp; Bendahara.</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-1.5 animate-pulse">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {/* Create/Edit Form Segment */}
        {(isAdding || editingUser) ? (
          <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl mb-6">
            <h4 className="text-xs uppercase font-black tracking-wider text-sky-700 mb-4 font-mono">
              {isAdding ? 'Tambah Pengurus RT Baru' : `Modifikasi Data: ${editingUser?.nama}`}
            </h4>
            <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans">Nama Lengkap Pengurus</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formNama}
                    onChange={(e) => setFormNama(e.target.value)}
                    placeholder="Contoh: Heri Gunawan"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-950 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans">Hak Akses / Peran Utama</label>
                <select
                  value={formRole}
                  onChange={(e) => {
                    const newRole = e.target.value as any;
                    setFormRole(newRole);
                    if (newRole !== 'warga') setFormWargaId('');
                    if (newRole !== 'rombong') setFormRombongId('');
                  }}
                  disabled={currentUser?.role !== 'admin' || editingUser?.id === 'usr-1'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-550 focus:outline-none focus:ring-2 focus:ring-sky-500 font-sans font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                >
                  <option value="bendahara">Bendahara (Hanya Pencatat Keuangan)</option>
                  <option value="admin">Administrator (Akses Penuh &amp; Kelola User)</option>
                  <option value="sekretaris">Sekretaris (Data Warga, Unduh/Upload KK &amp; KTP, Non-Keuangan)</option>
                  <option value="kolektor">Kolektor Iuran (Hanya Lihat Saldo Tunai Kolektif)</option>
                  <option value="warga">Warga RT 08 (Hanya Lihat Tagihan Sendiri)</option>
                  <option value="rombong">Rombong/Pedagang (Hanya Lihat Rombong Sendiri)</option>
                  <option value="audit">Audit (Bisa Lihat Semua Keuangan, Tanpa Input/Edit/Hapus)</option>
                </select>
              </div>

              {formRole === 'warga' && (
                <div className="md:col-span-2 p-3.5 bg-sky-50/50 border border-sky-100 rounded-2xl animate-in duration-150 slide-in-from-top-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 font-sans flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-600" />
                    <span>Hubungkan Akun dengan Data Warga RT</span>
                  </label>
                  <select
                    value={formWargaId}
                    required
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormWargaId(id);
                      const matched = wargaList.find(w => w.id === id);
                      if (matched) {
                        setFormNama(matched.nama);
                        if (!formUsername || formUsername === 'bendahara' || formUsername === 'admin') {
                          setFormUsername(matched.nama.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15));
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Pilih Warga RT 08 --</option>
                    {wargaList.filter(w => !w.isDeleted).map(w => (
                      <option key={w.id} value={w.id}>
                        {w.nama} (Blok {w.blok} No. {w.noRumah})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {formRole === 'rombong' && (
                <div className="md:col-span-2 p-3.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl animate-in duration-150 slide-in-from-top-1">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1.5 font-sans flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-650" />
                    <span>Hubungkan Akun dengan Data Rombong Pedagang</span>
                  </label>
                  <select
                    value={formRombongId}
                    required
                    onChange={(e) => {
                      const id = e.target.value;
                      setFormRombongId(id);
                      const matched = rombongList.find(r => r.id === id);
                      if (matched) {
                        setFormNama(matched.namaPemilik);
                        if (!formUsername || formUsername === 'bendahara' || formUsername === 'admin') {
                          setFormUsername(matched.namaPemilik.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15));
                        }
                      }
                    }}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-800 font-sans focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    <option value="">-- Pilih Rombong Pedagang --</option>
                    {rombongList.filter(r => !r.isDeleted).map(r => (
                      <option key={r.id} value={r.id}>
                        {r.namaPemilik} (No. {r.noLapak} - {r.lokasi})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans">Username ID Login</label>
                <input
                  type="text"
                  required
                  value={formUsername}
                  onChange={(e) => setFormUsername(e.target.value)}
                  placeholder="Contoh: bendahara"
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1 font-sans">PIN Keamanan / Sandi</label>
                <div className="relative">
                  <Key className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    required
                    value={formPin}
                    onChange={(e) => setFormPin(e.target.value)}
                    placeholder="Contoh: 654321"
                    className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-sky-500 font-mono"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer active:scale-97"
                >
                  {isAdding ? 'Selesaikan & Registrasi' : 'Simpan Pembaharuan'}
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">Daftar Pengurus Tersimpan ({users.length})</h4>
            {currentUser?.role === 'admin' && (
              <button
                onClick={startAdd}
                className="bg-sky-600 hover:bg-sky-700 text-white font-extrabold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1 transition cursor-pointer shadow-sm"
              >
                <UserPlus className="w-3.5 h-3.5 text-white" />
                <span>Daftarkan Pengurus Baru</span>
              </button>
            )}
          </div>
        )}

        {/* Mobile Swipe Hint */}
        <p className="text-[10px] text-sky-700 bg-sky-50 border border-sky-100 px-3 py-2 rounded-xl font-bold mb-3 md:hidden flex items-center gap-1.5 animate-pulse">
          <span>💡 Layar HP: Geser/swipe tabel ke kanan untuk melihat PIN, Peran, &amp; tombol Edit/Hapus.</span>
        </p>

        {/* Users Table */}
        <div className="border border-slate-200 rounded-2xl overflow-x-auto bg-white">
          <table className="w-full text-left text-xs border-collapse min-w-[580px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 font-black text-slate-600">
                <th className="p-3">Nama Lengkap</th>
                <th className="p-3">Username</th>
                <th className="p-3 font-mono">PIN</th>
                <th className="p-3 text-center">Hak Akses</th>
                <th className="p-3 text-right">Opsi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isActiveUser = u.id === currentUser?.id;
                const canDelete = currentUser?.role === 'admin' && !isActiveUser && u.id !== 'usr-1';
                const canEdit = currentUser?.role === 'admin';
                return (
                  <tr key={u.id} className={`border-b border-slate-100 hover:bg-slate-50/50 ${isActiveUser ? 'bg-sky-50/15' : ''}`}>
                    <td className="p-3">
                      <div className="font-extrabold text-slate-900 flex items-center gap-1">
                        {u.nama}
                        {isActiveUser && (
                          <span className="bg-sky-100 text-sky-700 font-bold px-1.5 py-0.5 rounded-full text-[9px] uppercase font-mono tracking-wider ml-1">
                            Aktif
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-slate-600 font-mono font-semibold">{u.username}</td>
                    <td className="p-3 text-slate-400 font-mono tracking-widest">{u.pin}</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-extrabold text-[9px] uppercase tracking-wide font-mono ${
                        u.role === 'admin' 
                          ? 'bg-indigo-50 border border-indigo-200 text-indigo-700' 
                          : u.role === 'bendahara'
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                          : u.role === 'sekretaris'
                          ? 'bg-teal-50 border border-teal-200 text-teal-700'
                          : u.role === 'kolektor'
                          ? 'bg-purple-50 border border-purple-200 text-purple-700'
                          : u.role === 'warga'
                          ? 'bg-sky-50 border border-sky-200 text-sky-700'
                          : u.role === 'audit'
                          ? 'bg-rose-50 border border-rose-200 text-rose-700'
                          : 'bg-amber-50 border border-amber-200 text-amber-700'
                      }`}>
                        {u.role === 'admin' ? 'Admin' : u.role === 'bendahara' ? 'Bendahara' : u.role === 'sekretaris' ? 'Sekretaris' : u.role === 'kolektor' ? 'Kolektor' : u.role === 'warga' ? 'Warga' : u.role === 'audit' ? 'Audit' : 'Rombong'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => {
                            if (canEdit) startEdit(u);
                          }}
                          disabled={!canEdit}
                          className={`p-1 px-2 border rounded-lg transition flex items-center gap-0.5 ${!canEdit ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 text-slate-500 cursor-pointer'}`}
                          title={!canEdit ? 'Hanya bisa diedit oleh Admin atau pemilik akun sendiri' : 'Ubah Nama, PIN, atau data login Pengurus'}
                        >
                          <Edit className="w-3 h-3" />
                          <span className="text-[10px] font-bold">Edit</span>
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => {
                              setResetTarget(u);
                              setResetNewPin('');
                              setResetError('');
                            }}
                            className="p-1 px-2 border border-slate-200 hover:border-amber-400 hover:bg-amber-50 hover:text-amber-700 text-slate-500 rounded-lg transition flex items-center gap-0.5 cursor-pointer"
                            title="Atur ulang PIN/Password pengurus jika lupa"
                          >
                            <Key className="w-3.5 h-3.5 text-amber-600" />
                            <span className="text-[10px] font-bold">Reset PIN</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(u.id, u.nama)}
                          disabled={!canDelete}
                          className={`p-1 px-2 border rounded-lg transition flex items-center gap-0.5 ${!canDelete ? 'border-slate-100 text-slate-300 bg-slate-50 cursor-not-allowed' : 'border-slate-200 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-700 text-slate-500 hover:border-rose-300 cursor-pointer'}`}
                          title={isActiveUser ? 'Tidak dapat menghapus sesi aktif Anda sendiri' : u.id === 'usr-1' ? 'Mencegah penghapusan admin utama default' : currentUser?.role !== 'admin' ? 'Hanya Administrator/Admin yang berhak menghapus akun pengurus' : 'Hapus Pengurus dari sistem Perumtas RT 08'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold">Hapus</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end pt-5 mt-5 border-t border-slate-100 no-print">
          <button
            onClick={onClose}
            className="bg-slate-900 hover:bg-black text-white font-black px-6 py-2.5 rounded-xl text-xs transition cursor-pointer active:scale-95"
          >
            Selesai Kelola Pengurus
          </button>
        </div>

      </div>

      {/* Custom Delete Confirmation Modal Overlay */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-w-sm w-full text-slate-800">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl mb-4">
                <Trash2 className="w-8 h-8 pointer-events-none" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-2">Konfirmasi Hapus Akun</h4>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Apakah Anda yakin ingin menghapus akun pengurus <strong className="text-slate-900 font-bold">"{deleteTarget.nama}"</strong>? Tindakan ini tidak dapat dibatalkan dan yang bersangkutan akan kehilangan akses login.
              </p>
              <div className="flex gap-2 w-full">
                <button
                  type="button"
                  onClick={() => {
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const filtered = users.filter(u => u.id !== deleteTarget.id);
                    onUpdateUsers(filtered);
                    setSuccess(`Akun "${deleteTarget.nama}" berhasil dihapus dari sistem.`);
                    setDeleteTarget(null);
                  }}
                  className="flex-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs transition cursor-pointer active:scale-95"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Reset PIN Confirmation Modal Overlay */}
      {resetTarget && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-in fade-in duration-200">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95 duration-150 max-w-sm w-full text-slate-800">
            <div className="flex flex-col items-stretch">
              <div className="mx-auto p-3 bg-amber-50 text-amber-600 rounded-2xl mb-4 self-center">
                <Key className="w-8 h-8 pointer-events-none" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm mb-1 text-center">Atur Ulang PIN Pengurus</h4>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider text-center font-mono mb-3">
                AKUN: {resetTarget.nama} ({resetTarget.role})
              </p>
              
              <p className="text-xs text-slate-500 leading-relaxed mb-4 text-center font-medium">
                Silakan masukkan PIN / Sandi Keamanan baru untuk user ini. Pastikan PIN minimal terdiri atas 4 karakter.
              </p>

              {resetError && (
                <div className="mb-3 p-2 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[11px] font-semibold">
                  ⚠️ {resetError}
                </div>
              )}

              <div className="mb-4">
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  PIN Keamanan Baru
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 123456"
                  value={resetNewPin}
                  onChange={(e) => setResetNewPin(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-sky-500 rounded-xl px-3 py-2 text-xs text-slate-900 font-bold font-mono focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
                <button
                  type="button"
                  onClick={() => setResetNewPin('123456')}
                  className="mt-1 text-[10px] text-sky-600 hover:text-sky-850 font-bold underline cursor-pointer inline-block"
                >
                  Gunakan PIN Default (123456)
                </button>
              </div>

              <div className="flex gap-2 w-full mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setResetTarget(null);
                    setResetNewPin('');
                    setResetError('');
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!resetNewPin.trim()) {
                      setResetError('Kolom PIN baru tidak boleh kosong!');
                      return;
                    }
                    if (resetNewPin.trim().length < 4) {
                      setResetError('PIN baru harus minimal 4 karakter!');
                      return;
                    }
                    
                    const updatedUsers = users.map(u => {
                      if (u.id === resetTarget.id) {
                        return {
                          ...u,
                          pin: resetNewPin.trim()
                        };
                      }
                      return u;
                    });
                    
                    onUpdateUsers(updatedUsers);
                    setSuccess(`PIN untuk "${resetTarget.nama}" berhasil diatur ulang menjadi: ${resetNewPin.trim()}`);
                    setResetTarget(null);
                    setResetNewPin('');
                    setResetError('');
                  }}
                  className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition cursor-pointer active:scale-95"
                >
                  Atur PIN Baru
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
