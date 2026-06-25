"use client";

import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useStore } from "@/lib/store-context";
import { NTRACK_STATUS } from "@/types";

export default function NTrackSetupPage() {
  const { id } = useParams<{ id: string }>();
  const { state, updateNTrackSession } = useStore();
  const router = useRouter();

  const session = state.ntrack_sessions.find((s) => s.id === id);

  const [trackData, setTrackData] = useState<
    { fears: string; criteria: string; min_action: string }[]
  >(
    () =>
      session?.tracks.map((t) => ({
        fears: t.fears.join("\n"),
        criteria: t.criteria.join("\n"),
        min_action: t.min_action,
      })) ?? [],
  );

  if (!session) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">
        未找到该验证。
      </div>
    );
  }

  if (session.status !== NTRACK_STATUS.SETUP) {
    router.replace(`/ntrack/${id}`);
    return null;
  }

  function updateField(
    idx: number,
    field: "fears" | "criteria" | "min_action",
    value: string,
  ) {
    setTrackData((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  }

  function handleActivate() {
    const updatedTracks = session!.tracks.map((t, i) => ({
      ...t,
      fears: trackData[i]?.fears
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
      criteria: trackData[i]?.criteria
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean) ?? [],
      min_action:
        trackData[i]?.min_action.trim() || t.min_action,
    }));
    updateNTrackSession(id, {
      tracks: updatedTracks,
      status: NTRACK_STATUS.ACTIVE,
    });
    router.push(`/ntrack/${id}`);
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          第 0 天 · 准备
        </p>
        <h1 className="mt-1 text-2xl font-semibold text-slate-950">
          {session.title}
        </h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          把脑内悬空的担忧写下来，不需要解决它们——只是让它们有个位置。
        </p>
      </div>

      {session.tracks.map((track, idx) => (
        <div
          key={track.id}
          className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4"
        >
          <p className="text-base font-semibold text-slate-900">
            {String.fromCharCode(65 + idx)} 轨 · {track.name}
          </p>

          <div>
            <label className="text-sm font-medium text-slate-700">
              我对它的担忧 / 恐惧
            </label>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">
              每行一条，不用分析，直接写。
            </p>
            <textarea
              rows={4}
              value={trackData[idx]?.fears ?? ""}
              onChange={(e) => updateField(idx, "fears", e.target.value)}
              placeholder={"担心根本做不到\n担心收入不够\n担心家人不支持"}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none resize-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              外部验证标准
            </label>
            <p className="text-xs text-slate-400 mt-0.5 mb-2">
              7 天后你怎么知道"它行得通"？每行一个可观察的标准。
            </p>
            <textarea
              rows={3}
              value={trackData[idx]?.criteria ?? ""}
              onChange={(e) => updateField(idx, "criteria", e.target.value)}
              placeholder={"至少有 1 个陌生人给了正面反馈\n我愿意继续做第 8 天\n比开始时更想知道接下来怎么做"}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none resize-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700">
              今天能做的最小动作
            </label>
            <input
              type="text"
              value={trackData[idx]?.min_action ?? ""}
              onChange={(e) => updateField(idx, "min_action", e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>
        </div>
      ))}

      <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4">
        <p className="text-sm font-medium text-amber-800">开始前，关闭以下问题</p>
        <ul className="mt-2 space-y-1.5 text-sm text-amber-700">
          <li>· 不在验证阶段讨论"到底选哪个"</li>
          <li>· 每天最少完成一条最小动作，不要跳过</li>
          <li>· 体验结束后立即记录感受，不要等"想清楚"</li>
        </ul>
      </div>

      <button
        type="button"
        onClick={handleActivate}
        className="w-full rounded-2xl bg-slate-900 py-4 text-sm font-semibold text-white hover:bg-slate-700"
      >
        正式开始 {session.duration_days} 天验证
      </button>
    </div>
  );
}
