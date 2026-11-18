import React from 'react';

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  actions?: React.ReactNode;
}

export function EmptyState({ icon, title, description, actions }: EmptyStateProps) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center select-none min-h-[320px]">
      <div className="w-16 h-16 rounded-2xl bg-zinc-200/60 dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700/60 flex items-center justify-center text-zinc-500 dark:text-zinc-400 mb-4 shadow-sm">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-zinc-800 dark:text-zinc-200 mb-1">
        {title}
      </h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {actions && (
        <div className="flex flex-wrap items-center justify-center gap-3">
          {actions}
        </div>
      )}
    </div>
  );
}
