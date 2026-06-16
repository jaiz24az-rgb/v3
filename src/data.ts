import { Balance, LedgerEntry, WargaBill, RombongBill, AppUser } from './types';

export const INITIAL_BALANCES: Balance = {
  rtTunai: 0,
  rtPettyCash: 0,
  rtBank: 0,
  rombongTunai: 0,
  rombongBank: 0
};

export const INITIAL_LEDGER: LedgerEntry[] = [];

export const INITIAL_WARGA: WargaBill[] = [];

export const INITIAL_ROMBONG: RombongBill[] = [];

export const INITIAL_USERS: AppUser[] = [
  {
    id: 'usr-1',
    username: 'admin',
    pin: '123456',
    role: 'admin',
    nama: 'Bp. Sutriadi (Ketua RT)'
  },
  {
    id: 'usr-2',
    username: 'bendahara',
    pin: '654321',
    role: 'bendahara',
    nama: 'Heri Gunawan (Bendahara)'
  },
  {
    id: 'usr-3',
    username: 'kolektor',
    pin: '112233',
    role: 'kolektor',
    nama: 'Bowo Santoso (Kolektor Iuran)'
  },
  {
    id: 'usr-4',
    username: 'audit',
    pin: '112233',
    role: 'audit',
    nama: 'Audit Internal (Pengawas)'
  }
];

