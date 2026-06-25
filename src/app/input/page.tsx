"use client";

import { useState } from "react";

import { getApiKey } from "@/lib/api-key";
import { chat, parseJsonResponse } from "@/lib/ai";
import { classifyEntry } from "@/lib/classify-entry";
import { INPUT_STATE_LABELS, type InputResult, type InputState } from "@/types";

const SYSTEM_PROMPT = `你是锚点OS的偏移识别系统。用户描述当前状态，你识别偏移类型并给出重新进入建议。

输出严格按这个JSON格式，不要加markdown代码块：
{"state":"time_loss","suggestion":"...","next_action":"..."}

state 只能是以下五个值之一：
- time_loss（时间出现偏移）
- plan_hype（计划正在扩张）
- ai_spiral（信息形成循环）
- multi_track（多轨分配拥挤）
- unclassified（偏移尚待确认）

suggestion：一句话，25字内，直接说现在可以做什么，不分析
next_action：一个5分钟内能完成的具体动作，动词开头，20字内

保持简短克制。`;

type Status = "idle" | "loading" | "done" | "error";

export default function InputPage() {
  const [entry, setEntry] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [streamText, setStreamText] = useState("");
  const [result, setResult] = useState<InputResult | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [usingAI, setUsingAI] = useState(false);

  async function handleAnalyze() {
    const text = entry.trim();
    if (!text) return;

    const apiKey = getApiKey();
    setStatus("loading");
    setStreamText("");
    setResult(null);
    setErrorMsg("");

    if (!apiKey) {
      // fallback to rule-based
      const r = classifyEntry(text);
      setResult(r);
      setUsingAI(false);
      setStatus("done");
      return;
    }

    setUsingAI(true);
    try {
      let accumulated = "";
      await chat(
        [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: text },
        ],
        apiKey,
        (chunk) => {
          accumulated += chunk;
          setStreamText(accumulated);
        },
      );

      const parsed = parseJsonResponse<{ state: InputState; suggestion: string; next_action: string }>(accumulated);
      if (parsed?.state && parsed.suggestion && parsed.next_action) {
        setResult(parsed);
        setStatus("done");
      } else {
        // AI returned something but not parseable JSON — show as plain text
        setResult({
          state: "unclassified",
          suggestion: accumulated,
          next_action: "参考上方建议，选择一个小动作开始。",
        });
        setStatus("done");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "请求失败，请检查 API Key 或网络。");
      setStatus("error");
    }
  }

  function handleReset() {
    setEntry("");
    setStatus("idle");
    setStreamText("");
    setResult(null);
    setErrorMsg("");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">识别偏移</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          写下此刻发生了什么，识别偏移类型，找回一个小动作。
        </p>
      </div>

      <div>
        <label htmlFor="entry" className="text-sm font-medium text-slate-800">
          此刻发生了什么？
        </label>
        <textarea
          id="entry"
          value={entry}
          onChange={(e) => {
            setEntry(e.target.value);
            if (status !== "idle") {
              setStatus("idle");
              setResult(null);
              setStreamText("");
            }
          }}
          placeholder="例如：今天有点糊掉；觉得自己浪费时间；查了太多资料没有进展……"
          className="mt-2 min-h-36 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-base leading-7 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />
      </div>

      {status === "idle" && (
        <button
          type="button"
          onClick={handleAnalyze}
          disabled={!entry.trim()}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          识别偏移
        </button>
      )}

      {/* 流式输出中 */}
      {status === "loading" && (
        <section className="min-h-44 rounded-2xl border border-slate-200 bg-slate-50 p-5">
          {streamText ? (
            <p className="text-sm leading-6 text-slate-600 whitespace-pre-wrap">{streamText}</p>
          ) : (
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span className="inline-block h-2 w-2 animate-pulse rounded-full bg-slate-300" />
              分析中…
            </div>
          )}
        </section>
      )}

      {/* 结果 */}
      {status === "done" && result && (
        <section aria-live="polite" className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                当前偏移
                {usingAI && (
                  <span className="ml-2 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-600 normal-case">
                    AI
                  </span>
                )}
              </p>
              <p className="mt-1 text-lg font-semibold text-slate-900">
                {INPUT_STATE_LABELS[result.state]}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">锚点建议</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{result.suggestion}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900">重新进入动作</p>
              <p className="mt-1 text-sm leading-6 text-slate-600">{result.next_action}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            重新输入
          </button>
        </section>
      )}

      {/* 错误 */}
      {status === "error" && (
        <section className="space-y-3">
          <div className="rounded-2xl border border-red-100 bg-red-50 p-4">
            <p className="text-sm text-red-700">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setStatus("idle");
              setErrorMsg("");
            }}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            重试
          </button>
        </section>
      )}

      {status === "idle" && (
        <p className="text-xs text-center text-slate-400">
          做完小动作后，回到「今日」页记录恢复点。
        </p>
      )}
    </div>
  );
}
