export {};

export interface ElectronAccount {
  id: string;
  label: string;
  email: string;
  color: string;
  createdAt: number;
  lastUsed: number;
}

declare global {
  interface Window {
    electronAPI?: {
      // Downloads
      selectFolder:   () => Promise<string | null>;
      setDownloadDir: (dir: string) => Promise<void>;
      getDownloadDir: () => Promise<string>;

      // Accounts
      accounts: {
        list:        () => Promise<ElectronAccount[]>;
        add:         (label: string, email: string, password: string) => Promise<ElectronAccount>;
        delete:      (id: string) => Promise<void>;
        updateLabel: (id: string, label: string) => Promise<void>;
        getPassword: (id: string) => Promise<string>;
      };

      platform:   string;
      isElectron: boolean;
    };
  }
}
