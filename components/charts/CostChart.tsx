"use client";

import { BarChart, Card, Title, Text } from "@tremor/react";

interface CostDataPoint {
  name: string;
  "Current ($)": number;
  "Previous ($)": number;
}

interface CostChartProps {
  data: CostDataPoint[];
  title?: string;
}

export function CostChart({
  data,
  title = "Lambda Cost by Function",
}: CostChartProps) {
  return (
    <Card className="!bg-white dark:!bg-slate-800/50 !border-slate-200 dark:!border-slate-700/50 !ring-0 backdrop-blur-sm shadow-sm dark:shadow-none">
      <Title className="!text-slate-900 dark:!text-white">{title}</Title>
      <Text className="!text-slate-500 dark:!text-slate-400">Current vs previous period</Text>
      <BarChart
        className="mt-4 h-72"
        data={data}
        index="name"
        categories={["Current ($)", "Previous ($)"]}
        colors={["rose", "slate"]}
        yAxisWidth={56}
        valueFormatter={(value) => `$${value.toFixed(2)}`}
        showAnimation
        showGridLines={false}
      />
    </Card>
  );
}