"use client";

import Link from "next/link";

import { ActionResponseCard } from "@/components/action-response-card";
import { AllocationSuggestionCard } from "@/components/allocation-suggestion-card";
import { DailySummaryCard } from "@/components/daily-summary-card";
import { RecoveryPointForm } from "@/components/recovery-point-form";
import { useStore } from "@/lib/store-context";

function getNow() {
  return new Date().toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 6) return "深夜了";
  if (hour < 12) return "早上好";
  if (hour < 14) return "中午好";
  if (hour < 18) return "下午好";
  if (hour < 22) return "晚上好";
  return "夜里了";
}

export default function AnchorPage() {
  const { hydrated, todayRecoveryPoints, pendingSparks } = useStore();


  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-100" />
        <div className="h-32 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400">{getNow()}</p>
          <h1 className="mt-0.5 text-2xl font-semibold text-slate-950">
            {getGreeting()}
          </h1>
        </div>
        {todayRecoveryPoints.length > 0 && (
          <div className="flex flex-col items-center rounded-xl bg-emerald-50 px-3 py-2 text-center">
            <span className="text-xl font-bold text-emerald-700">
              {todayRecoveryPoints.length}
            </span>
            <span className="text-xs text-emerald-600">恢复点</span>
          </div>
        )}
      </div>

      {/* 通知回报 */}
      <ActionResponseCard />


      {/* 分配建议（来自昨晚复盘） */}
      <AllocationSuggestionCard />

      {/* 快捷记录恢复点 */}
      <RecoveryPointForm />

      {/* 恢复点记录 */}
      {todayRecoveryPoints.length > 0 ? (
        <section className="rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-emerald-600">
            今日成长证据
          </p>
          <div className="mt-3 space-y-3">
            {todayRecoveryPoints.map((rp) => (
              <div key={rp.id} className="flex items-start gap-3">
                <span className="mt-0.5 text-emerald-500">✓</span>
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {rp.action_taken}
                  </p>
                  {rp.note && (
                    <p className="mt-0.5 text-xs text-slate-500">{rp.note}</p>
                  )}
                  <p className="mt-0.5 text-xs text-emerald-600">
                    {new Date(rp.created_at).toLocaleTimeString("zh-CN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            今日成长证据
          </p>
          <p className="mt-2 text-sm text-slate-500">
            今天还没有恢复点。完成一个小动作就会出现在这里。
          </p>
        </section>
      )}

      {/* 待处理念头 */}
      {pendingSparks.length > 0 && (
        <section className="rounded-2xl border border-sky-100 bg-sky-50 p-5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium uppercase tracking-wider text-sky-600">
              待处理念头
            </p>
            <Link
              href="/spark"
              className="text-xs font-medium text-sky-700 hover:underline"
            >
              查看全部 {pendingSparks.length} 条
            </Link>
          </div>
          <p className="mt-2 text-sm text-slate-600 leading-6">
            {pendingSparks[0]?.content}
          </p>
        </section>
      )}

      {/* 今日总结 */}
      <DailySummaryCard />

      {/* 快捷入口 */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/input"
          className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          识别偏移
          <p className="mt-1 text-xs font-normal text-slate-400">写下此刻发生了什么</p>
        </Link>
        <Link
          href="/spark"
          className="rounded-xl border border-slate-200 bg-white p-4 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          接住念头
          <p className="mt-1 text-xs font-normal text-slate-400">
            {pendingSparks.length > 0
              ? `${pendingSparks.length} 条待处理`
              : "随手记下"}
          </p>
        </Link>
      </div>
    </div>
  );
}
