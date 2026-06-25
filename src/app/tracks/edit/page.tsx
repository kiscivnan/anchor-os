"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useStore } from "@/lib/store-context";
import { TRACK_STATUS, TRACK_STATUS_LABELS, type Track, type TrackStatus } from "@/types";

const STATUS_OPTIONS: TrackStatus[] = [
  TRACK_STATUS.ACTIVE,
  TRACK_STATUS.PAUSED,
  TRACK_STATUS.DONE,
];

const inputClass =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100";

function TrackForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Track, "id">;
  onSave: (data: Omit<Track, "id">) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [action, setAction] = useState(initial.today_action);
  const [weight, setWeight] = useState(String(initial.weight));
  const [status, setStatus] = useState<TrackStatus>(initial.status);

  function handleSave() {
    const w = parseInt(weight, 10);
    if (!name.trim() || !action.trim() || isNaN(w) || w < 1) return;
    onSave({ name: name.trim(), today_action: action.trim(), weight: w, status });
  }

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
      <div>
        <label className="text-sm font-medium text-slate-800">轨道名称</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：学习系统设计"
          className={`mt-2 ${inputClass}`}
        />
      </div>
      <div>
        <label className="text-sm font-medium text-slate-800">今日动作</label>
        <input
          type="text"
          value={action}
          onChange={(e) => setAction(e.target.value)}
          placeholder="例如：阅读 + 做一个小笔记"
          className={`mt-2 ${inputClass}`}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-slate-800">
            权重 <span className="font-bold text-slate-900">{weight}</span>
            <span className="ml-1 text-xs font-normal text-slate-400">/ 5</span>
          </label>
          <input
            type="range"
            min={1}
            max={5}
            step={1}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-3 w-full accent-slate-800 cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-300 mt-0.5">
            <span>低</span>
            <span>高</span>
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-slate-800">状态</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TrackStatus)}
            className={`mt-2 ${inputClass}`}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {TRACK_STATUS_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={handleSave}
          disabled={!name.trim() || !action.trim()}
          className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          保存
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}

export default function TrackEditPage() {
  const { state, addTrack, editTrack, deleteTrack } = useStore();
  const router = useRouter();
  const [addingNew, setAddingNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const emptyTrack: Omit<Track, "id"> = {
    name: "",
    today_action: "",
    weight: 2,
    status: TRACK_STATUS.ACTIVE,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-950">编辑轨道</h1>
          <p className="mt-1 text-sm text-slate-500">{state.tracks.length} 条轨道</p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm text-slate-400 hover:text-slate-700"
        >
          返回
        </button>
      </div>

      <div className="space-y-3">
        {state.tracks.map((track) =>
          editingId === track.id ? (
            <TrackForm
              key={track.id}
              initial={track}
              onSave={(data) => {
                editTrack(track.id, data);
                setEditingId(null);
              }}
              onCancel={() => setEditingId(null)}
            />
          ) : (
            <div
              key={track.id}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-slate-900">{track.name}</p>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                      {TRACK_STATUS_LABELS[track.status]}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{track.today_action}</p>
                  <p className="mt-1 text-xs text-slate-400">权重 {track.weight}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setEditingId(track.id)}
                    className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
                  >
                    编辑
                  </button>
                  {confirmDeleteId === track.id ? (
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          deleteTrack(track.id);
                          setConfirmDeleteId(null);
                        }}
                        className="rounded-lg bg-red-600 px-2.5 py-1.5 text-xs text-white"
                      >
                        确认
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-500"
                      >
                        取消
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(track.id)}
                      className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-red-500 hover:bg-red-50"
                    >
                      删除
                    </button>
                  )}
                </div>
              </div>
            </div>
          ),
        )}

        {addingNew ? (
          <TrackForm
            initial={emptyTrack}
            onSave={(data) => {
              addTrack(data);
              setAddingNew(false);
            }}
            onCancel={() => setAddingNew(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingNew(true)}
            className="w-full rounded-2xl border-2 border-dashed border-slate-300 py-4 text-sm font-medium text-slate-500 hover:border-slate-400 hover:text-slate-700"
          >
            + 添加轨道
          </button>
        )}
      </div>
    </div>
  );
}
