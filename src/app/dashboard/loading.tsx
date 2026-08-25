export default function DashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="h-5 w-32 rounded-full bg-slate-200" />
          <div className="h-8 w-64 rounded-xl bg-slate-200" />
        </div>
        <div className="h-9 w-28 rounded-xl bg-slate-200" />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-28 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs" />
        <div className="h-28 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs" />
        <div className="h-28 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs" />
        <div className="h-28 rounded-2xl border border-slate-200/60 bg-white p-5 shadow-2xs" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div className="h-80 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xs" />
        <div className="h-80 rounded-2xl border border-slate-200/60 bg-white p-6 shadow-2xs" />
      </div>
    </div>
  );
}

