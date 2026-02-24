import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getCargoService } from '../services/cargoService';
import { useAuthStore } from './AuthStore';

type CargoStoreValue = {
  cargos: { id: string; name: string }[];
  jobTitles: string[];
  isLoading: boolean;
  refresh: () => Promise<void>;
};

const CargoStoreContext = createContext<CargoStoreValue | null>(null);

export function CargoStoreProvider({ children }: { children: React.ReactNode }) {
  const service = useMemo(() => getCargoService(), []);
  const { user } = useAuthStore();
  const userId = user?.id;
  const [cargos, setCargos] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!userId) {
      setCargos([]);
      setIsLoading(false);
      return;
    }
    try {
      setIsLoading(true);
      const data = await service.list();
      setCargos(data);
    } catch {
      setCargos([]);
    } finally {
      setIsLoading(false);
    }
  }, [service, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const jobTitles = useMemo(() => cargos.map((c) => c.name), [cargos]);

  const value: CargoStoreValue = useMemo(
    () => ({ cargos, jobTitles, isLoading, refresh }),
    [cargos, jobTitles, isLoading, refresh]
  );

  return <CargoStoreContext.Provider value={value}>{children}</CargoStoreContext.Provider>;
}

export function useCargoStore(): CargoStoreValue {
  const ctx = useContext(CargoStoreContext);
  if (!ctx) throw new Error('useCargoStore must be used within CargoStoreProvider');
  return ctx;
}
