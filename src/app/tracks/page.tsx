"use client";

import Link from "next/link";
import { useState } from "react";

import { AllocationSuggestionCard } from "@/components/allocation-suggestion-card";
import { BudgetBar } from "@/components/budget-bar";
import { TrackCard } from "@/components/track-card";
import { allocateTrackMinutes } from "@/lib/scheduler";
import { useStore } from "@/lib/store-context";
import { TRACK_STATUS } from "@/types";

const TRACK_COLORS = [
  "bg-sky-400",
  "bg-violet-400",
  "bg-emerald-400",
  "bg-amber-400",
  "bg-rose-400",
];

export default function TracksPage() {
  const { state, hydrated, setBudget, editTrack } = useStore();
  const { tracks, total_budget_minutes: budgetMinutes } = state;

  const [editingBudget, setEditingBudget] = useState(false);
  const [budgetInput, setBudgetInput] = useState(String(budgetMinutes));

  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-100" />
        <div className="h-10 rounded-full bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
        <div className="h-28 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  const allocations = allocateTrackMinutes(tracks, budgetMinutes);
  const allocatedMinutes = allocations.reduce(
    (total, a) => total + a.allocated_minutes,
    0,
  );
  const allocationByTrackId = new Map(
    allocations.map((a) => [a.track_id, a.allocated_minutes]),
  );

  const activeTracks = tracks.filter((t) => t.status === TRACK_STATUS.ACTIVE);
  const totalWeight = activeTracks.reduce((s, t) => s + t.weight, 0);

  function handleBudgetSave() {
    const parsed = parseInt(budgetInput, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setBudget(parsed);
    } else {
      setBudgetInput(String(budgetMinutes));
    }
    setEditingBudget(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">今日分配</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            时间已按轨道分配，需要时可以手动调整今日预算。
          </p>
        </div>
        <Link
          href="/tracks/edit"
          className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
        >
          编辑轨道
        </Link>
      </div>

      {/* 来自昨晚复盘的建议 */}
      <AllocationSuggestionCard />

      <BudgetBar budgetMinutes={budgetMinutes} allocatedMinutes={allocatedMinutes} />

      {/* 手动调整预算 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-slate-800">
            今日预算：<span className="font-bold">{budgetMinutes} 分钟</span>
          </p>
          {!editingBudget && (
            <button
              type="button"
              onClick={() => {
                setBudgetInput(String(budgetMinutes));
                setEditingBudget(true);
              }}
              className="text-sm text-slate-400 hover:text-slate-700"
            >
              手动调整
            </button>
          )}
        </div>

        {editingBudget && (
          <div className="mt-3 flex items-center gap-2">
            <input
              type="number"
              min={5}
              max={480}
              value={budgetInput}
              onChange={(e) => setBudgetInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleBudgetSave()}
              className="w-24 rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
            <span className="text-sm text-slate-500">分钟</span>
            <button
              type="button"
              onClick={handleBudgetSave}
              className="rounded-xl bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700"
            >
              确认
            </button>
            <button
              type="button"
              onClick={() => setEditingBudget(false)}
              className="text-sm text-slate-400 hover:text-slate-600"
            >
              取消
            </button>
          </div>
        )}
      </div>

      {/* 分配比例可视化 */}
      {activeTracks.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            分配比例
          </p>

          {/* 比例条 */}
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {activeTracks.map((t, i) => {
              const pct = totalWeight > 0 ? (t.weight / totalWeight) * 100 : 0;
              return (
                <div
                  key={t.id}
                  className={`${TRACK_COLORS[i % TRACK_COLORS.length]} transition-all duration-300`}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>

          {/* 图例 + 权重滑条 */}
          <div className="space-y-3">
            {activeTracks.map((t, i) => {
              const mins = allocationByTrackId.get(t.id) ?? 0;
              const pct = totalWeight > 0 ? Math.round((t.weight / totalWeight) * 100) : 0;
              return (
                <div key={t.id}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block h-2.5 w-2.5 rounded-full ${TRACK_COLORS[i % TRACK_COLORS.length]}`} />
                      <span className="text-sm font-medium text-slate-800">{t.name}</span>
                    </div>
                    <span className="text-xs text-slate-500">
                      {pct}% · {mins} 分钟
                    </span>
                  </div>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    step={1}
                    value={t.weight}
                    onChange={(e) => editTrack(t.id, { weight: parseInt(e.target.value, 10) })}
                    className="w-full accent-slate-800 cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-300 mt-0.5 px-0.5">
                    <span>低</span>
                    <span>高</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section aria-labelledby="track-list-title">
        <h2
          id="track-list-title"
          className="mb-3 text-sm font-medium text-slate-600"
        >
          轨道锚点
        </h2>
        <div className="space-y-3">
          {tracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              allocatedMinutes={allocationByTrackId.get(track.id) ?? 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
