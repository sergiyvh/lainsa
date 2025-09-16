// src/hooks/useHasSettingsAccess.js
import { useState, useEffect } from 'react';
import { getData } from '../services/storageService';

export default function useHasSettingsAccess(user) {
  const [canAccess, setCanAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!user) {
        if (alive) {
          setCanAccess(false);
          setLoading(false);
        }
        return;
      }
      if (user.role === 'admin') {
        if (alive) {
          setCanAccess(true);
          setLoading(false);
        }
        return;
      }
      if (user.role === 'technician') {
        try {
          const prefs = await getData('app_prefs');
          const allowTech = !!prefs?.techCanOpenSettings;
          if (alive) {
            setCanAccess(allowTech);
          }
        } catch {
          if (alive) {
            setCanAccess(false); // За замовчуванням, якщо налаштування не знайдено
          }
        } finally {
            if (alive) {
                setLoading(false);
            }
        }
        return;
      }
      
      // Для всіх інших ролей
      if (alive) {
          setCanAccess(false);
          setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, [user]);

  return { canAccess, loading };
}