import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  markClassName?: string;
  textClassName?: string;
  showWordmark?: boolean;
  variant?: "default" | "light";
  size?: "sm" | "md" | "lg";
};

const markSizes = {
  sm: "h-7 w-7",
  md: "h-9 w-9",
  lg: "h-12 w-12",
};

const textSizes = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-2xl",
};

export function BrandMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      role="img"
      aria-label="JobPA"
      className={cn("shrink-0", className)}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="jobpa-mark-bg" x1="7" y1="6" x2="57" y2="59" gradientUnits="userSpaceOnUse">
          <stop stopColor="#0EA5E9" />
          <stop offset="0.54" stopColor="#22D3EE" />
          <stop offset="1" stopColor="#34D399" />
        </linearGradient>
        <linearGradient id="jobpa-agent-face" x1="17" y1="14" x2="48" y2="49" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#E0F2FE" />
        </linearGradient>
        <filter id="jobpa-mark-glow" x="-20%" y="-20%" width="140%" height="140%" colorInterpolationFilters="sRGB">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.13 0 0 0 0 0.83 0 0 0 0 0.97 0 0 0 0.35 0" />
          <feBlend in="SourceGraphic" mode="screen" />
        </filter>
      </defs>
      <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#jobpa-mark-bg)" />
      <path d="M15 33C11.8 33 9.2 35.6 9.2 38.8V41.5" stroke="#E0F2FE" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
      <path d="M49 33C52.2 33 54.8 35.6 54.8 38.8V41.5" stroke="#E0F2FE" strokeWidth="3.2" strokeLinecap="round" opacity="0.95" />
      <rect x="15" y="16" width="34" height="32" rx="13" fill="url(#jobpa-agent-face)" filter="url(#jobpa-mark-glow)" />
      <path d="M22 16L26.2 10.8" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <rect x="21.5" y="26.4" width="11.5" height="9.2" rx="3.2" stroke="#0F172A" strokeWidth="2.4" />
      <rect x="35" y="26.4" width="11.5" height="9.2" rx="3.2" stroke="#0F172A" strokeWidth="2.4" />
      <path d="M33 31H35" stroke="#0F172A" strokeWidth="2.4" strokeLinecap="round" />
      <circle cx="27.2" cy="31" r="1.8" fill="#0F172A" />
      <circle cx="40.7" cy="31" r="1.8" fill="#0F172A" />
      <path d="M28.5 39C31 41 35 41 37.5 39" stroke="#0F172A" strokeWidth="2.7" strokeLinecap="round" />
      <path d="M17 25H11.5" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
      <path d="M52.5 25H47" stroke="#0F172A" strokeWidth="3.5" strokeLinecap="round" opacity="0.5" />
      <path d="M46 44L53 51" stroke="#0F172A" strokeWidth="3" strokeLinecap="round" opacity="0.35" />
      <circle cx="54.5" cy="52.5" r="3.5" fill="#F8FAFC" />
      <path d="M32 48V54" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
      <path d="M26 54H38" stroke="#F8FAFC" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

export function BrandLogo({
  className,
  markClassName,
  textClassName,
  showWordmark = true,
  variant = "default",
  size = "md",
}: BrandLogoProps) {
  const isLight = variant === "light";

  return (
    <span className={cn("inline-flex min-w-0 items-center gap-2.5", className)}>
      <BrandMark className={cn(markSizes[size], markClassName)} />
      {showWordmark && (
        <span className={cn("min-w-0 font-black leading-none tracking-tight", textSizes[size], textClassName)}>
          <span className={cn(isLight ? "text-white" : "text-foreground")}>Job</span>
          <span className="text-cyan-400">PA</span>
        </span>
      )}
    </span>
  );
}
