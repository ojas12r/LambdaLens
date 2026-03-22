"use client";

interface TraceSpan {
  name: string;
  startMs: number;
  durationMs: number;
  status: "ok" | "error" | "timeout";
}

interface TraceWaterfallProps {
  spans: TraceSpan[];
  totalDurationMs: number;
}

const statusConfig = {
  ok: { bar: "bg-emerald-500", badge: "text-emerald-700 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-500/10", label: "OK" },
  error: { bar: "bg-red-500", badge: "text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-500/10", label: "ERR" },
  timeout: { bar: "bg-amber-500", badge: "text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-500/10", label: "T/O" },
};

function formatDuration(ms: number): string {
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`;
  return `${ms}ms`;
}

export function TraceWaterfall({ spans, totalDurationMs }: TraceWaterfallProps) {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white dark:bg-[#101010] backdrop-blur-sm overflow-hidden shadow-sm dark:shadow-none">
      <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700/50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
              Request Trace Waterfall
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {spans.length} spans · {formatDuration(totalDurationMs)} total
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(["ok", "timeout", "error"] as const).map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span className={`h-2 w-2 rounded-full ${statusConfig[s].bar}`} />
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{statusConfig[s].label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-1.5">
        {/* Time ruler */}
        <div className="flex items-center ml-[148px] mr-[60px] mb-3">
          {[0, 25, 50, 75, 100].map((pct) => (
             <div key={pct} className="flex-1 text-center first:text-left last:text-right">
              <span className="text-[9px] text-slate-400 dark:text-slate-600 font-mono">
                {formatDuration((pct / 100) * totalDurationMs)}
              </span>
            </div>
          ))}
        </div>

        {spans.map((span, i) => {
          const cfg = statusConfig[span.status];
          const leftPct = (span.startMs / totalDurationMs) * 100;
          const widthPct = Math.max((span.durationMs / totalDurationMs) * 100, 0.8);

          return (
            <div
               key={i}
              className="flex items-center gap-3 group hover:bg-slate-50 dark:hover:bg-slate-700/20 rounded-lg px-2 py-1.5 -mx-2 transition-colors"
            >
              {/* Label */}
              <div className="flex items-center gap-2 w-[140px] flex-shrink-0">
                <span
                  className={`text-[9px] font-bold px-1 py-0.5 rounded ${cfg.badge}`}
                >
                  {cfg.label}
                </span>
                <span className="text-xs text-slate-700 dark:text-slate-300 truncate font-mono">
                  {span.name}
                </span>
              </div>

               {/* Bar */}
              <div className="flex-1 h-7 bg-slate-100 dark:bg-slate-700/30 rounded relative overflow-hidden">
                {/* Grid lines */}
                {[25, 50, 75].map((pct) => (
                  <div
                    key={pct}
                    className="absolute top-0 bottom-0 w-px bg-slate-200 dark:bg-slate-700/40"
                    style={{ left: `${pct}%` }}
                  />
                ))}
                <div
                  className={`absolute h-full rounded ${cfg.bar} opacity-[0.85] group-hover:opacity-100 transition-opacity`}
                  style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                >
                  {/* Duration label inside bar (if wide enough) */}
                  {widthPct > 8 && (
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-mono text-white font-bold drop-shadow-md">
                      {formatDuration(span.durationMs)}
                    </span>
                  )}
                </div>
              </div>

              {/* Duration */}
              <span className="text-xs text-slate-500 dark:text-slate-400 w-[52px] text-right font-mono flex-shrink-0">
                {formatDuration(span.durationMs)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}