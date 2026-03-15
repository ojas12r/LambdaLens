"use client";

import { useState } from "react";
import { MoreHorizontal, ArrowUpDown, ChevronUp, ChevronDown } from "lucide-react";

interface FunctionRow {
  name: string;
  currentCost: number;
  previousCost: number;
  change: number;
}

interface LeaderboardProps {
  functions: FunctionRow[];
}

type SortKey = "name" | "currentCost" | "change";
type SortDir = "asc" | "desc";

export function FunctionLeaderboard({ functions }: LeaderboardProps) {
  const [sortKey, setSortKey] = useState<SortKey>("currentCost");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  };

  const sorted = [...functions].sort((a, b) => {
    const mul = sortDir === "asc" ? 1 : -1;
    if (sortKey === "name") return mul * a.name.localeCompare(b.name);
    return mul * (a[sortKey] - b[sortKey]);
  });

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 text-aegis" />
      : <ChevronDown className="w-3 h-3 text-aegis" />;
  };

  return (
    <div className="rounded-[20px] bg-white dark:bg-[#101010] p-6 shadow-[0px_8px_24px_rgba(149,157,165,0.1)] dark:shadow-none border border-transparent dark:border-slate-800 transition-all duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Function Spend List</h3>
        <span className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 select-none">
           Last 24h
        </span>
      </div>

      {/* Table */}
      <div className="w-full overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
              <th className="pb-4 font-semibold whitespace-nowrap px-2">No</th>
              <th className="pb-4 font-semibold whitespace-nowrap px-2">
                <button onClick={() => toggleSort("name")} className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Function ID <SortIcon col="name" />
                </button>
              </th>
              <th className="pb-4 font-semibold whitespace-nowrap px-2">
                <button onClick={() => toggleSort("currentCost")} className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Current Cost <SortIcon col="currentCost" />
                </button>
              </th>
              <th className="pb-4 font-semibold whitespace-nowrap px-2">Previous Cost</th>
              <th className="pb-4 font-semibold whitespace-nowrap px-2 text-center">
                <button onClick={() => toggleSort("change")} className="inline-flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">
                  Status Trend <SortIcon col="change" />
                </button>
              </th>
              <th className="pb-4 font-semibold whitespace-nowrap px-2 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px] text-slate-700 dark:text-slate-300 font-medium">
            {sorted.map((fn, i) => {
              const changeColor =
                fn.change > 50
                  ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                  : fn.change > 0
                  ? "text-amber-500 bg-amber-50 dark:bg-amber-500/10"
                  : "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10";
                  
              const dotColor = fn.change > 50 ? "bg-red-500" : fn.change > 0 ? "bg-amber-500" : "bg-emerald-500";
              const trendLabel = fn.change > 50 ? "Critical Spike" : fn.change > 0 ? "Elevated" : "Healthy";

              return (
                <tr key={fn.name} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="py-4 px-2 text-slate-400">{i + 1}</td>
                  <td className="py-4 px-2 font-semibold text-slate-900 dark:text-white">{fn.name}</td>
                  <td className="py-4 px-2">${fn.currentCost.toFixed(2)}</td>
                  <td className="py-4 px-2 text-slate-500">${fn.previousCost.toFixed(2)}</td>
                  <td className="py-4 px-2 text-center">
                    <div className="inline-flex items-center justify-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${dotColor}`}></span>
                      <span className="font-semibold text-slate-600 dark:text-slate-300">{trendLabel}</span>
                    </div>
                  </td>
                  <td className="py-4 px-2 text-right">
                    <a
                      href="#anomalies"
                      className="text-xs text-aegis-400 hover:text-aegis-300 font-medium transition-colors"
                      title="View in Detective Findings"
                    >
                      Investigate
                    </a>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}