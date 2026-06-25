"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStore } from "@/lib/store-context";
import { NTRACK_STATUS, type NTrackItem } from "@/types";

const STATUS_LABEL: Record<string, string> = {
  [NTRACK_STATUS.SETUP]: "准备中",
  [NTRACK_STATUS.ACTIVE]: "验证中",
  [NTRACK_STATUS.COMPLETED]: "已裁决",
};

const STATUS_COLOR: Record<string, string> = {
  [NTRACK_STATUS.SETUP]: "bg-amber-50 text-amber-700",
  [NTRACK_STATUS.ACTIVE]: "bg-sky-50 text-sky-700",
  [NTRACK_STATUS.COMPLETED]: "bg-slate-100 text-slate-600",
};

export default function NTrackListPage() {
  const { state, createNTrackSession } = useStore();
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState("");
  const [trackAName, setTrackAName] = useState("");
  const [trackBName, setTrackBName] = useState("");
  const [trackAAction, setTrackAAction] = useState("");
  const [trackBAction, setTrackBAction] = useState("");
  const [days, setDays] = useState("7");

  function handleCreate() {
    if (!title.trim() || !trackAName.trim() || !trackBName.trim()) return;
    const tracks: NTrackItem[] = [
      {
        id: `nti-a-${Date.now()}`,
        name: trackAName.trim(),
        description: "",
        fears: [],
        criteria: [],
        min_action: trackAAction.trim() || `体验 ${trackAName.trim()} 10 分钟`,
      },
      {
        id: `nti-b-${Date.now() + 1}`,
        name: trackBName.trim(),
        description: "",
        fears: [],
        criteria: [],
        min_action: trackBAction.trim() || `体验 ${trackBName.trim()} 10 分钟`,
      },
    ];
    const id = createNTrackSession(title.trim(), tracks, parseInt(days, 10) || 7);
    router.push(`/ntrack/${id}/setup`);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">N 轨锚点</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          不靠脑内分析，靠 7 天现实反馈决定下一阶段策略。
        </p>
      </div>

      {state.ntrack_sessions.length > 0 && (
        <div className="space-y-3">
          {state.ntrack_sessions.map((session) => {
            const elapsed = Math.floor(
              (Date.now() - new Date(session.created_at).getTime()) /
                (1000 * 60 * 60 * 24),
            );
            const progress = Math.min(elapsed, session.duration_days);
            return (
              <Link
                key={session.id}
                href={
                  session.status === NTRACK_STATUS.COMPLETED
                    ? `/ntrack/${session.id}/verdict`
                    : `/ntrack/${session.id}`
                }
                className="block rounded-2xl border border-slate-200 bg-white p-5 hover:bg-slate-50"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{session.title}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {session.tracks.map((t) => t.name).join(" vs ")}
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_COLOR[session.status]}`}>
                    {STATUS_LABEL[session.status]}
                  </span>
                </div>
                {session.status === NTRACK_STATUS.ACTIVE && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-500 mb-1">
                      <span>第 {progress} 天</span>
                      <span>{session.duration_days} 天</span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-slate-100">
                      <div
                        className="h-1.5 rounded-full bg-sky-400"
                        style={{ width: `${(progress / session.duration_days) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {!creating ? (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-5 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
        >
          + 新建验证
        </button>
      ) : (
        <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="font-medium text-slate-900">新建现实验证</p>

          <div>
            <label className="text-sm font-medium text-slate-700">验证主题</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例如：求职 vs 考公 7 天验证"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-slate-700">A 轨名称</label>
              <input
                type="text"
                value={trackAName}
                onChange={(e) => setTrackAName(e.target.value)}
                placeholder="例如：求职"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
              <input
                type="text"
                value={trackAAction}
                onChange={(e) => setTrackAAction(e.target.value)}
                placeholder="最小体验动作"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-slate-700">B 轨名称</label>
              <input
                type="text"
                value={trackBName}
                onChange={(e) => setTrackBName(e.target.value)}
                placeholder="例如：考公"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
              <input
                type="text"
                value={trackBAction}
                onChange={(e) => setTrackBAction(e.target.value)}
                placeholder="最小体验动作"
                className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">验证天数</label>
            <select
              value={days}
              onChange={(e) => setDays(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            >
              <option value="3">3 天（快速验证）</option>
              <option value="7">7 天（标准）</option>
              <option value="14">14 天（深度验证）</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCreate}
              disabled={!title.trim() || !trackAName.trim() || !trackBName.trim()}
              className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              创建并进入第 0 天
            </button>
            <button
              type="button"
              onClick={() => setCreating(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
            >
              取消
            </button>
          </div>
        </div>
      )}

      {state.ntrack_sessions.length === 0 && !creating && (
        <p className="py-4 text-center text-sm text-slate-400">
          还没有进行中的验证。<br />当你在两条路之间悬而未决时，创建一个。
        </p>
      )}
    </div>
  );
}
