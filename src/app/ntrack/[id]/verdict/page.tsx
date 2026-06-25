"use client";

import Link from "next/link";
import { useParams } from "next/navigation";

import { useStore } from "@/lib/store-context";
import { VERDICT_RESULT, VERDICT_RESULT_LABELS } from "@/types";

const RESULT_COLOR: Record<string, string> = {
  [VERDICT_RESULT.CONTINUE_BOTH]: "bg-sky-50 border-sky-200 text-sky-800",
  [VERDICT_RESULT.PRIMARY_A]: "bg-emerald-50 border-emerald-200 text-emerald-800",
  [VERDICT_RESULT.PRIMARY_B]: "bg-emerald-50 border-emerald-200 text-emerald-800",
  [VERDICT_RESULT.PAUSE_ONE]: "bg-amber-50 border-amber-200 text-amber-800",
};

export default function NTrackVerdictPage() {
  const { id } = useParams<{ id: string }>();
  const { state } = useStore();

  const session = state.ntrack_sessions.find((s) => s.id === id);
  const verdict = session?.verdict;

  if (!session || !verdict) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        裁决还没有生成。
        <br />
        <Link href={`/ntrack/${id}`} className="mt-2 inline-block text-slate-500 underline">
          返回验证
        </Link>
      </div>
    );
  }

  const sessionLogs = state.ntrack_logs.filter((l) => l.session_id === id);

  return (
    <div className="space-y-6">
      <div>
        <Link href="/ntrack" className="text-xs text-slate-400 hover:text-slate-600">
          ← 返回列表
        </Link>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">{session.title}</h1>
        <p className="mt-1 text-xs text-slate-400">
          裁决于 {new Date(verdict.created_at).toLocaleDateString("zh-CN")} 生成
        </p>
      </div>

      {/* 裁决结论 */}
      <div className={`rounded-2xl border p-5 ${RESULT_COLOR[verdict.result]}`}>
        <p className="text-xs font-medium uppercase tracking-wider opacity-70">裁决结论</p>
        <p className="mt-1.5 text-xl font-bold">
          {VERDICT_RESULT_LABELS[verdict.result]}
        </p>
      </div>

      {/* 数据依据 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">数据依据</p>
        <div className="space-y-2">
          {session.tracks.map((t) => {
            const tLogs = sessionLogs.filter((l) => l.track_id === t.id);
            const days = new Set(tLogs.map((l) => l.date)).size;
            const mins = tLogs.reduce((s, l) => s + l.duration_minutes, 0);
            const avgResist =
              tLogs.length > 0
                ? (tLogs.reduce((s, l) => s + l.resistance_level, 0) / tLogs.length).toFixed(1)
                : "—";
            const energized = tLogs.filter((l) => l.mood_after === "energized").length;
            const drained = tLogs.filter((l) => l.mood_after === "drained").length;
            return (
              <div key={t.id} className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-semibold text-slate-900">{t.name}</p>
                <div className="mt-1.5 grid grid-cols-4 gap-2 text-center text-xs">
                  <div>
                    <p className="text-slate-900 font-medium">{days}</p>
                    <p className="text-slate-400">执行天</p>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">{mins}</p>
                    <p className="text-slate-400">分钟</p>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">{avgResist}</p>
                    <p className="text-slate-400">阻力均值</p>
                  </div>
                  <div>
                    <p className="text-slate-900 font-medium">
                      {energized}↑ {drained}↓
                    </p>
                    <p className="text-slate-400">能量</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 裁决理由 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">为什么这样裁决</p>
        <p className="text-sm leading-7 text-slate-700">{verdict.reason}</p>
      </div>

      {/* 下一步策略 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">下一阶段策略</p>
        <p className="text-sm leading-7 text-slate-700">{verdict.next_strategy}</p>
      </div>

      {/* 关闭的问题 */}
      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">已关闭的问题</p>
        <ul className="space-y-2">
          {verdict.closed_questions.map((q, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
              <span className="mt-0.5 text-slate-400">·</span>
              {q}
            </li>
          ))}
        </ul>
      </div>

      <Link
        href="/ntrack"
        className="block w-full rounded-2xl border border-slate-200 bg-white py-3.5 text-center text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        返回验证列表
      </Link>
    </div>
  );
}
