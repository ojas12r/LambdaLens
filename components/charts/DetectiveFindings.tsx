"use client";

import { Fragment, useState } from "react";
import type { AnomalyRecord } from "@/lib/types";
import { ChevronDown, MoreHorizontal, ArrowUpDown } from "lucide-react";

interface DetectiveFindingsProps {
  anomalies: AnomalyRecord[];
}

const STATUS_CONFIG: Record<
  string,
  { dot: string; label: string }
> = {
  detected: { dot: "bg-red-500", label: "Active" },
  investigating: { dot: "bg-amber-500", label: "Investigating" },
  resolved: { dot: "bg-emerald-500", label: "Resolved" },
  dismissed: { dot: "bg-slate-400", label: "Dismissed" },
};

export function DetectiveFindings({ anomalies }: DetectiveFindingsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("all");

  const filtered = filter === "all" ? anomalies : anomalies.filter((a) => a.status === filter);

  return (
    <div className="rounded-[20px] bg-white dark:bg-[#101010] p-6 shadow-[0px_8px_24px_rgba(149,157,165,0.1)] dark:shadow-none border border-transparent dark:border-slate-800 transition-all duration-300">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Detective Findings</h3>
        
        {/* Filter chips (styled like the Mboard tabs) */}
        <div className="flex gap-2">
           {["all", "detected", "investigating", "resolved"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
               className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  filter === f
                    ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm"
                    : "text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                {f}
              </button>
            ))}
        </div>
      </div>

       {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 border border-dashed border-slate-200 dark:border-slate-700/50 rounded-xl">
             <div className="w-2 h-2 rounded-full bg-emerald-500 mb-2"></div>
             <p className="text-sm text-slate-500 dark:text-slate-400 font-semibold">No anomalies found.</p>
          </div>
       ) : (
          <div className="w-full overflow-x-auto">
             <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/60 text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                    <th className="pb-4 font-semibold whitespace-nowrap px-2">No</th>
                    <th className="pb-4 font-semibold whitespace-nowrap px-2">
                       <div className="flex items-center gap-1 cursor-pointer hover:text-slate-600 dark:hover:text-slate-300">Anomaly ID <ArrowUpDown className="w-3 h-3 text-slate-300" /></div>
                    </th>
                    <th className="pb-4 font-semibold whitespace-nowrap px-2">Target</th>
                    <th className="pb-4 font-semibold whitespace-nowrap px-2">Cost Impact</th>
                    <th className="pb-4 font-semibold whitespace-nowrap px-2">Confidence</th>
                    <th className="pb-4 font-semibold whitespace-nowrap px-2">Status <ArrowUpDown className="w-3 h-3 text-slate-300 inline-block ml-1" /></th>
                    <th className="pb-4 font-semibold whitespace-nowrap px-2 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-[13px] text-slate-700 dark:text-slate-300 font-medium">
                  {filtered.map((anomaly, i) => {
                    const cfg = STATUS_CONFIG[anomaly.status] ?? STATUS_CONFIG.detected;
                    const isExpanded = expandedId === anomaly.id;

                    return (
                      <Fragment key={anomaly.id}>
                         <tr 
                            onClick={() => setExpandedId(isExpanded ? null : anomaly.id)}
                            className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors cursor-pointer group"
                         >
                            <td className="py-4 px-2 text-slate-400">{i + 1}</td>
                            <td className="py-4 px-2 font-semibold text-slate-900 dark:text-white">#{anomaly.id.slice(0, 5).toUpperCase()}</td>
                            <td className="py-4 px-2 truncate max-w-[150px]">{anomaly.function_name}</td>
                            <td className="py-4 px-2 text-red-500 font-bold">+${Math.abs(anomaly.current_cost - anomaly.previous_cost).toFixed(2)}</td>
                            <td className="py-4 px-2 text-slate-500">{(anomaly.confidence ? anomaly.confidence * 100 : 90).toFixed(0)}%</td>
                            <td className="py-4 px-2">
                               <div className="inline-flex items-center gap-2">
                                  <span className={`w-2 h-2 rounded-full ${cfg.dot}`}></span>
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">{cfg.label}</span>
                               </div>
                            </td>
                            <td className="py-4 px-2 text-right opacity-50 group-hover:opacity-100 transition-opacity">
                               <ChevronDown className={`w-5 h-5 ml-auto text-slate-400 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                            </td>
                         </tr>
                         
                         {/* Expanded Content Row */}
                         {isExpanded && (
                            <tr className="bg-slate-50/50 dark:bg-slate-800/20">
                               <td colSpan={7} className="px-4 py-6 border-b border-slate-100 dark:border-slate-800/60">
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 rounded-xl bg-white dark:bg-[#151930] border border-slate-200 dark:border-slate-800 shadow-sm">
                                      {/* AI Analysis */}
                                      <div className="space-y-2">
                                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">AI Agent Analysis</p>
                                         <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed max-w-lg">
                                            {anomaly.agent_explanation || "Analyzing anomaly root cause..."}
                                         </p>
                                      </div>
                                      
                                      {/* Fixes */}
                                      <div className="space-y-2">
                                         <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Suggested Remediations</p>
                                         <p className="text-xs text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 rounded-lg font-medium">
                                            {anomaly.suggested_fix || "No immediate remediation available."}
                                         </p>
                                      </div>
                                  </div>
                               </td>
                            </tr>
                         )}
                      </Fragment>
                    );
                  })}
                </tbody>
             </table>
          </div>
       )}
    </div>
  );
}