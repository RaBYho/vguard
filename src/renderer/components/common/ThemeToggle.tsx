import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../hooks/useTheme';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const mode = useThemeStore((state) => state.mode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);

  const isDark = mode === 'dark';
  const label = isDark ? 'Mode Sombre' : 'Mode Clair';
  const title = isDark ? 'Passer en mode clair' : 'Passer en mode sombre';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={title}
      title={title}
      className={`min-h-[38px] min-w-[38px] px-2.5 py-1.5 flex items-center justify-center gap-2 rounded-xl border transition-all cursor-pointer select-none focus-ring bg-zinc-100 hover:bg-zinc-200 dark:bg-[#18181B] dark:hover:bg-[#27272A] text-zinc-700 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-white border-zinc-200 dark:border-[#27272A] shadow-sm ${className}`}
    >
      {isDark ? (
        <Moon className="w-4 h-4 text-[#06B6D4]" />
      ) : (
        <Sun className="w-4 h-4 text-amber-500" />
      )}
      {showLabel && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}
