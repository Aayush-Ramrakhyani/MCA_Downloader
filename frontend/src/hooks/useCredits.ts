import { useState, useEffect, useCallback } from 'react';
import { accountApi, type CreditBalance } from '../services/api';

export function useCredits() {
  const [credits, setCredits] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    accountApi.getCredits()
      .then(res => setCredits(res.data.data ?? null))
      .catch(() => setCredits(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { credits, loading, refresh };
}
