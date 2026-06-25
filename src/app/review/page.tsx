"use client";

import { useState } from "react";

import { getApiKey } from "@/lib/api-key";
import { chat } from "@/lib/ai";
import { matchReviewRules } from "@/lib/review-rules";
import { useStore } from "@/lib/store-context";

type Step = "input" | "thinking" | "follow_up" | "done";

const SYSTEM_PROMPT = `你是锚点OS的复盘助手。用户写了今日复盘，你生成一个追问问题帮助他下次更有把握。

规则：
- 只问一个问题，20字内
- 针对复盘中最值得深入的点（抓具体行为/感受/阻力）
- 不分析不评价，只问
- 如果复盘内容完整，没有值得追问的，返回字符串 null

直接返回问题文本或 null，不要加任何其他内容。`;

export default function ReviewPage() {
  const { addDailyReview, state } = useStore();

  const today = new Date().toDateString();

  const todayLogsByTrack = state.tracks
    .map((track) => {
      const logs = state.track_logs.filter(
        (l) =>
          l.track_id === track.id &&
          new Date(l.created_at).toDateString() === today,
      );
      const totalMinutes = logs.reduce((sum, l) => sum + l.duration_minutes, 0);
      return { track, logs, totalMinutes };
    })
    .filter((t) => t.logs.length > 0);

  const [step, setStep] = useState<Step>("input");
  const [rawInput, setRawInput] = useState("");
  const [triggeredTags, setTriggeredTags] = useState<string[]>([]);
  const [followUpQuestion, setFollowUpQuestion] = useState<string | null>(null);
  const [followUpResponse, setFollowUpResponse] = useState("");
  const [streamingQuestion, setStreamingQuestion] = useState("");
  const [usingAI, setUsingAI] = useState(false);

  async function handleInputSubmit() {
    const text = rawInput.trim();
    if (!text) return;

    const apiKey = getApiKey();
    setStep("thinking");
    setStreamingQuestion("");

    if (!apiKey) {
      // fallback
      const rules = matchReviewRules(text);
      setTriggeredTags(rules.map((r) => r.tag));
      const q = rules.find((r) => r.follow_up)?.follow_up ?? null;
      setFollowUpQuestion(q);
      setUsingAI(false);
      setStep("follow_up");
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
          setStreamingQuestion(accumulated);
        },
      );

      const q = accumulated.trim() === "null" ? null : accumulated.trim();
      setFollowUpQuestion(q);
      setTriggeredTags(["AI复盘"]);
      setStep("follow_up");
    } catch {
      // AI 失败 → 回退规则
      const rules = matchReviewRules(text);
      setTriggeredTags(rules.map((r) => r.tag));
      const q = rules.find((r) => r.follow_up)?.follow_up ?? null;
      setFollowUpQuestion(q);
      setUsingAI(false);
      setStep("follow_up");
    }
  }

  function handleSave(skipped: boolean) {
    addDailyReview({
      raw_input: rawInput.trim(),
      triggered_tags: triggeredTags,
      follow_up_response: skipped ? null : followUpResponse.trim() || null,
    });
    setStep("done");
  }

  function handleReset() {
    setStep("input");
    setRawInput("");
    setTriggeredTags([]);
    setFollowUpQuestion(null);
    setFollowUpResponse("");
    setStreamingQuestion("");
  }

  const todayCount = state.daily_reviews.filter(
    (r) => new Date(r.created_at).toDateString() === new Date().toDateString(),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">复盘</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          写下今天发生了什么，不用整理，随意倾倒就行。
        </p>
      </div>

      {/* 今日执行参照 */}
      {todayLogsByTrack.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-3">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            今日执行记录（参照）
          </p>
          {todayLogsByTrack.map(({ track, logs, totalMinutes }) => (
            <div key={track.id}>
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-slate-800">{track.name}</p>
                <p className="text-sm font-bold text-slate-900">{totalMinutes} min</p>
              </div>
              <ul className="mt-1 space-y-0.5">
                {logs.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="rounded bg-slate-200 px-1.5 py-0.5">
                      {l.duration_minutes}min
                    </span>
                    <span>{l.note}</span>
                    <span className="text-slate-400">
                      {l.source === "timer" ? "计时" : "补记"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      )}

      {step === "input" && (
        <div className="space-y-4">
          {todayCount > 0 && (
            <p className="text-xs text-slate-400">今天已复盘 {todayCount} 次</p>
          )}
          <textarea
            autoFocus
            value={rawInput}
            onChange={(e) => setRawInput(e.target.value)}
            placeholder="今天发生了什么？感觉怎么样？做了什么或没做什么……"
            className="min-h-48 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-base leading-7 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />
          <button
            type="button"
            onClick={handleInputSubmit}
            disabled={!rawInput.trim()}
            className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
          >
            写完了
          </button>
        </div>
      )}

      {/* AI 生成追问中 */}
      {step === "thinking" && (
        <div className="space-y-5">
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-3 text-sm leading-6 text-white">
              {rawInput}
            </div>
          </div>
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700 min-w-[80px]">
              {streamingQuestion || (
                <span className="flex items-center gap-1.5 text-slate-400">
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:0ms]" />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:150ms]" />
                  <span className="inline-block h-1.5 w-1.5 animate-bounce rounded-full bg-slate-300 [animation-delay:300ms]" />
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {step === "follow_up" && (
        <div className="space-y-5">
          {/* 用户原始输入气泡 */}
          <div className="flex justify-end">
            <div className="max-w-[85%] rounded-2xl rounded-tr-sm bg-slate-900 px-4 py-3 text-sm leading-6 text-white">
              {rawInput}
            </div>
          </div>

          {/* 系统回复 */}
          <div className="flex justify-start">
            <div className="max-w-[85%] rounded-2xl rounded-tl-sm border border-slate-200 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-700">
              {followUpQuestion ?? "已记录。"}
              {usingAI && (
                <span className="ml-1 rounded-full bg-violet-100 px-1.5 py-0.5 text-[10px] text-violet-600">
                  AI
                </span>
              )}
            </div>
          </div>

          {followUpQuestion && (
            <div className="space-y-3">
              <textarea
                autoFocus
                value={followUpResponse}
                onChange={(e) => setFollowUpResponse(e.target.value)}
                placeholder="可以简单回应，也可以不回答……"
                className="min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-base leading-7 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleSave(false)}
                  className="flex-1 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
                >
                  保存
                </button>
                <button
                  type="button"
                  onClick={() => handleSave(true)}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500 hover:bg-slate-50"
                >
                  跳过
                </button>
              </div>
            </div>
          )}

          {!followUpQuestion && (
            <button
              type="button"
              onClick={() => handleSave(true)}
              className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              保存
            </button>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
            <p className="text-sm font-medium text-emerald-800">已记录。</p>
            {triggeredTags.length > 0 && (
              <p className="text-xs text-emerald-600">
                标签：{triggeredTags.join("、")}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={handleReset}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            再复盘一条
          </button>

          {state.daily_reviews.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-medium text-slate-600">历史复盘</h2>
              <div className="space-y-3">
                {state.daily_reviews.slice(0, 5).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl border border-slate-200 bg-white p-4 space-y-1"
                  >
                    <p className="text-sm leading-6 text-slate-800 line-clamp-2">
                      {r.raw_input}
                    </p>
                    <p className="text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleString("zh-CN", {
                        month: "numeric",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                      　{r.triggered_tags.join(" · ")}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
