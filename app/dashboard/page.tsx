import { cookies } from "next/headers";
import {
  getRecentAnomalies,
  getCostSnapshots,
  getHourlyCosts,
  getTraceSpans,
  getActivityFeed,
} from "@/lib/db/supabase";
import {
  getMockAnomalies,
  getMockCostSnapshots,
  getMockHourlyCosts,
  getMockTraceSpans,
  getMockActivityFeed,
  MOCK_TRACE_TOTAL_DURATION_MS,
} from "@/lib/mock/data";
import { DetectiveFindings } from "@/components/charts/DetectiveFindings";
import { TraceWaterfall } from "@/components/charts/TraceWaterfall";
import { ModeBanner } from "@/components/dashboard/ModeBanner";
import { StatCard } from "@/components/dashboard/StatCard";
import { HealthRing } from "@/components/dashboard/HealthRing";
import { FunctionLeaderboard } from "@/components/dashboard/FunctionLeaderboard";
import { ActivityTimeline } from "@/components/dashboard/ActivityTimeline";
import { CostAreaChart } from "@/components/dashboard/CostAreaChart";
import { CostDonutChart } from "@/components/dashboard/CostDonutChart";
import { SSEAutoRefresh } from "@/components/dashboard/SSEAutoRefresh";
import { DollarSign, AlertCircle, CheckCircle2, Activity, Search, Bell, User } from "lucide-react";

export const revalidate = 60;

export default async function DashboardPage() {
  /* ── Determine data source ── */
  const cookieStore = cookies();
  const provider = cookieStore.get("aegis_provider")?.value ?? "mock";

  let anomalies;
  let costSnapshots;
  let hourlyCosts;
  let traceSpans;
  let activityFeed;

  if (provider === "mock") {
    anomalies = getMockAnomalies();
    costSnapshots = getMockCostSnapshots();
    hourlyCosts = getMockHourlyCosts();
    traceSpans = getMockTraceSpans();
    activityFeed = getMockActivityFeed();
  } else {
    [anomalies, costSnapshots, hourlyCosts, traceSpans, activityFeed] = await Promise.all([
      getRecentAnomalies(10).catch(() => []), // Only use real DB data in non-mock mode
      getCostSnapshots(24).catch(() => []),
      getHourlyCosts().catch(() => []),
      getTraceSpans().catch(() => []),
      getActivityFeed().catch(() => []),
    ]);
  }

  /* ── Derived data ── */
  type CostBucket = { current: number; previous: number };
  const costByFunction = costSnapshots.reduce<Record<string, CostBucket>>(
    (acc, snap) => {
      if (!acc[snap.function_name]) acc[snap.function_name] = { current: 0, previous: 0 };
      const midpoint = new Date(Date.now() - 12 * 3_600_000).toISOString();
      if (snap.period_start >= midpoint) {
        acc[snap.function_name].current += Number(snap.cost);
      } else {
        acc[snap.function_name].previous += Number(snap.cost);
      }
      return acc;
    },
    {}
  );

  const chartData = Object.entries(costByFunction).map(([name, costs]) => ({
    name,
    "Current ($)": parseFloat(costs.current.toFixed(2)),
    "Previous ($)": parseFloat(costs.previous.toFixed(2)),
  }));

  const functionRows = Object.entries(costByFunction).map(([name, costs]) => ({
    name,
    currentCost: costs.current,
    previousCost: costs.previous,
    change: costs.previous > 0 ? ((costs.current - costs.previous) / costs.previous) * 100 : 0,
  }));

  const totalCurrentCost = Object.values(costByFunction).reduce((s, c) => s + c.current, 0);
  const totalPreviousCost = Object.values(costByFunction).reduce((s, c) => s + c.previous, 0);
  const totalChange =
    totalPreviousCost > 0
      ? (((totalCurrentCost - totalPreviousCost) / totalPreviousCost) * 100).toFixed(0)
      : "0";

  const activeAnomalies = anomalies.filter((a) => a.status === "detected").length;
  const investigatingCount = anomalies.filter((a) => a.status === "investigating").length;
  const resolvedToday = anomalies.filter(
    (a) =>
      a.status === "resolved" &&
      new Date(a.resolved_at ?? 0).toDateString() === new Date().toDateString()
  ).length;

  // Health score: start at 100, deduct per active/investigating anomaly
  const healthScore = Math.max(
    0,
    100 - activeAnomalies * 20 - investigatingCount * 10
  );

  return (
    <main className="min-h-screen p-6 lg:p-8 max-w-screen-2xl mx-auto">
      <SSEAutoRefresh />
      {/* Mode Banner */}
      <div className="mb-6">
        <ModeBanner provider={provider} />
      </div>

      {/* Header */}
      <header className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold text-white mt-2">Welcome Back, Aegis Admin</h1>
        </div>
        <div className="flex items-center gap-4">
          <button className="text-slate-500 hover:text-white transition-colors">
            <Search className="w-5 h-5" />
          </button>
          <button className="relative text-slate-500 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-900"></span>
          </button>
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
             <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border border-slate-700">
                <User className="w-5 h-5 text-slate-400" />
             </div>
             <span className="text-sm font-medium text-slate-300 hidden sm:block">Admin</span>
          </div>
        </div>
      </header>

      {/* ── Row 1: Stats + Health Ring ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6 stagger">
        <StatCard
          label="Total Spend (12h)"
          value={`$${totalCurrentCost.toFixed(2)}`}
          change={`${totalChange}% vs prev 12h`}
          changeType={Number(totalChange) > 10 ? "up" : Number(totalChange) < -5 ? "down" : "neutral"}
          icon={<DollarSign className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          label="Active Anomalies"
          value={activeAnomalies}
          change={investigatingCount > 0 ? `${investigatingCount} investigating` : "None pending"}
          changeType={activeAnomalies > 0 ? "up" : "neutral"}
          icon={<AlertCircle className="w-5 h-5" />}
          color="red"
        />
        <StatCard
          label="Resolved Today"
          value={resolvedToday}
          change="Automated by AI"
          changeType="neutral"
          icon={<CheckCircle2 className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          label="Functions Tracked"
          value={Object.keys(costByFunction).length}
          change="Across all regions"
          changeType="neutral"
          icon={<Activity className="w-5 h-5" />}
          color="violet"
        />
        {/* Health Ring integrated into the stat row */}
        <div className="col-span-2 lg:col-span-1 rounded-[20px] bg-[#101010] border border-slate-800 p-6 flex items-center justify-center animate-fade-in-up" style={{ animationDelay: '240ms' }}>
          <HealthRing score={healthScore} label="System Health" />
        </div>
      </div>

      {/* ── Row 2: Area Chart + Donut Chart ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" id="costs">
        <div className="lg:col-span-2">
          <CostAreaChart data={hourlyCosts} />
        </div>
        <div className="lg:col-span-1">
          <CostDonutChart data={chartData} />
        </div>
      </div>

      {/* ── Tables Section ── */}
      <div className="space-y-6 mb-6" id="anomalies">
        <FunctionLeaderboard functions={functionRows} />
        <DetectiveFindings anomalies={anomalies} />
      </div>

      {/* ── Traces / Activity ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="traces" style={{scrollMarginTop: '2rem'}}>
         <div className="lg:col-span-2">
           <TraceWaterfall spans={traceSpans} totalDurationMs={MOCK_TRACE_TOTAL_DURATION_MS} />
         </div>
         <ActivityTimeline events={activityFeed} />
      </div>
    </main>
  );
}
