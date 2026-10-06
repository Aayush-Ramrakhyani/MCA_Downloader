import { safeStorage, app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface Account {
  id: string;
  label: string;
  email: string;
  encryptedPassword: string; // base64, encrypted via OS DPAPI
  color: string;             // avatar background color
  createdAt: number;
  lastUsed: number;
}

export interface AccountPublic extends Omit<Account, 'encryptedPassword'> {}

const COLORS = [
  '#4f8ef7', '#e05050', '#2eb872', '#f5a623',
  '#9b59b6', '#e67e22', '#1abc9c', '#e91e63',
];

function accountsFilePath(): string {
  return path.join(app.getPath('userData'), 'accounts.json');
}

function readAll(): Account[] {
  const p = accountsFilePath();
  if (!fs.existsSync(p)) return [];
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as Account[];
  } catch {
    return [];
  }
}

function writeAll(accounts: Account[]): void {
  fs.writeFileSync(accountsFilePath(), JSON.stringify(accounts, null, 2), 'utf-8');
}

export function listAccounts(): AccountPublic[] {
  return readAll().map(({ encryptedPassword: _, ...pub }) => pub);
}

export function addAccount(label: string, email: string, password: string): AccountPublic {
  const accounts = readAll();

  if (accounts.find(a => a.email === email)) {
    throw new Error(`Account with email "${email}" already exists.`);
  }

  const encrypted = safeStorage.isEncryptionAvailable()
    ? safeStorage.encryptString(password).toString('base64')
    : Buffer.from(password, 'utf-8').toString('base64'); // fallback for dev

  const account: Account = {
    id: crypto.randomUUID(),
    label: label.trim() || email,
    email,
    encryptedPassword: encrypted,
    color: COLORS[accounts.length % COLORS.length],
    createdAt: Date.now(),
    lastUsed: 0,
  };

  accounts.push(account);
  writeAll(accounts);
  const { encryptedPassword: _, ...pub } = account;
  return pub;
}

export function deleteAccount(id: string): void {
  const accounts = readAll().filter(a => a.id !== id);
  writeAll(accounts);
}

export function getDecryptedPassword(id: string): string {
  const account = readAll().find(a => a.id === id);
  if (!account) throw new Error('Account not found');

  const buf = Buffer.from(account.encryptedPassword, 'base64');
  return safeStorage.isEncryptionAvailable()
    ? safeStorage.decryptString(buf)
    : buf.toString('utf-8');
}

export function touchLastUsed(id: string): void {
  const accounts = readAll();
  const acc = accounts.find(a => a.id === id);
  if (acc) { acc.lastUsed = Date.now(); writeAll(accounts); }
}

export function updateLabel(id: string, label: string): void {
  const accounts = readAll();
  const acc = accounts.find(a => a.id === id);
  if (acc) { acc.label = label; writeAll(accounts); }
}
