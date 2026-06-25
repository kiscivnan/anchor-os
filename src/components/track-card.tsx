"use client";

import { useEffect, useRef, useState } from "react";

import { useStore } from "@/lib/store-context";
import {
  TRACK_LOG_SOURCE,
  TRACK_STATUS,
  TRACK_STATUS_LABELS,
  type Track,
} from "@/types";

interface TrackCardProps {
  track: Track;
  allocatedMinutes: number;
}

const statusStyles: Record<Track["status"], string> = {
  [TRACK_STATUS.ACTIVE]: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  [TRACK_STATUS.PAUSED]: "bg-amber-50 text-amber-700 ring-amber-600/20",
  [TRACK_STATUS.DONE]: "bg-slate-100 text-slate-600 ring-slate-500/20",
};

function fmt(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function TrackCard({ track, allocatedMinutes }: TrackCardProps) {
  const { addTrackLog, state } = useStore();

  // 计时器状态
  const [timerMode, setTimerMode] = useState<"idle" | "running" | "paused">("idle");
  const [elapsed, setElapsed] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 补记表单状态
  const [showManual, setShowManual] = useState(false);
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualNote, setManualNote] = useState("");

  // 计时器 ticker
  useEffect(() => {
    if (timerMode === "running") {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerMode]);

  function handleTimerStart() {
    setTimerMode("running");
  }

  function handleTimerPause() {
    setTimerMode("paused");
  }

  function handleTimerResume() {
    setTimerMode("running");
  }

  function handleTimerStop() {
    const minutes = Math.max(1, Math.round(elapsed / 60));
    addTrackLog({
      track_id: track.id,
      duration_minutes: minutes,
      note: track.today_action,
      source: TRACK_LOG_SOURCE.TIMER,
    });
    setTimerMode("idle");
    setElapsed(0);
  }

  function handleManualSave() {
    const mins = parseInt(manualMinutes, 10);
    if (isNaN(mins) || mins < 1 || !manualNote.trim()) return;
    addTrackLog({
      track_id: track.id,
      duration_minutes: mins,
      note: manualNote.trim(),
      source: TRACK_LOG_SOURCE.MANUAL,
    });
    setManualMinutes("");
    setManualNote("");
    setShowManual(false);
  }

  // 今日此轨道已记录分钟数
  const todayLogged = state.track_logs
    .filter(
      (l) =>
        l.track_id === track.id &&
        new Date(l.created_at).toDateString() === new Date().toDateString(),
    )
    .reduce((sum, l) => sum + l.duration_minutes, 0);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
      {/* 标题行 */}
      <div className="flex items-start justify-between gap-4">
        <h2 className="font-semibold leading-6 text-slate-950">{track.name}</h2>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${statusStyles[track.status]}`}
        >
          {TRACK_STATUS_LABELS[track.status]}
        </span>
      </div>

      {/* 锚点动作 */}
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-slate-500">
          锚点动作
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-700">{track.today_action}</p>
      </div>

      {/* 分配/权重/已记录 */}
      <dl className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
        <div>
          <dt className="text-xs text-slate-500">分配</dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">
            {allocatedMinutes} min
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">已记录</dt>
          <dd className={`mt-1 text-base font-semibold ${todayLogged >= allocatedMinutes && allocatedMinutes > 0 ? "text-emerald-600" : "text-slate-950"}`}>
            {todayLogged} min
          </dd>
        </div>
        <div>
          <dt className="text-xs text-slate-500">权重</dt>
          <dd className="mt-1 text-base font-semibold text-slate-950">{track.weight}</dd>
        </div>
      </dl>

      {/* 计时器区域 */}
      <div className="border-t border-slate-100 pt-4">
        {timerMode === "idle" ? (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTimerStart}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ▶ 开始计时
            </button>
            <button
              type="button"
              onClick={() => setShowManual((v) => !v)}
              className="flex-1 rounded-xl border border-slate-200 bg-white py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              ✎ 补记一笔
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-2xl font-bold text-slate-900">
                {fmt(elapsed)}
              </span>
              <div className="flex gap-2">
                {timerMode === "running" ? (
                  <button
                    type="button"
                    onClick={handleTimerPause}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    暂停
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleTimerResume}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50"
                  >
                    继续
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleTimerStop}
                  className="rounded-xl bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                >
                  结束记录
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 补记表单 */}
        {showManual && timerMode === "idle" && (
          <div className="mt-3 space-y-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
            <div className="flex gap-2 items-center">
              <input
                type="number"
                min={1}
                max={480}
                value={manualMinutes}
                onChange={(e) => setManualMinutes(e.target.value)}
                placeholder="分钟数"
                className="w-20 rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
              />
              <span className="text-sm text-slate-500">分钟</span>
            </div>
            <input
              type="text"
              value={manualNote}
              onChange={(e) => setManualNote(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSave()}
              placeholder="做了什么（一句话）"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-900 outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleManualSave}
                disabled={!manualMinutes || !manualNote.trim()}
                className="flex-1 rounded-xl bg-slate-900 py-2 text-sm font-medium text-white disabled:opacity-40 hover:bg-slate-700"
              >
                记下
              </button>
              <button
                type="button"
                onClick={() => { setShowManual(false); setManualMinutes(""); setManualNote(""); }}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-500 hover:bg-slate-50"
              >
                取消
              </button>
            </div>
          </div>
        )}
      </div>
    </article>
  );
}
