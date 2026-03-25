export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 lg:p-8">
      {/* Header skeleton */}
      <div className="mb-8">
        <div className="h-5 w-64 bg-slate-800 rounded animate-shimmer mb-2" />
        <div className="h-4 w-96 bg-slate-800/60 rounded animate-shimmer" />
      </div>

      {/* Stat cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-28 bg-slate-800/50 border border-slate-700/30 rounded-xl animate-shimmer" />
        ))}
      </div>

      {/* Charts skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 h-80 bg-slate-800/50 border border-slate-700/30 rounded-xl animate-shimmer" />
        <div className="h-80 bg-slate-800/50 border border-slate-700/30 rounded-xl animate-shimmer" />
      </div>
    </main>
  );
}