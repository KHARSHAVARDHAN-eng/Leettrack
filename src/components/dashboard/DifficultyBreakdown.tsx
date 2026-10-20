import React from 'react';

interface DifficultyBreakdownProps {
  easyCount: number;
  mediumCount: number;
  hardCount: number;
  total: number;
}

export const DifficultyBreakdown: React.FC<DifficultyBreakdownProps> = React.memo(({
  easyCount,
  mediumCount,
  hardCount,
  total,
}) => {
  const easyPct = total > 0 ? (easyCount / total) * 100 : 0;
  const mediumPct = total > 0 ? (mediumCount / total) * 100 : 0;
  const hardPct = total > 0 ? (hardCount / total) * 100 : 0;

  return (
    <div className="p-4 rounded-md bg-[#151519] border border-[#23232b] flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
          Difficulty Breakdown
        </span>
        <span className="text-xs font-mono text-zinc-500">
          {total} total
        </span>
      </div>

      {/* Segmented proportional bar (minimal, 4px) */}
      <div className="h-1.5 w-full bg-[#202027] rounded-full overflow-hidden flex my-2">
        {total > 0 ? (
          <>
            <div
              style={{ width: `${easyPct}%` }}
              className="bg-emerald-500/80 transition-all duration-300"
              title={`Easy: ${easyCount}`}
            />
            <div
              style={{ width: `${mediumPct}%` }}
              className="bg-amber-500/80 transition-all duration-300"
              title={`Medium: ${mediumCount}`}
            />
            <div
              style={{ width: `${hardPct}%` }}
              className="bg-rose-500/80 transition-all duration-300"
              title={`Hard: ${hardCount}`}
            />
          </>
        ) : (
          <div className="w-full bg-[#24242e]" />
        )}
      </div>

      {/* Breakdown labels and counts */}
      <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500/90 shrink-0" />
          <span className="text-zinc-400">Easy</span>
          <span className="font-mono text-zinc-200 ml-auto tabular-nums font-medium">
            {easyCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500/90 shrink-0" />
          <span className="text-zinc-400">Med</span>
          <span className="font-mono text-zinc-200 ml-auto tabular-nums font-medium">
            {mediumCount}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500/90 shrink-0" />
          <span className="text-zinc-400">Hard</span>
          <span className="font-mono text-zinc-200 ml-auto tabular-nums font-medium">
            {hardCount}
          </span>
        </div>
      </div>
    </div>
  );
});

DifficultyBreakdown.displayName = 'DifficultyBreakdown';
