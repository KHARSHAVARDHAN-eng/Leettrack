import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'subtle';
  size?: 'xs' | 'sm' | 'md';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'secondary',
      size = 'sm',
      icon,
      iconPosition = 'left',
      children,
      className = '',
      ...props
    },
    ref
  ) => {
    let sizeClasses = 'text-xs px-3 py-1.5 gap-1.5 h-8';
    if (size === 'xs') {
      sizeClasses = 'text-[11px] px-2 py-1 gap-1 h-7';
    } else if (size === 'md') {
      sizeClasses = 'text-sm px-4 py-2 gap-2 h-9';
    }

    let variantClasses = 'bg-[#1a1a20] hover:bg-[#22222a] text-zinc-200 border border-[#2d2d38] active:bg-[#16161b]';

    switch (variant) {
      case 'primary':
        variantClasses =
          'bg-violet-600 hover:bg-violet-500 text-white border border-violet-500/50 active:bg-violet-700 font-medium';
        break;
      case 'outline':
        variantClasses =
          'bg-transparent hover:bg-[#1c1c23] text-zinc-300 hover:text-zinc-100 border border-[#2c2c36] active:bg-[#18181f]';
        break;
      case 'ghost':
        variantClasses =
          'bg-transparent hover:bg-[#1c1c23] text-zinc-400 hover:text-zinc-200 border-transparent active:bg-[#16161c]';
        break;
      case 'subtle':
        variantClasses =
          'bg-[#141418] hover:bg-[#1c1c22] text-zinc-300 border border-[#24242d] active:bg-[#111115]';
        break;
      case 'secondary':
      default:
        variantClasses =
          'bg-[#191920] hover:bg-[#202029] text-zinc-200 border border-[#2b2b36] active:bg-[#141419]';
        break;
    }

    return (
      <button
        ref={ref}
        className={`inline-flex items-center justify-center font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none ${sizeClasses} ${variantClasses} ${className}`}
        {...props}
      >
        {icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
        <span>{children}</span>
        {icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
