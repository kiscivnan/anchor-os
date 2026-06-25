interface BudgetBarProps {
  budgetMinutes: number;
  allocatedMinutes: number;
}

export function BudgetBar({
  budgetMinutes,
  allocatedMinutes,
}: BudgetBarProps) {
  const remainingMinutes = budgetMinutes - allocatedMinutes;
  const usedPercentage =
    budgetMinutes > 0
      ? Math.min((allocatedMinutes / budgetMinutes) * 100, 100)
      : 0;

  return (
    <section className="rounded-2xl bg-slate-950 p-5 text-white">
      <p className="text-sm text-slate-300">今日可分配时间</p>
      <p className="mt-1 text-3xl font-semibold tracking-tight">
        {budgetMinutes} min
      </p>

      <div
        className="mt-5 h-2 overflow-hidden rounded-full bg-slate-700"
        role="progressbar"
        aria-label="今日时间分配进度"
        aria-valuemin={0}
        aria-valuemax={budgetMinutes}
        aria-valuenow={Math.min(allocatedMinutes, budgetMinutes)}
      >
        <div
          className="h-full rounded-full bg-sky-400"
          style={{ width: `${usedPercentage}%` }}
        />
      </div>

      <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div>
          <dt className="text-slate-400">已分配</dt>
          <dd className="mt-1 font-medium text-white">{allocatedMinutes} min</dd>
        </div>
        <div>
          <dt className="text-slate-400">剩余</dt>
          <dd className="mt-1 font-medium text-white">{remainingMinutes} min</dd>
        </div>
      </dl>
    </section>
  );
}
