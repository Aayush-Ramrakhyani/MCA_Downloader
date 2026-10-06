import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
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
