"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

import { useStore } from "@/lib/store-context";
import { generateVerdict } from "@/lib/ntrack-verdict";
import { NTRACK_STATUS, type NTrackDailyLog } from "@/types";

const RESISTANCE_LABELS = ["极轻松", "轻松", "一般", "有阻力", "很难启动"];
const MOOD_LABELS: Record<NTrackDailyLog["mood_after"], string> = {
  drained: "完成后有点累",
  neutral: "完成后无感",
  energized: "完成后更有劲",
};

function today() {
  return new Date().toISOString().slice(0, 10);
}

function LogForm({
  sessionId,
  track,
  existingLog,
  onDone,
}: {
  sessionId: string;
  track: { id: string; name: string; min_action: string };
  existingLog: NTrackDailyLog | undefined;
  onDone: () => void;
}) {
  const { addNTrackLog } = useStore();
  const [action, setAction] = useState(existingLog?.action_done ?? "");
  const [minutes, setMinutes] = useState(String(existingLog?.duration_minutes ?? ""));
  const [feedback, setFeedback] = useState(existingLog?.external_feedback ?? "");
  const [resistance, setResistance] = useState<1|2|3|4|5>(existingLog?.resistance_level ?? 3);
  const [mood, setMood] = useState<NTrackDailyLog["mood_after"]>(existingLog?.mood_after ?? "neutral");

  if (existingLog) {
    return (
      <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-4">
        <p className="text-xs font-medium text-emerald-700">今日已记录</p>
        <p className="mt-1 text-sm text-slate-700">{existingLog.action_done}</p>
        <p className="mt-0.5 text-xs text-slate-500">
          {existingLog.duration_minutes} 分钟 · 阻力 {existingLog.resistance_level} · {MOOD_LABELS[existingLog.mood_after]}
        </p>
      </div>
    );
  }

  function handleSubmit() {
    if (!action.trim()) return;
    addNTrackLog({
      session_id: sessionId,
      track_id: track.id,
      date: today(),
      action_done: action.trim(),
      duration_minutes: parseInt(minutes, 10) || 0,
      external_feedback: feedback.trim(),
      resistance_level: resistance,
      mood_after: mood,
    });
    onDone();
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="text-xs font-medium text-slate-600">今天做了什么（最小动作：{track.min_action}）</label>
        <textarea
          rows={2}
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="简单描述今天对这条轨道做了什么"
          className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none resize-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-slate-600">时长（分钟）</label>
          <input
            type="number"
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            min="1"
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-600">外部反馈（可选）</label>
          <input
            type="text"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="别人说了什么"
            className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />
        </div>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">启动阻力</label>
        <div className="mt-1.5 flex gap-1">
          {([1, 2, 3, 4, 5] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setResistance(lvl)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${resistance === lvl ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {lvl}
            </button>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-400 text-center">
          {RESISTANCE_LABELS[resistance - 1]}
        </p>
      </div>
      <div>
        <label className="text-xs font-medium text-slate-600">做完后感受</label>
        <div className="mt-1.5 flex gap-2">
          {(["drained", "neutral", "energized"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMood(m)}
              className={`flex-1 rounded-lg border py-1.5 text-xs font-medium ${mood === m ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={handleSubmit}
        disabled={!action.trim()}
        className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
      >
        记录今日
      </button>
    </div>
  );
}

export default function NTrackSessionPage() {
  const { id } = useParams<{ id: string }>();
  const { state, setNTrackVerdict } = useStore();
  const router = useRouter();
  const [activeTrackIdx, setActiveTrackIdx] = useState(0);
  const [logDone, setLogDone] = useState(false);

  const session = state.ntrack_sessions.find((s) => s.id === id);

  if (!session) {
    return (
      <div className="py-16 text-center text-sm text-slate-400">未找到该验证。</div>
    );
  }

  if (session.status === NTRACK_STATUS.SETUP) {
    router.replace(`/ntrack/${id}/setup`);
    return null;
  }

  if (session.status === NTRACK_STATUS.COMPLETED) {
    router.replace(`/ntrack/${id}/verdict`);
    return null;
  }

  const sessionLogs = state.ntrack_logs.filter((l) => l.session_id === id);
  const todayStr = today();

  const elapsed = Math.floor(
    (Date.now() - new Date(session.created_at).getTime()) / (1000 * 60 * 60 * 24),
  );
  const dayNum = Math.min(elapsed + 1, session.duration_days);
  const isLastDay = dayNum >= session.duration_days;

  const allTodayDone = session.tracks.every((t) =>
    sessionLogs.some((l) => l.track_id === t.id && l.date === todayStr),
  );

  function handleGenerateVerdict() {
    const verdict = generateVerdict(session!.tracks, sessionLogs);
    setNTrackVerdict(id, verdict);
    router.push(`/ntrack/${id}/verdict`);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Link href="/ntrack" className="text-xs text-slate-400 hover:text-slate-600">
            ← 返回
          </Link>
        </div>
        <h1 className="mt-2 text-xl font-semibold text-slate-950">{session.title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          第 {dayNum} / {session.duration_days} 天 · 验证进行中
        </p>
        <div className="mt-3 h-1.5 w-full rounded-full bg-slate-100">
          <div
            className="h-1.5 rounded-full bg-sky-400 transition-all"
            style={{ width: `${(dayNum / session.duration_days) * 100}%` }}
          />
        </div>
      </div>

      {/* 轨道切换 */}
      <div className="flex gap-2">
        {session.tracks.map((t, i) => (
          <button
            key={t.id}
            type="button"
            onClick={() => { setActiveTrackIdx(i); setLogDone(false); }}
            className={`flex-1 rounded-xl border py-2.5 text-sm font-medium ${activeTrackIdx === i ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 text-slate-600 hover:bg-slate-50"}`}
          >
            {String.fromCharCode(65 + i)} · {t.name}
            {sessionLogs.some((l) => l.track_id === t.id && l.date === todayStr) && (
              <span className="ml-1 text-xs">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* 当前轨道记录表单 */}
      {session.tracks[activeTrackIdx] && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="mb-4 text-sm font-semibold text-slate-900">
            {String.fromCharCode(65 + activeTrackIdx)} 轨 · {session.tracks[activeTrackIdx].name}
          </p>
          <LogForm
            key={`${activeTrackIdx}-${logDone}`}
            sessionId={id}
            track={session.tracks[activeTrackIdx]}
            existingLog={sessionLogs.find(
              (l) =>
                l.track_id === session.tracks[activeTrackIdx].id &&
                l.date === todayStr,
            )}
            onDone={() => setLogDone(true)}
          />
        </div>
      )}

      {/* 历史汇总 */}
      {sessionLogs.length > 0 && (
        <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-3">
            本轮记录
          </p>
          <div className="space-y-2">
            {session.tracks.map((t) => {
              const tLogs = sessionLogs.filter((l) => l.track_id === t.id);
              const days = new Set(tLogs.map((l) => l.date)).size;
              const mins = tLogs.reduce((s, l) => s + l.duration_minutes, 0);
              const energized = tLogs.filter((l) => l.mood_after === "energized").length;
              return (
                <div key={t.id} className="flex items-center justify-between text-sm">
                  <span className="text-slate-700">{t.name}</span>
                  <span className="text-xs text-slate-500">
                    {days} 天 · {mins} 分钟 · 能量 {energized} 次
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 最后一天 + 今日均已记录 → 生成裁决 */}
      {isLastDay && allTodayDone && (
        <div className="rounded-2xl border border-violet-100 bg-violet-50 p-5 space-y-3">
          <p className="text-sm font-semibold text-violet-900">
            {session.duration_days} 天已到，可以生成裁决了
          </p>
          <p className="text-sm text-violet-700 leading-6">
            系统会根据执行天数、阻力均值、做完后感受三个维度，给出下一阶段策略。
          </p>
          <button
            type="button"
            onClick={handleGenerateVerdict}
            className="w-full rounded-xl bg-violet-700 py-3 text-sm font-semibold text-white hover:bg-violet-600"
          >
            生成裁决
          </button>
        </div>
      )}
    </div>
  );
}
