"use client";

import { useStore } from "@/lib/store-context";
import { ACTION_RESPONSE } from "@/types";

function getLast14Days(): string[] {
  return Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    return d.toDateString();
  });
}

function formatShort(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

export default function StatsPage() {
  const { state, hydrated } = useStore();

  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-100" />
        <div className="h-48 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const days = getLast14Days();

  // 每天恢复点数量
  const recoveryByDay = new Map<string, number>();
  for (const rp of state.recovery_points) {
    const key = new Date(rp.created_at).toDateString();
    recoveryByDay.set(key, (recoveryByDay.get(key) ?? 0) + 1);
  }

  // 每天复盘次数
  const reviewByDay = new Map<string, number>();
  for (const r of state.daily_reviews) {
    const key = new Date(r.created_at).toDateString();
    reviewByDay.set(key, (reviewByDay.get(key) ?? 0) + 1);
  }

  // 回报信号统计
  const responseCount = new Map<string, number>();
  for (const r of state.action_responses) {
    responseCount.set(r.response, (responseCount.get(r.response) ?? 0) + 1);
  }

  const maxRecovery = Math.max(1, ...Array.from(recoveryByDay.values()));

  // 疲惫信号天数（触发 fatigue_check 的日子）
  const fatigueDays = new Set(
    state.daily_reviews
      .filter((r) => r.triggered_tags.includes("mode:fatigue_check"))
      .map((r) => new Date(r.created_at).toDateString()),
  );

  const totalRecovery = state.recovery_points.length;
  const totalReviews = state.daily_reviews.length;
  const distressResponses =
    (responseCount.get(ACTION_RESPONSE.NUMB) ?? 0) +
    (responseCount.get(ACTION_RESPONSE.SELF_BLAME) ?? 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">恢复趋势</h1>
        <p className="mt-2 text-sm text-slate-500">过去 14 天的恢复点与状态信号</p>
      </div>

      {/* 汇总指标 */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-700">{totalRecovery}</p>
          <p className="mt-1 text-xs text-emerald-600">总恢复点</p>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-center">
          <p className="text-2xl font-bold text-slate-700">{totalReviews}</p>
          <p className="mt-1 text-xs text-slate-500">总复盘次数</p>
        </div>
        <div className="rounded-2xl border border-orange-100 bg-orange-50 p-4 text-center">
          <p className="text-2xl font-bold text-orange-600">{distressResponses}</p>
          <p className="mt-1 text-xs text-orange-500">麻木/自责信号</p>
        </div>
      </div>

      {/* 恢复点热力图 */}
      <section>
        <h2 className="mb-3 text-sm font-medium text-slate-600">恢复点 · 近 14 天</h2>
        <div className="rounded-2xl border border-slate-200 bg-white p-4">
          <div className="flex items-end gap-1.5">
            {days.map((day) => {
              const count = recoveryByDay.get(day) ?? 0;
              const heightPct = count === 0 ? 4 : Math.round((count / maxRecovery) * 100);
              const isFatigue = fatigueDays.has(day);
              const isToday = day === new Date().toDateString();

              return (
                <div key={day} className="flex flex-1 flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: 80 }}>
                    <div
                      className={`w-full rounded-sm transition-all ${
                        count === 0
                          ? "bg-slate-100"
                          : isFatigue
                            ? "bg-orange-300"
                            : "bg-emerald-400"
                      } ${isToday ? "ring-2 ring-slate-400 ring-offset-1" : ""}`}
                      style={{ height: `${heightPct}%`, minHeight: 4 }}
                      title={`${formatShort(day)}：${count} 个恢复点`}
                    />
                  </div>
                  <p className="text-center text-[10px] leading-none text-slate-400">
                    {formatShort(day)}
                  </p>
                </div>
              );
            })}
          </div>
          <div className="mt-3 flex gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-emerald-400" />
              恢复点
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-orange-300" />
              含疲惫信号
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-sm bg-slate-100" />
              无记录
            </span>
          </div>
        </div>
      </section>

      {/* 回报信号分布 */}
      {state.action_responses.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-600">回报信号分布</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
            {(
              [
                { key: ACTION_RESPONSE.DONE, label: "完成了", color: "bg-emerald-400" },
                { key: ACTION_RESPONSE.SWAP, label: "换一个", color: "bg-sky-400" },
                { key: ACTION_RESPONSE.SKIPPED, label: "没做", color: "bg-slate-300" },
                { key: ACTION_RESPONSE.RESEARCHING, label: "查资料", color: "bg-yellow-300" },
                { key: ACTION_RESPONSE.NUMB, label: "很麻木", color: "bg-orange-400" },
                { key: ACTION_RESPONSE.SELF_BLAME, label: "自责了", color: "bg-red-400" },
              ] as const
            ).map(({ key, label, color }) => {
              const count = responseCount.get(key) ?? 0;
              if (count === 0) return null;
              const total = state.action_responses.length;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-600">
                    <span>{label}</span>
                    <span>{count} 次 ({pct}%)</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${color}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 复盘标签统计 */}
      {state.daily_reviews.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-600">复盘标签累积</h2>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2">
            {(() => {
              const tagCount = new Map<string, number>();
              for (const r of state.daily_reviews) {
                for (const tag of r.triggered_tags) {
                  tagCount.set(tag, (tagCount.get(tag) ?? 0) + 1);
                }
              }
              return Array.from(tagCount.entries())
                .sort((a, b) => b[1] - a[1])
                .map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">{tag.replace("mode:", "")}</span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {count} 次
                    </span>
                  </div>
                ));
            })()}
          </div>
        </section>
      )}

      {totalRecovery === 0 && totalReviews === 0 && (
        <p className="py-12 text-center text-sm text-slate-400">
          还没有数据。完成一次行动回报或复盘后，这里会出现趋势。
        </p>
      )}
    </div>
  );
}
