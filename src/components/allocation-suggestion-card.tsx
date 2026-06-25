"use client";

import { useRouter } from "next/navigation";

import { useStore } from "@/lib/store-context";

export function AllocationSuggestionCard() {
  const { pendingSuggestion, acceptSuggestion, rejectSuggestion } = useStore();
  const router = useRouter();

  if (!pendingSuggestion) return null;

  function handleAccept() {
    acceptSuggestion();
  }

  function handleReject() {
    rejectSuggestion();
    router.push("/tracks");
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-amber-700">
          今日分配建议
        </p>
        <p className="mt-2 text-sm leading-6 text-slate-700">
          {pendingSuggestion.suggestion_reason}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
            预算 {pendingSuggestion.suggested_budget} 分钟
          </span>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
          className="flex-1 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700"
        >
          用这个安排
        </button>
        <button
          type="button"
          onClick={handleReject}
          className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
        >
          我自己调
        </button>
      </div>
    </div>
  );
}
