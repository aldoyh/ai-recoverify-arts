import React from 'react';

export interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  message: string;
  items?: string[];
  confirmLabel: string;
  cancelLabel: string;
  isDestructive?: boolean;
  isBusy?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface ConfirmModalProps {
  dialog: ConfirmDialogState | null;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ dialog, onCancel }) => {
  if (!dialog || !dialog.isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div className="w-full max-w-md bg-brand-red-900 border border-brand-red-600 rounded-xl shadow-2xl p-6 text-white">
        <div className="flex items-start gap-3">
          <div
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
              dialog.isDestructive ? 'bg-red-600/30 text-red-200' : 'bg-brand-red-700 text-red-100'
            }`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 id="confirm-modal-title" className="text-lg font-bold text-white">
              {dialog.title}
            </h3>
            <p className="mt-2 text-sm text-red-100 leading-relaxed">{dialog.message}</p>
            {dialog.items && dialog.items.length > 0 && (
              <ul className="mt-3 bg-brand-red-800/70 border border-brand-red-700 rounded-lg p-2.5 text-xs text-red-100 space-y-1 max-h-32 overflow-y-auto">
                {dialog.items.map((item, idx) => (
                  <li key={idx} className="truncate font-medium">
                    • {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={dialog.isBusy}
            className="px-4 py-2 rounded-lg bg-brand-red-800 hover:bg-brand-red-700 text-red-100 font-medium text-sm transition disabled:opacity-50"
          >
            {dialog.cancelLabel}
          </button>
          <button
            type="button"
            onClick={dialog.onConfirm}
            disabled={dialog.isBusy}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition disabled:opacity-50 ${
              dialog.isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-md'
                : 'bg-white hover:bg-red-50 text-brand-red-800 shadow-md'
            }`}
          >
            {dialog.isBusy ? '...' : dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
