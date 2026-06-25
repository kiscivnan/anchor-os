"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase";

const STORAGE_KEY = "anchor-os-state";

type MigrationStatus = "idle" | "running" | "done" | "error" | "empty";

interface TableResult { table: string; count: number; error?: string }

export function DataMigration({ userId }: { userId: string }) {
  const [status, setStatus] = useState<MigrationStatus>("idle");
  const [results, setResults] = useState<TableResult[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [clearing, setClearing] = useState(false);

  const localRaw = typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEY) : null;
  const hasLocalData = Boolean(localRaw);

  async function handleMigrate() {
    if (!localRaw) { setStatus("empty"); return; }

    let local: Record<string, unknown[]>;
    try { local = JSON.parse(localRaw); }
    catch { setStatus("error"); setErrorMsg("本地数据格式损坏，无法解析。"); return; }

    setStatus("running");
    setResults([]);
    const sb = createClient();
    const tableResults: TableResult[] = [];

    const tableMap: [string, string][] = [
      ["tracks", "tracks"],
      ["sparks", "sparks"],
      ["track_logs", "track_logs"],
      ["daily_reviews", "daily_reviews"],
      ["recovery_points", "recovery_points"],
      ["action_responses", "action_responses"],
      ["ntrack_sessions", "ntrack_sessions"],
      ["ntrack_logs", "ntrack_logs"],
    ];

    for (const [localKey, sbTable] of tableMap) {
      const rows = (local[localKey] as unknown[] | undefined) ?? [];
      if (rows.length === 0) { tableResults.push({ table: sbTable, count: 0 }); continue; }

      const withUserId = (rows as Record<string, unknown>[]).map((r) => ({ ...r, user_id: userId }));
      const { error } = await sb.from(sbTable).upsert(withUserId, { onConflict: "id" });
      tableResults.push({ table: sbTable, count: error ? 0 : rows.length, error: error?.message });
    }

    // user_settings
    const budget = (local as Record<string, unknown>).total_budget_minutes as number | undefined;
    if (budget) {
      const { error } = await sb.from("user_settings").upsert({ user_id: userId, total_budget_minutes: budget, updated_at: new Date().toISOString() });
      tableResults.push({ table: "user_settings", count: error ? 0 : 1, error: error?.message });
    }

    // allocation_suggestion
    const alloc = (local as Record<string, unknown>).allocation_suggestion as Record<string, unknown> | null | undefined;
    if (alloc) {
      const { error } = await sb.from("allocation_suggestion").upsert({ ...alloc, user_id: userId });
      tableResults.push({ table: "allocation_suggestion", count: error ? 0 : 1, error: error?.message });
    }

    setResults(tableResults);
    setStatus("done");
  }

  function handleClear() {
    setClearing(true);
    localStorage.removeItem(STORAGE_KEY);
    setClearing(false);
  }

  if (!hasLocalData && status === "idle") return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 space-y-4">
      <div>
        <p className="text-sm font-semibold text-amber-900">本地数据迁移</p>
        <p className="mt-0.5 text-xs text-amber-700">
          检测到浏览器本地存有旧数据，可将其上传到云端账号下。
        </p>
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={handleMigrate}
          className="w-full rounded-xl bg-amber-800 py-2.5 text-sm font-medium text-white hover:bg-amber-700"
        >
          上传本地数据到云端
        </button>
      )}

      {status === "running" && (
        <p className="text-sm text-amber-700">迁移中…请勿关闭页面</p>
      )}

      {status === "done" && (
        <div className="space-y-3">
          <div className="space-y-1.5">
            {results.map((r) => (
              <div key={r.table} className="flex items-center justify-between text-xs">
                <span className="text-amber-800">{r.table}</span>
                {r.error
                  ? <span className="text-red-600">失败：{r.error}</span>
                  : <span className="text-emerald-700">✓ {r.count} 条</span>
                }
              </div>
            ))}
          </div>
          <p className="text-xs font-medium text-emerald-800">迁移完成。</p>
          <div className="border-t border-amber-200 pt-3">
            <p className="text-xs text-amber-700 mb-2">是否清空本地旧数据（可选，建议确认云端正常后再清）？</p>
            <button
              type="button"
              onClick={handleClear}
              disabled={clearing}
              className="rounded-xl border border-amber-300 bg-white px-4 py-2 text-xs text-amber-800 hover:bg-amber-50"
            >
              {clearing ? "清除中…" : "清空本地数据"}
            </button>
          </div>
        </div>
      )}

      {status === "error" && (
        <p className="text-sm text-red-600">{errorMsg}</p>
      )}
    </div>
  );
}
