import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'path';
import { spawn, ChildProcess } from 'child_process';
import fs from 'fs';
import crypto from 'crypto';
import {
  listAccounts, addAccount, deleteAccount,
  getDecryptedPassword, touchLastUsed, updateLabel,
} from './accounts';

// Auto-generate a persistent JWT secret per installation
function getOrCreateJwtSecret(): string {
  const secretFile = path.join(app.getPath('userData'), 'jwt.secret');
  if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, 'utf-8').trim();
  const secret = crypto.randomBytes(64).toString('hex');
  fs.writeFileSync(secretFile, secret, 'utf-8');
  return secret;
}

const isDev = !app.isPackaged;
const BACKEND_PORT = 4000;
const FRONTEND_PORT = 5173;

let mainWindow: BrowserWindow | null = null;
let backendProcess: ChildProcess | null = null;
let downloadDir = path.join(app.getPath('userData'), 'downloads');

// ─── Backend ──────────────────────────────────────────────────

function startBackend(): Promise<void> {
  return new Promise((resolve, reject) => {
    const backendEntry = isDev
      ? path.join(__dirname, '..', '..', 'backend', 'dist', 'index.js')
      : path.join(process.resourcesPath, 'backend', 'dist', 'index.js');

    if (!fs.existsSync(backendEntry)) {
      console.warn(`Backend not built. Run npm run build:backend`);
      resolve();
      return;
    }

    backendProcess = spawn(process.execPath, [backendEntry], {
      env: {
        ...process.env,
        ELECTRON_RUN_AS_NODE: '1',
        PORT: String(BACKEND_PORT),
        NODE_ENV: isDev ? 'development' : 'production',
        DOWNLOADS_DIR: downloadDir,
        DB_PATH: path.join(app.getPath('userData'), 'db.json'),
        JWT_SECRET: getOrCreateJwtSecret(),
        FINANVO_BASE_URL: 'https://api5.finanvo.in',
        FINANVO_TOKEN_PATH: 'data.token',
        CLIENT_URL: isDev
          ? `http://localhost:${FRONTEND_PORT}`
          : `http://localhost:${BACKEND_PORT}`,
      },
      cwd: isDev
        ? path.join(__dirname, '..', '..', 'backend')
        : path.join(process.resourcesPath, 'backend'),
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    backendProcess.stdout?.on('data', (data: Buffer) => {
      const line = data.toString();
      console.log('[backend]', line.trim());
      if (line.includes(`port ${BACKEND_PORT}`) || line.includes('listening')) resolve();
    });

    backendProcess.stderr?.on('data', (d: Buffer) =>
      console.error('[backend:err]', d.toString().trim()));

    backendProcess.on('error', reject);
    setTimeout(resolve, 3000);
  });
}

// ─── Window ───────────────────────────────────────────────────

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 960,
    minHeight: 600,
    title: 'MCA Document Downloader',
    backgroundColor: '#0f1117',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.loadURL(
    isDev ? `http://localhost:${FRONTEND_PORT}` : `http://localhost:${BACKEND_PORT}`,
  );

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
    if (isDev) mainWindow?.webContents.openDevTools({ mode: 'detach' });
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http')) shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// ─── IPC: Downloads ───────────────────────────────────────────

ipcMain.handle('dialog:selectFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow!, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Download Folder',
    defaultPath: downloadDir,
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

ipcMain.handle('app:setDownloadDir', (_e, dir: string) => { downloadDir = dir; });
ipcMain.handle('app:getDownloadDir', () => downloadDir);

// ─── IPC: Accounts ────────────────────────────────────────────

ipcMain.handle('accounts:list', () => listAccounts());

ipcMain.handle('accounts:add', (_e, label: string, email: string, password: string) => {
  return addAccount(label, email, password);
});

ipcMain.handle('accounts:delete', (_e, id: string) => deleteAccount(id));

ipcMain.handle('accounts:updateLabel', (_e, id: string, label: string) => updateLabel(id, label));

// Returns the plain password for a given account ID so the renderer
// can call the backend's /api/auth/login on behalf of that account.
// The password never travels as plain text beyond this process boundary
// — the renderer immediately POSTs it to localhost (our own backend).
ipcMain.handle('accounts:getPassword', (_e, id: string) => {
  touchLastUsed(id);
  return getDecryptedPassword(id);
});

// ─── App lifecycle ────────────────────────────────────────────

app.whenReady().then(async () => {
  if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

  await startBackend();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  backendProcess?.kill();
  if (process.platform !== 'darwin') app.quit();
});

app.on('before-quit', () => { backendProcess?.kill(); });
