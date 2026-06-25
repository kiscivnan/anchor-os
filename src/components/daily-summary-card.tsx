"use client";

import { useState } from "react";

import { getApiKey } from "@/lib/api-key";
import { chat } from "@/lib/ai";
import { generateDailySummary } from "@/lib/generate-daily-summary";
import { useStore } from "@/lib/store-context";

const SYSTEM_PROMPT = `你是锚点OS的今日总结助手。根据用户提供的当日数据，生成一段简短的今日总结。

要求：
- 不超过120字，4-5句话
- 陈述事实，不鼓励不评判
- 如果有情绪信号（麻木/自责/偏移）轻描淡写提一句
- 最后一句给明天一个轻裁决（一个可以做的最小动作）
- 用第二人称"你"
- 保持冷静克制的语气`;

export function DailySummaryCard() {
  const { state, hydrated } = useStore();
  const [aiSummary, setAiSummary] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (!hydrated) return null;

  const summary = generateDailySummary(state);
  if (!summary.has_data) return null;

  const hasApiKey = Boolean(getApiKey());

  async function handleAiSummary() {
    const apiKey = getApiKey();
    if (!apiKey) return;
    setLoading(true);
    setAiSummary("");
    setDone(false);

    const contextLines = [
      summary.facts && `今日事实：${summary.facts}`,
      summary.growth_evidence && `成长证据：${summary.growth_evidence}`,
      summary.resistance && `启动阻力：${summary.resistance}`,
      summary.emotional_signal && `情绪信号：${summary.emotional_signal}`,
    ].filter(Boolean).join("\n");

    try {
      let accumulated = "";
      await chat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: contextLines },
        ],
        apiKey,
        (chunk) => {
          accumulated += chunk;
          setAiSummary(accumulated);
        },
      );
      setDone(true);
    } catch {
      setAiSummary("AI 总结生成失败，请检查 API Key。");
      setDone(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
          今日总结
        </p>
        {hasApiKey && !done && (
          <button
            type="button"
            onClick={handleAiSummary}
            disabled={loading}
            className="rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-medium text-violet-700 hover:bg-violet-100 disabled:opacity-50"
          >
            {loading ? "生成中…" : "AI 解读"}
          </button>
        )}
      </div>

      {/* AI 生成的总结 */}
      {(aiSummary || loading) && (
        <div className="rounded-xl border border-violet-100 bg-violet-50 p-4">
          {aiSummary ? (
            <p className="text-sm leading-7 text-violet-900 whitespace-pre-wrap">{aiSummary}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-violet-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-violet-300" />
              生成中…
            </div>
          )}
          {done && (
            <button
              type="button"
              onClick={() => { setAiSummary(""); setDone(false); }}
              className="mt-3 text-xs text-violet-500 hover:text-violet-700"
            >
              收起
            </button>
          )}
        </div>
      )}

      {/* 规则生成的结构化总结 */}
      {!aiSummary && (
        <>
          <div>
            <p className="text-xs font-medium text-slate-500 mb-1">今日事实</p>
            <p className="text-sm leading-6 text-slate-800">{summary.facts}</p>
          </div>

          {summary.growth_evidence && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3">
              <p className="text-xs font-medium text-emerald-600 mb-1">成长证据</p>
              <p className="text-sm leading-6 text-emerald-800">{summary.growth_evidence}</p>
            </div>
          )}

          {summary.resistance && (
            <div>
              <p className="text-xs font-medium text-slate-500 mb-1">启动阻力</p>
              <p className="text-sm leading-6 text-slate-600">{summary.resistance}</p>
            </div>
          )}

          {summary.emotional_signal && (
            <div className="rounded-xl bg-orange-50 border border-orange-100 px-4 py-3">
              <p className="text-xs font-medium text-orange-600 mb-1">情绪信号</p>
              <p className="text-sm leading-6 text-orange-800">{summary.emotional_signal}</p>
            </div>
          )}

          <div className="border-t border-slate-100 pt-3">
            <p className="text-xs font-medium text-slate-500 mb-1">明日轻裁决</p>
            <p className="text-sm leading-6 text-slate-800">{summary.tomorrow_note}</p>
          </div>
        </>
      )}
    </section>
  );
}
