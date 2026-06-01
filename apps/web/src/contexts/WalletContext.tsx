import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getPlayWalletBalance } from '@/lib/data';
import { useAuth } from '@/contexts/AuthContext';

type WalletContextValue = {
  balance: number | null;
  loading: boolean;
  refreshBalance: () => Promise<void>;
};

const WalletContext = createContext<WalletContextValue | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshBalance = useCallback(async () => {
    if (!user) {
      setBalance(null);
      setLoading(false);
      return;
    }
    try {
      const b = await getPlayWalletBalance();
      setBalance(b);
    } catch {
      setBalance(null);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    setLoading(true);
    refreshBalance();
  }, [refreshBalance]);

  return (
    <WalletContext.Provider value={{ balance, loading, refreshBalance }}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
}
