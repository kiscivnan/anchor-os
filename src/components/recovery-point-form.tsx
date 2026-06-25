"use client";

import { useState } from "react";

import { useStore } from "@/lib/store-context";

export function RecoveryPointForm() {
  const { addRecoveryPoint } = useStore();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState("");
  const [done, setDone] = useState(false);

  function handleSave() {
    if (!action.trim()) return;
    addRecoveryPoint({ from_state: null, action_taken: action.trim(), note: null });
    setAction("");
    setOpen(false);
    setDone(true);
    setTimeout(() => setDone(false), 3000);
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
        <p className="text-sm font-medium text-emerald-800">
          记下了。今天又多了一次回来。
        </p>
      </div>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-2xl border-2 border-dashed border-emerald-300 bg-white py-4 text-sm font-medium text-emerald-700 transition hover:border-emerald-400 hover:bg-emerald-50"
      >
        + 记录一个恢复点
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
      <p className="text-sm font-medium text-emerald-800">你做了什么让自己回来了？</p>
      <input
        type="text"
        autoFocus
        value={action}
        onChange={(e) => setAction(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSave()}
        placeholder="例如：站起来喝了水；关掉了多余的标签页……"
        className="w-full rounded-xl border border-emerald-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={!action.trim()}
          className="flex-1 rounded-xl bg-emerald-700 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:opacity-40"
        >
          记下来
        </button>
        <button
          type="button"
          onClick={() => { setOpen(false); setAction(""); }}
          className="rounded-xl border border-emerald-200 bg-white px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50"
        >
          取消
        </button>
      </div>
    </div>
  );
}
