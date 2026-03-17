import React from 'react';

interface ActivityBalanceBarProps {
  attackSeconds: number;
  defenseSeconds: number;
  label?: string;
  className?: string;
}

export const ActivityBalanceBar: React.FC<ActivityBalanceBarProps> = ({
  attackSeconds,
  defenseSeconds,
  label,
  className = '',
}) => {
  const totalActive = attackSeconds + defenseSeconds;
  const attackPct = totalActive > 0 ? (attackSeconds / totalActive) * 100 : 50;
  const defensePct = totalActive > 0 ? (defenseSeconds / totalActive) * 100 : 50;

  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `${sec}s`;
  };

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{label}</span>
          <span>Ενεργός: {formatSec(totalActive)}</span>
        </div>
      )}
      <div className="relative h-5 w-full bg-muted border border-border flex overflow-hidden">
        {/* Defense (left - blue) */}
        <div
          className="h-full bg-blue-500/80 flex items-center justify-start px-1 transition-all duration-300"
          style={{ width: `${defensePct}%` }}
        >
          {defensePct > 15 && (
            <span className="text-[9px] text-white font-bold whitespace-nowrap">
              🛡 {Math.round(defensePct)}%
            </span>
          )}
        </div>
        {/* Attack (right - red) */}
        <div
          className="h-full bg-red-500/80 flex items-center justify-end px-1 transition-all duration-300"
          style={{ width: `${attackPct}%` }}
        >
          {attackPct > 15 && (
            <span className="text-[9px] text-white font-bold whitespace-nowrap">
              ⚔ {Math.round(attackPct)}%
            </span>
          )}
        </div>
        {/* Center marker */}
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/60" />
      </div>
      <div className="flex justify-between text-[9px] text-muted-foreground">
        <span>Άμυνα ({formatSec(defenseSeconds)})</span>
        <span>Επίθεση ({formatSec(attackSeconds)})</span>
      </div>
    </div>
  );
};
