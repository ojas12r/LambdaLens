"use client";

interface HealthRingProps {
  score: number; // 0-100
  label: string;
}

export function HealthRing({ score, label }: HealthRingProps) {
  const radius = 45;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  const color =
    score >= 80 ? "text-emerald-400" : score >= 50 ? "text-amber-400" : "text-red-400";
  const strokeColor =
    score >= 80 ? "#34d399" : score >= 50 ? "#fbbf24" : "#f87171";
  const bgLabel =
    score >= 80 ? "Healthy" : score >= 50 ? "Warning" : "Critical";

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width="120" height="120" className="-rotate-90">
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-slate-700/50"
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke={strokeColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="animate-ring"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-2xl font-bold ${color}`}>{score}</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-wider">
            {bgLabel}
          </span>
        </div>
      </div>
      <span className="mt-2 text-xs text-slate-400 font-medium">{label}</span>
    </div>
  );
}