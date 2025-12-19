import React from 'react';

interface UserDeleteModalProps {
  userName?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const UserDeleteModal: React.FC<UserDeleteModalProps> = ({ userName, onCancel, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-in zoom-in-95 duration-200">
        <div className="p-6 text-center">
          <div className="size-14 mx-auto rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px]">delete_forever</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Excluir Usuário?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Você está prestes a excluir <strong>{userName}</strong>. Esta ação não pode ser desfeita e removerá todo o
            histórico e atribuições.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
            >
              Sim, Excluir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDeleteModal;

