interface VGuardLogoProps {
  size?: number;
  variant?: 'full' | 'icon';
  className?: string;
  animate?: boolean;
}

export function VGuardLogo({
  size = 36,
  variant = 'full',
  className = '',
  animate = false,
}: VGuardLogoProps) {
  return (
    <div className={`inline-flex items-center gap-3 select-none ${className}`}>
      <div
        className={`relative flex items-center justify-center shrink-0 ${
          animate ? 'animate-pulse' : ''
        }`}
        style={{ width: size, height: size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(6,182,212,0.4)]"
        >
          <defs>
            <linearGradient id="vguardStitchGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#06B6D4" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
          </defs>

          {/* Contour bouclier principal */}
          <path
            d="M50 8 L82 22 C82 56 50 88 50 88 C50 88 18 56 18 22 Z"
            fill="none"
            stroke="url(#vguardStitchGrad)"
            strokeWidth="7"
            strokeLinejoin="round"
          />

          {/* Cœur intérieur du bouclier */}
          <path
            d="M50 16 C68 16 75 32 75 48 C75 66 50 80 50 80 C50 80 25 66 25 48 C25 32 32 16 50 16 Z"
            fill="#09090B"
            opacity="0.95"
          />

          {/* Corps du cadenas */}
          <rect x="39" y="44" width="22" height="18" rx="4" fill="#F8FAFC" />

          {/* Anse du cadenas */}
          <path
            d="M43 44 V37 C43 32.5 46.5 29 50 29 C53.5 29 57 32.5 57 37 V44"
            fill="none"
            stroke="#F8FAFC"
            strokeWidth="4.5"
            strokeLinecap="round"
          />

          {/* Trou de serrure */}
          <circle cx="50" cy="51" r="2.2" fill="#09090B" />
          <path d="M50 53.2 V56.5" stroke="#09090B" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>

      {variant === 'full' && (
        <div className="flex flex-col">
          <span className="text-base font-bold tracking-tight text-zinc-900 dark:text-[#F8FAFC] leading-none">
            VGuard
          </span>
          <span className="text-[10px] uppercase font-mono tracking-wider text-[#06B6D4] font-semibold mt-1">
            Local Vault
          </span>
        </div>
      )}
    </div>
  );
}
