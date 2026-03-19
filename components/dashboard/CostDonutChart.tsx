"use client";

import { DonutChart } from "@tremor/react";
import { MoreHorizontal } from "lucide-react";

interface CostDataPoint {
  name: string;
  "Current ($)": number;
  "Previous ($)": number;
}

interface CostDonutChartProps {
  data: CostDataPoint[];
}

// Curated color palette that works on dark backgrounds
const CHART_COLORS = ["emerald", "cyan", "amber", "rose", "violet", "blue", "orange"];

export function CostDonutChart({ data }: CostDonutChartProps) {
  const totalCost = data.reduce((sum, item) => sum + item["Current ($)"], 0);

  const chartData = data.map((d) => ({
    name: d.name,
    amount: d["Current ($)"],
  }));

  const valueFormatter = (number: number) => `$${Intl.NumberFormat("us").format(number)}`;

  return (
    <div className="relative flex flex-col justify-between h-full rounded-[20px] bg-white dark:bg-[#101010] p-6 shadow-[0px_8px_24px_rgba(149,157,165,0.1)] dark:shadow-none border border-transparent dark:border-slate-800 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Cost Distribution</h3>
        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Donut with center label */}
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="relative">
          <DonutChart
            className="h-44 w-44"
            data={chartData}
            category="amount"
            index="name"
            valueFormatter={valueFormatter}
            colors={CHART_COLORS}
            showTooltip={true}
            showAnimation={true}
            showLabel={true}
            label={`$${totalCost.toFixed(0)}`}
          />
        </div>
      </div>

      {/* Legend grid */}
      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/60">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {chartData.map((d, i) => (
            <div key={d.name} className="flex items-center gap-2 min-w-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: [
                    "#10b981", "#06b6d4", "#f59e0b", "#f43f5e",
                    "#8b5cf6", "#3b82f6", "#f97316"
                  ][i % 7]
                }}
              />
              <span className="text-xs text-slate-400 truncate">{d.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

