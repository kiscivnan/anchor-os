"use client";

import { useState } from "react";

import { getApiKey } from "@/lib/api-key";
import { chat, parseJsonResponse } from "@/lib/ai";
import { classifySpark } from "@/lib/classify-spark";
import { useStore } from "@/lib/store-context";
import {
  SPARK_REMINDER_TYPE,
  SPARK_REMINDER_TYPE_LABELS,
  SPARK_STATUS,
  type Spark,
  type SparkReminderType,
} from "@/types";

const controlClassName =
  "mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100";

function SparkItem({
  spark,
  onDismiss,
}: {
  spark: Spark;
  onDismiss: (id: string) => void;
}) {
  const statusLabel =
    spark.status === SPARK_STATUS.PENDING
      ? "待处理"
      : spark.status === SPARK_STATUS.REMINDED
        ? "已提醒"
        : "已归档";

  return (
    <div className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-6 text-slate-800">{spark.content}</p>
        <div className="mt-1.5 flex flex-wrap gap-2">
          <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs text-sky-700">
            {SPARK_REMINDER_TYPE_LABELS[spark.reminder_type]}
          </span>
          {spark.reminder_time && (
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
              {spark.reminder_time.replace("T", " ")}
            </span>
          )}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-400">
            {statusLabel}
          </span>
        </div>
      </div>
      {spark.status === SPARK_STATUS.PENDING && (
        <button
          type="button"
          onClick={() => onDismiss(spark.id)}
          className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm text-slate-400 hover:bg-slate-100 hover:text-slate-600"
        >
          归档
        </button>
      )}
    </div>
  );
}

