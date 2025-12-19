import React from 'react';

interface AddItemCancelModalProps {
  onClose: () => void;
  onConfirm: () => void;
}

const AddItemCancelModal: React.FC<AddItemCancelModalProps> = ({ onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-slide-up">
        <div className="p-6 text-center">
          <div className="size-14 mx-auto rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-[28px]">warning</span>
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Descartar alterações?</h3>
          <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
            Você possui dados não salvos neste formulário. Se sair agora, todas as informações serão perdidas.
          </p>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Continuar Editando
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 py-2.5 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 transition-colors shadow-sm"
            >
              Sim, Descartar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddItemCancelModal;

