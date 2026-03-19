"use client";

import { AreaChart } from "@tremor/react";
import type { HourlyCostPoint } from "@/lib/mock/data";

interface CostAreaChartProps {
  data: HourlyCostPoint[];
}

export function CostAreaChart({ data }: CostAreaChartProps) {
  const valueFormatter = (number: number) => `$${Intl.NumberFormat("us").format(number).toString()}`;

  const chartData = data.map((d, index) => ({
    hour: d.hour,
    "Lambda Cost": d.cost,
    "Baseline": Math.round(d.cost * 0.6 + Math.sin(index) * 10),
  }));

  return (
    <div className="flex flex-col h-full rounded-[20px] bg-white dark:bg-[#101010] p-6 shadow-[0px_8px_24px_rgba(149,157,165,0.1)] dark:shadow-none border border-transparent dark:border-slate-800 transition-all duration-300">
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
         <h3 className="text-[17px] font-bold text-slate-900 dark:text-white">Cost Trend (24h)</h3>
         <div className="flex items-center gap-4 text-xs font-semibold">
            <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Lambda Cost
            </div>
            <div className="flex items-center gap-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer">
              <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
              Baseline
            </div>
            
            <span className="ml-4 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 select-none">
               Last 24h
            </span>
         </div>
      </div>

       <div className="flex-1 mt-4">
         <AreaChart
            className="h-72 w-full"
            data={chartData}
            index="hour"
            categories={["Baseline", "Lambda Cost"]}
            colors={["cyan", "emerald"]}
            valueFormatter={valueFormatter}
            showLegend={false}
            showGridLines={true}
            curveType="natural"
            showAnimation={true}
            yAxisWidth={50}
         />
       </div>
    </div>
  );
}
