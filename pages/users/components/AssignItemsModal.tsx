import React, { useMemo, useState } from 'react';
import type { InventoryItem, User } from '../../../types';

interface AssignItemsModalProps {
  user: User;
  items: InventoryItem[];
  onClose: () => void;
  onConfirm: (itemIds: string[]) => void;
}

const AssignItemsModal: React.FC<AssignItemsModalProps> = ({ user, items, onClose, onConfirm }) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const availableItems = useMemo(
    () => items.filter((i) => !i.assignedTo),
    [items]
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-border-light dark:border-border-dark">
        <div className="p-5 border-b border-border-light dark:border-border-dark flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-text-main-light dark:text-text-main-dark">Atribuir Itens</h3>
            <p className="text-xs text-text-sub-light dark:text-text-sub-dark">
              Usuário: {user.name}
            </p>
          </div>
          <button onClick={onClose} className="text-text-sub-light hover:text-text-main-light">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="p-5 max-h-[60vh] overflow-y-auto">
          {availableItems.length === 0 ? (
            <div className="text-sm text-text-sub-light dark:text-text-sub-dark">
              Nenhum item disponível para alocação.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {availableItems.map((item) => (
                <label
                  key={item.id}
                  className="flex items-center gap-3 rounded-lg border border-border-light dark:border-border-dark bg-slate-50 dark:bg-slate-800/50 px-3 py-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(item.id)}
                    onChange={() => toggle(item.id)}
                    className="w-4 h-4"
                  />
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark truncate">
                      {item.name || item.model}
                    </span>
                    <span className="text-xs text-text-sub-light dark:text-text-sub-dark truncate">
                      {item.serialNumber}
                    </span>
                  </div>
                </label>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border-light dark:border-border-dark bg-slate-50 dark:bg-surface-dark flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium text-text-sub-light hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={() => onConfirm(selectedIds)}
            disabled={selectedIds.length === 0}
            className="px-5 py-2 rounded-lg text-sm font-bold text-white bg-primary hover:bg-primary/90 disabled:opacity-60"
          >
            Atribuir Selecionados
          </button>
        </div>
      </div>
    </div>
  );
};

export default AssignItemsModal;
