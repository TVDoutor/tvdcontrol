import React from 'react';
import { UsersStoreProvider } from './UsersStore';
import { InventoryStoreProvider } from './InventoryStore';
import { AuthStoreProvider } from './AuthStore';
import { CargoStoreProvider } from './CargoStore';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  return (
    <AuthStoreProvider>
      <CargoStoreProvider>
        <UsersStoreProvider>
          <InventoryStoreProvider>{children}</InventoryStoreProvider>
        </UsersStoreProvider>
      </CargoStoreProvider>
    </AuthStoreProvider>
  );
}


