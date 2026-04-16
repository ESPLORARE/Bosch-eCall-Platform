import React from 'react';
import { cn } from './Layout';

interface BoschLogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  stacked?: boolean;
}

export default function BoschLogo({
  className,
  iconClassName,
  textClassName,
  stacked = false,
}: BoschLogoProps) {
  return (
    <div className={cn('flex items-center', stacked ? 'flex-col gap-3' : 'gap-3', className)}>
      <svg
        viewBox="0 0 80 80"
        aria-hidden="true"
        className={cn('h-10 w-10 shrink-0 text-black', iconClassName)}
        fill="none"
      >
        <circle cx="40" cy="40" r="31" stroke="currentColor" strokeWidth="4.5" />
        <path
          d="M26 22 C21 26, 18.5 32, 18.5 40 C18.5 48, 21 54, 26 58"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path
          d="M54 22 C59 26, 61.5 32, 61.5 40 C61.5 48, 59 54, 54 58"
          stroke="currentColor"
          strokeWidth="4.5"
          strokeLinecap="round"
        />
        <path d="M26 22 V58" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M54 22 V58" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
        <path d="M26 40 H54" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" />
      </svg>

      <span
        className={cn(
          'font-black uppercase tracking-tight text-[#E20015]',
          stacked ? 'text-3xl' : 'text-[2rem] leading-none',
          textClassName,
        )}
      >
        BOSCH
      </span>
    </div>
  );
}
