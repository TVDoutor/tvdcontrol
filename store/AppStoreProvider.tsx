import React from 'react';
import { UsersStoreProvider } from './UsersStore';
import { InventoryStoreProvider } from './InventoryStore';
import { AuthStoreProvider } from './AuthStore';

export function AppStoreProvider({ children }: { children: React.ReactNode }) {
  // Compose providers here as the app grows (AuthStore, InventoryStore, etc).
  return (
    <AuthStoreProvider>
      <UsersStoreProvider>
        <InventoryStoreProvider>{children}</InventoryStoreProvider>
      </UsersStoreProvider>
    </AuthStoreProvider>
  );
}


