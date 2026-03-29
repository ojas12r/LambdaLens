import { ReactNode } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  label: string;
  value: string | number;
  change?: string;
  changeType?: "up" | "down" | "neutral";
  icon: ReactNode;
  color: "red" | "green" | "blue" | "amber" | "violet";
}

const colorMap = {
  red: {
    bg: "bg-red-50 dark:bg-red-500/10",
    iconColor: "text-red-500 dark:text-red-400",
  },
  green: {
    bg: "bg-emerald-50 dark:bg-emerald-500/10",
    iconColor: "text-emerald-500 dark:text-emerald-400",
  },
  blue: {
    bg: "bg-blue-50 dark:bg-blue-500/10",
    iconColor: "text-blue-500 dark:text-blue-400",
  },
  amber: {
    bg: "bg-amber-50 dark:bg-amber-500/10",
    iconColor: "text-amber-500 dark:text-amber-400",
  },
  violet: {
    bg: "bg-[rgb(240,240,250)] dark:bg-violet-500/10", // Special pastel purple like in image 
    iconColor: "text-violet-500 dark:text-violet-400",
  },
};

export function StatCard({ label, value, change, changeType, icon, color }: StatCardProps) {
  const c = colorMap[color] || colorMap.blue;

  return (
    <div
      className="relative flex flex-col justify-between rounded-[20px] bg-white dark:bg-[#101010] p-6 shadow-[0px_8px_24px_rgba(149,157,165,0.1)] dark:shadow-none border border-transparent dark:border-slate-800 transition-all duration-300 hover:shadow-[0px_12px_28px_rgba(149,157,165,0.15)] overflow-hidden animate-fade-in-up"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[28px] font-extrabold text-slate-800 dark:text-white leading-tight tracking-tight">
            {value}
          </p>
          <p className="mt-1 text-[13px] font-medium text-slate-400 dark:text-slate-500">
            {label}
          </p>
        </div>
        
        {/* Icon container - pill shaped or circular */}
        <div className={`flex w-10 h-10 items-center justify-center rounded-2xl ${c.bg} ${c.iconColor}`}>
          {icon}
        </div>
      </div>

      {change && (
        <div className="mt-6 flex items-center gap-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-4">
          {changeType === "up" && <TrendingUp className="w-3.5 h-3.5 text-emerald-500" strokeWidth={3} />}
          {changeType === "down" && <TrendingDown className="w-3.5 h-3.5 text-red-500" strokeWidth={3} />}
          {changeType === "neutral" && <Minus className="w-3.5 h-3.5 text-slate-400" strokeWidth={3} />}
          
          <span
            className={`text-xs font-semibold ${
              changeType === "up"
                ? "text-emerald-500 dark:text-emerald-400"
                : changeType === "down"
                ? "text-red-500 dark:text-red-400"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
             {changeType === "neutral" ? "" : change.split(" ")[0]}
          </span>
          <span className="text-xs text-slate-400 ml-1">
             {changeType !== "neutral" && change.substring(change.indexOf(" ") + 1)}
             {changeType === "neutral" && change}
          </span>
        </div>
      )}
    </div>
  );
}
