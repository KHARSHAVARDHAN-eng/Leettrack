import React from 'react';
import { Difficulty } from '@/types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: Difficulty | 'neutral' | 'violet' | 'subtle';
  size?: 'xs' | 'sm';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'xs',
  className = '',
}) => {
  const sizeClasses = size === 'xs' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  let variantClasses = 'bg-[#1e1e24] text-zinc-300 border-[#2d2d37]';

  switch (variant) {
    case 'Easy':
      variantClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      break;
    case 'Medium':
      variantClasses = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      break;
    case 'Hard':
      variantClasses = 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      break;
    case 'violet':
      variantClasses = 'bg-violet-500/10 text-violet-300 border-violet-500/25';
      break;
    case 'subtle':
      variantClasses = 'bg-transparent text-zinc-400 border-[#282832]';
      break;
    case 'neutral':
    default:
      variantClasses = 'bg-[#1a1a20] text-zinc-300 border-[#282833]';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium tracking-tight border rounded-md font-mono ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
