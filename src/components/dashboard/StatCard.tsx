import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: number | string;
  subtext?: string;
  icon?: LucideIcon;
  badge?: React.ReactNode;
}

export const StatCard: React.FC<StatCardProps> = React.memo(({
  label,
  value,
  subtext,
  icon: Icon,
  badge,
}) => {
  return (
    <div className="p-4 rounded-md bg-[#151519] border border-[#23232b] flex flex-col justify-between">
      <div className="flex items-center justify-between text-zinc-400 mb-2">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && (
          <span className="text-zinc-500">
            <Icon size={14} strokeWidth={1.8} />
          </span>
        )}
        {badge}
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-zinc-100 font-mono tracking-tight tabular-nums" suppressHydrationWarning>
          {value}
        </span>
        {subtext && (
          <span className="text-xs text-zinc-500 font-normal truncate" suppressHydrationWarning>
            {subtext}
          </span>
        )}
      </div>
    </div>
  );
});

StatCard.displayName = 'StatCard';