export default function SparkPage() {
  const { state, hydrated, addSpark, dismissSpark, pendingSparks } =
    useStore();

  const [content, setContent] = useState("");
  const [reminderType, setReminderType] = useState<SparkReminderType>(
    SPARK_REMINDER_TYPE.AI_JUDGED,
  );
  const [reminderTime, setReminderTime] = useState("");
  const [isUserCorrected, setIsUserCorrected] = useState(false);
  const [isEditingReminder, setIsEditingReminder] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [classifying, setClassifying] = useState(false);
  const [timingNote, setTimingNote] = useState("");
  const [classified, setClassified] = useState(false);

  const hasContent = Boolean(content.trim());

  const reminderTimingText = classified
    ? reminderType === SPARK_REMINDER_TYPE.MANUAL_TIME
      ? reminderTime
        ? `提醒时间：${reminderTime.replace("T", " ")}`
        : "请确认提醒时间。"
      : isUserCorrected
        ? "暂定在今天晚间复盘时提醒。"
        : timingNote
    : "";

  async function classifyContent(value: string) {
    if (!value.trim()) return;
    setClassifying(true);
    setClassified(false);

    const apiKey = getApiKey();

    if (!apiKey) {
      const sc = classifySpark(value);
      setReminderType(sc.reminder_type);
      setReminderTime(sc.suggested_reminder_time ?? "");
      setTimingNote(sc.timing_note);
      setClassified(true);
      setClassifying(false);
      return;
    }

    try {
      const now = new Date().toISOString().slice(0, 16);
      const result = await chat(
        [
          {
            role: "system",
            content: `判断这条念头适合哪种提醒方式。当前时间：${now}

输出严格的JSON（无markdown）：
{"type":"manual_time","suggested_time":"YYYY-MM-DDTHH:mm","note":"..."}
或
{"type":"ai_judged","suggested_time":null,"note":"今晚复盘时提醒"}

type=manual_time：用户提到了具体时间、日期或"明天/X点/下周"等
type=ai_judged：其他所有情况
note：10字内说明提醒策略`,
          },
          { role: "user", content: value },
        ],
        apiKey,
      );

      const parsed = parseJsonResponse<{ type: SparkReminderType; suggested_time: string | null; note: string }>(result);
      if (parsed) {
        setReminderType(parsed.type);
        setReminderTime(parsed.suggested_time ?? "");
        setTimingNote(parsed.note ?? "");
      } else {
        const sc = classifySpark(value);
        setReminderType(sc.reminder_type);
        setReminderTime(sc.suggested_reminder_time ?? "");
        setTimingNote(sc.timing_note);
      }
    } catch {
      const sc = classifySpark(value);
      setReminderType(sc.reminder_type);
      setReminderTime(sc.suggested_reminder_time ?? "");
      setTimingNote(sc.timing_note);
    }

    setClassified(true);
    setClassifying(false);
  }

  function handleContentChange(value: string) {
    setContent(value);
    setIsUserCorrected(false);
    setIsEditingReminder(false);
    setSubmitted(false);
    setClassified(false);
    setTimingNote("");
  }

  function handleReminderTypeChange(value: SparkReminderType) {
    setReminderType(value);
    setIsUserCorrected(true);
    if (value === SPARK_REMINDER_TYPE.AI_JUDGED) setReminderTime("");
  }

  function handleSave() {
    if (!content.trim()) return;
    addSpark({
      content: content.trim(),
      reminder_type: reminderType,
      reminder_time: reminderTime || null,
    });
    setContent("");
    setReminderType(SPARK_REMINDER_TYPE.AI_JUDGED);
    setReminderTime("");
    setIsUserCorrected(false);
    setIsEditingReminder(false);
    setSubmitted(true);
  }

  const archivedSparks = state.sparks.filter(
    (s) => s.status !== SPARK_STATUS.PENDING,
  );

  if (!hydrated) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-8 w-48 rounded-lg bg-slate-100" />
        <div className="h-40 rounded-2xl bg-slate-100" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">接住念头</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          随手写下冒出来的念头，系统判断合适时机弹回给你。
        </p>
      </div>

      {submitted && (
        <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4">
          <p className="text-sm font-medium text-sky-800">念头已记下，到时候会提醒你。</p>
        </div>
      )}

      {/* 输入区 */}
      <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
        <div>
          <label htmlFor="spark-input" className="text-sm font-medium text-slate-800">
            这个念头是什么？
          </label>
          <textarea
            id="spark-input"
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder="例如：等忙完提醒我看一下那篇文章；或：明天下午提醒我回那封邮件……"
            className="mt-2 min-h-28 w-full resize-y rounded-2xl border border-slate-300 bg-white p-4 text-base leading-7 text-slate-950 outline-none transition focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
          />
        </div>

        {/* AI 判断按钮 */}
        {hasContent && !classified && !classifying && (
          <button
            type="button"
            onClick={() => classifyContent(content)}
            className="w-full rounded-xl border border-sky-200 bg-sky-50 py-2.5 text-sm font-medium text-sky-800 hover:bg-sky-100"
          >
            AI 判断提醒时机
          </button>
        )}
        {classifying && (
          <div className="flex items-center gap-2 rounded-xl border border-sky-100 bg-sky-50 px-4 py-2.5 text-sm text-sky-600">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-sky-400" />
            判断中…
          </div>
        )}

        {classified && (
          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-sky-700">
                  提醒判断
                </p>
                <p className="mt-1 text-sm font-semibold text-slate-900">
                  {SPARK_REMINDER_TYPE_LABELS[reminderType]}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsEditingReminder((v) => !v)}
                className="shrink-0 rounded-lg px-2.5 py-1.5 text-sm font-medium text-sky-800 hover:bg-sky-100"
              >
                {isEditingReminder ? "收起" : "修改"}
              </button>
            </div>

            <p className="mt-2 text-sm leading-6 text-slate-600">{reminderTimingText}</p>

            {isUserCorrected && (
              <p className="mt-1 text-xs text-sky-600">已按你的修正更新。</p>
            )}

            {isEditingReminder && (
              <div className="mt-4 space-y-4 border-t border-sky-200 pt-4">
                <div>
                  <label htmlFor="reminder-type" className="text-sm font-medium text-slate-800">
                    提醒类型
                  </label>
                  <select
                    id="reminder-type"
                    value={reminderType}
                    onChange={(e) => handleReminderTypeChange(e.target.value as SparkReminderType)}
                    className={controlClassName}
                  >
                    <option value={SPARK_REMINDER_TYPE.MANUAL_TIME}>计划任务型</option>
                    <option value={SPARK_REMINDER_TYPE.AI_JUDGED}>待提醒念头型</option>
                  </select>
                </div>

                {reminderType === SPARK_REMINDER_TYPE.MANUAL_TIME && (
                  <div>
                    <label htmlFor="reminder-time" className="text-sm font-medium text-slate-800">
                      提醒时间
                    </label>
                    <input
                      id="reminder-time"
                      type="datetime-local"
                      value={reminderTime}
                      onInput={(e) => {
                        setReminderTime(e.currentTarget.value);
                        setIsUserCorrected(true);
                      }}
                      className={controlClassName}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSave}
          disabled={!hasContent}
          className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-40"
        >
          记下这个念头
        </button>
      </div>

      {/* 待处理念头列表 */}
      {pendingSparks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-600">
            待处理 · {pendingSparks.length} 条
          </h2>
          <div className="space-y-3">
            {pendingSparks.map((spark) => (
              <SparkItem key={spark.id} spark={spark} onDismiss={dismissSpark} />
            ))}
          </div>
        </section>
      )}

      {/* 已归档 */}
      {archivedSparks.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium text-slate-400">
            已归档 · {archivedSparks.length} 条
          </h2>
          <div className="space-y-3">
            {archivedSparks.slice(0, 5).map((spark) => (
              <SparkItem key={spark.id} spark={spark} onDismiss={dismissSpark} />
            ))}
          </div>
        </section>
      )}

      {state.sparks.length === 0 && (
        <p className="text-center text-sm text-slate-400 py-8">
          还没有念头。随时冒出来就写在这里。
        </p>
      )}
    </div>
  );
}
