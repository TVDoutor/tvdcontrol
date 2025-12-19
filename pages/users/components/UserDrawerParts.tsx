import React from 'react';

export interface ContactItemProps {
  icon: string;
  label: string;
  value: string;
}

export const ContactItem: React.FC<ContactItemProps> = ({ icon, label, value }) => (
  <div className="flex items-center gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-lg group">
    <div className="size-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 group-hover:text-primary transition-colors">
      <span className="material-symbols-outlined text-[18px]">{icon}</span>
    </div>
    <div className="flex flex-col overflow-hidden">
      <span className="text-xs text-text-sub-light dark:text-text-sub-dark">{label}</span>
      <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark truncate">{value}</span>
    </div>
  </div>
);

export interface InventoryItemCardProps {
  icon: string;
  name: string;
  serial: string;
  date: string;
}

export const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ icon, name, serial, date }) => (
  <div className="group flex flex-col p-4 rounded-xl border border-border-light dark:border-border-dark hover:border-primary/50 transition-all bg-white dark:bg-surface-dark shadow-sm hover:shadow-md cursor-pointer">
    <div className="flex justify-between items-start mb-3">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
          <span className="material-symbols-outlined text-[20px]">{icon}</span>
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm text-text-main-light dark:text-text-main-dark">{name}</span>
          <span className="text-xs text-text-sub-light dark:text-text-sub-dark font-mono">{serial}</span>
        </div>
      </div>
      <span className="text-[10px] uppercase tracking-wider bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-1 rounded-md font-bold">
        Em Uso
      </span>
    </div>
    <div className="flex items-center justify-between pt-2 border-t border-slate-50 dark:border-slate-800">
      <p className="text-xs text-slate-400">Desde: {date}</p>
      <button className="text-xs font-medium text-red-500 hover:text-red-700 dark:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
        Devolver
      </button>
    </div>
  </div>
);

