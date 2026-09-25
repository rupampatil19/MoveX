import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import API from '../api';

const TrophyContext = createContext(null);

export const TrophyProvider = ({ children }) => {
  const [balance, setBalance] = useState(null);   // null = loading
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadedOnce = useRef(false);

  const fetchBalance = useCallback(async () => {
    const token = localStorage.getItem('movex_token');
    if (!token) {
      setBalance(null);
      setLoading(false);
      return;
    }
    try {
      setError(null);
      const { data } = await API.get('/rewards/balance', {
        headers: { 'x-auth-token': token },
      });
      setBalance(data?.trophyPoints ?? 0);
      loadedOnce.current = true;
    } catch (err) {
      if (err.response?.status === 401) setBalance(null);
      else if (!loadedOnce.current) setBalance(0);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBalance(); }, [fetchBalance]);

  useEffect(() => {
    const onAuth = () => { setLoading(true); fetchBalance(); };
    const onTrophy = () => { fetchBalance(); };
    window.addEventListener('auth:changed', onAuth);
    window.addEventListener('trophy:changed', onTrophy);
    return () => {
      window.removeEventListener('auth:changed', onAuth);
      window.removeEventListener('trophy:changed', onTrophy);
    };
  }, [fetchBalance]);

  const applyBalance = useCallback((newBalance) => {
    if (typeof newBalance === 'number') setBalance(newBalance);
    window.dispatchEvent(new CustomEvent('trophy:changed'));
  }, []);

  return (
    <TrophyContext.Provider value={{ balance, loading, error, refresh: fetchBalance, applyBalance }}>
      {children}
    </TrophyContext.Provider>
  );
};

export const useTrophy = () => {
  const ctx = useContext(TrophyContext);
  if (!ctx) throw new Error('useTrophy must be used inside <TrophyProvider>');
  return ctx;
};