"use client";

import type { ActivityEvent } from "@/lib/mock/data";
import { AlertTriangle, Search, Target, CheckCircle, BellOff, Rocket } from "lucide-react";
import { ReactNode } from "react";

interface ActivityTimelineProps {
  events: ActivityEvent[];
}

const typeConfig: Record<
  ActivityEvent["type"],
  { color: string; dotColor: string; icon: ReactNode }
> = {
  anomaly_detected: { color: "text-red-600 dark:text-red-400", dotColor: "bg-red-500", icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  investigation_started: { color: "text-amber-600 dark:text-amber-400", dotColor: "bg-amber-500", icon: <Search className="w-4 h-4 text-amber-500" /> },
  root_cause_found: { color: "text-blue-600 dark:text-blue-400", dotColor: "bg-blue-500", icon: <Target className="w-4 h-4 text-blue-500" /> },
  resolved: { color: "text-emerald-600 dark:text-emerald-400", dotColor: "bg-emerald-500", icon: <CheckCircle className="w-4 h-4 text-emerald-500" /> },
  dismissed: { color: "text-slate-600 dark:text-slate-400", dotColor: "bg-slate-500", icon: <BellOff className="w-4 h-4 text-slate-500" /> },
  deployment: { color: "text-violet-600 dark:text-violet-400", dotColor: "bg-violet-500", icon: <Rocket className="w-4 h-4 text-violet-500" /> },
};

function relativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ActivityTimeline({ events }: ActivityTimelineProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#101010] backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-none">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Activity Feed</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Recent events &amp; investigations</p>
      </div>
      <div className="max-h-[400px] overflow-y-auto scrollbar-dark">
        {events.map((evt, i) => {
          const config = typeConfig[evt.type];
          return (
            <div key={evt.id} className="relative flex gap-3 px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-700/20 transition-colors">
              {/* Timeline line */}
              {i < events.length - 1 && (
                <div className="absolute left-[31px] top-10 bottom-0 w-px bg-slate-200 dark:bg-slate-700/50" />
              )}
              {/* Dot */}
              <div className="relative flex-shrink-0 mt-1 flex items-center justify-center w-6">
                <div className={`h-2.5 w-2.5 rounded-full ${config.dotColor} ring-4 ring-white dark:ring-slate-800/80`} />
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="flex-shrink-0">{config.icon}</span>
                  <span className={`text-sm font-medium ${config.color}`}>
                    {evt.title}
                  </span>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-auto flex-shrink-0">
                    {relativeTime(evt.timestamp)}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                  {evt.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}