import React from 'react';
import type { AddItemFormData } from '../constants';

interface AddItemSuccessModalProps {
  formData: AddItemFormData;
  categoryIcon: string;
  onGoToDetails: () => void;
  onAddAnother: () => void;
}

const AddItemSuccessModal: React.FC<AddItemSuccessModalProps> = ({ formData, categoryIcon, onGoToDetails, onAddAnother }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-surface-dark rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-border-light dark:border-border-dark flex flex-col transform animate-slide-up">
        <div className="flex flex-col items-center justify-center p-8 pb-6 text-center bg-white dark:bg-surface-dark relative">
          <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-50 dark:ring-emerald-900/10 animate-bounce">
            <span className="material-symbols-outlined text-[32px]">check_circle</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight">Item Registrado!</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">O novo ativo foi adicionado ao inventário.</p>
          <div className="absolute bottom-0 left-0 h-1 bg-emerald-500 animate-[width_2s_linear_forwards] w-0"></div>
        </div>

        <div className="px-8 pb-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg border border-slate-100 dark:border-slate-600 text-primary">
                  <span className="material-symbols-outlined text-[20px]">{categoryIcon}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-wide">Categoria</span>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{formData.category}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Nome / Modelo</span>
                <span
                  className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block"
                  title={formData.name}
                >
                  {formData.name}
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block mb-0.5">Fabricante</span>
                <span className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate block">
                  {formData.manufacturer || '-'}
                </span>
              </div>
            </div>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4 italic">Redirecionando para detalhes do item...</p>
        </div>

        <div className="p-6 pt-0 flex flex-col gap-3">
          <button
            onClick={onGoToDetails}
            className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-bold shadow-sm shadow-primary/30 transition-all flex items-center justify-center gap-2"
          >
            Ver Detalhes Agora
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>

          <button
            onClick={onAddAnother}
            className="w-full py-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 text-sm font-medium transition-colors"
          >
            Cancelar Redirecionamento e Adicionar Outro
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddItemSuccessModal;

