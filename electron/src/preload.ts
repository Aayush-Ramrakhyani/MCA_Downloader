/*
 * preload.ts
 * Electron preload script: runs in a privileged context with access to ipcRenderer
 * and exposes a safe, typed window.electronAPI surface to the renderer via
 * contextBridge, forming the IPC bridge between the UI and the main process.
 */
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', { // exposed as window.electronAPI in the renderer
  // ─── Downloads ───────────────────────────────────────────
  selectFolder:    (): Promise<string | null> => ipcRenderer.invoke('dialog:selectFolder'),
  setDownloadDir:  (dir: string): Promise<void> => ipcRenderer.invoke('app:setDownloadDir', dir),
  getDownloadDir:  (): Promise<string> => ipcRenderer.invoke('app:getDownloadDir'),

  // ─── Accounts ────────────────────────────────────────────
  accounts: {
    list:        (): Promise<import('./accounts').AccountPublic[]> => ipcRenderer.invoke('accounts:list'),
    add:         (label: string, email: string, password: string) => ipcRenderer.invoke('accounts:add', label, email, password),
    delete:      (id: string): Promise<void> => ipcRenderer.invoke('accounts:delete', id),
    updateLabel: (id: string, label: string): Promise<void> => ipcRenderer.invoke('accounts:updateLabel', id, label),
    getPassword: (id: string): Promise<string> => ipcRenderer.invoke('accounts:getPassword', id),
  },

  platform:   process.platform,
  isElectron: true,
});
