import { useToastStore, ToastType } from '../../stores/toast-store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts);
  const removeToast = useToastStore((state) => state.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none select-none"
    >
      {toasts.map((item) => {
        const isSuccess = item.type === 'success';
        const isError = item.type === 'error';

        return (
          <div
            key={item.id}
            role="status"
            className="pointer-events-auto flex items-start justify-between gap-3 p-3.5 rounded-2xl bg-white/95 dark:bg-[#121215]/95 backdrop-blur-xl border border-zinc-200 dark:border-[#27272A] shadow-lg dark:shadow-2xl shadow-black/40 text-zinc-900 dark:text-white transition-all animate-slide-up"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                  isSuccess
                    ? 'bg-[#10B981]/10 text-[#059669] dark:text-[#10B981] border-[#10B981]/30'
                    : isError
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                    : 'bg-[#06B6D4]/10 text-[#0891B2] dark:text-[#06B6D4] border-[#06B6D4]/30'
                }`}
              >
                {isSuccess ? (
                  <CheckCircle2 className="w-4 h-4 stroke-[2.2]" />
                ) : isError ? (
                  <AlertCircle className="w-4 h-4 stroke-[2.2]" />
                ) : (
                  <Info className="w-4 h-4 stroke-[2.2]" />
                )}
              </div>

              <div className="min-w-0 pt-0.5">
                <p className="text-xs font-semibold leading-tight tracking-tight">
                  {item.message}
                </p>
                {item.description && (
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 leading-snug">
                    {item.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => removeToast(item.id)}
              className="text-zinc-400 hover:text-zinc-700 dark:hover:text-white p-1 rounded-lg transition shrink-0 cursor-pointer"
              title="Fermer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
