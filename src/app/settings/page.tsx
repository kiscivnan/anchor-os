"use client";

import { useEffect, useState } from "react";

import { DataMigration } from "@/components/data-migration";
import { getApiKey, saveApiKey } from "@/lib/api-key";
import { chat } from "@/lib/ai";
import {
  getNotificationPermission,
  requestNotificationPermission,
  scheduleSparkReminders,
  type NotificationSupport,
} from "@/lib/notifications";
import { createClient } from "@/lib/supabase";
import { useStore } from "@/lib/store-context";

const PERMISSION_LABEL: Record<NotificationSupport, string> = {
  unsupported: "此浏览器不支持通知",
  default: "未授权",
  granted: "已授权 ✓",
  denied: "已拒绝（请在浏览器设置中手动开启）",
};

const PERMISSION_COLOR: Record<NotificationSupport, string> = {
  unsupported: "text-slate-400",
  default: "text-amber-600",
  granted: "text-emerald-700",
  denied: "text-red-600",
};

export default function SettingsPage() {
  const { state, userId, isSupabaseConfigured } = useStore();
  const sb = createClient();

  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [key, setKey] = useState("");
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"ok" | "fail" | null>(null);

  const [permission, setPermission] = useState<NotificationSupport>("default");
  const [requesting, setRequesting] = useState(false);
  const [scheduledCount, setScheduledCount] = useState<number | null>(null);

  useEffect(() => {
    setKey(getApiKey());
    setPermission(getNotificationPermission());
  }, []);

  useEffect(() => {
    if (!userId || !isSupabaseConfigured) return;
    sb.auth.getUser().then(({ data }) => setUserEmail(data.user?.email ?? null));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 监听 SW 调度回执
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;
    const handler = (event: MessageEvent) => {
      if (event.data?.type === "REMINDERS_SCHEDULED") {
        setScheduledCount(event.data.count as number);
      }
    };
    navigator.serviceWorker.addEventListener("message", handler);
    return () => navigator.serviceWorker.removeEventListener("message", handler);
  }, []);

  function handleSave() {
    saveApiKey(key);
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 2000);
  }

  async function handleTest() {
    const k = key.trim();
    if (!k) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await chat([{ role: "user", content: "回复一个字：好" }], k);
      setTestResult(res.trim() ? "ok" : "fail");
    } catch {
      setTestResult("fail");
    } finally {
      setTesting(false);
    }
  }

  async function handleRequestPermission() {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      await scheduleSparkReminders(state.sparks);
    }
    setRequesting(false);
  }

  async function handleReschedule() {
    await scheduleSparkReminders(state.sparks);
  }

  const pendingWithTime = state.sparks.filter(
    (s) =>
      s.status === "pending" &&
      s.reminder_type === "manual_time" &&
      s.reminder_time !== null &&
      new Date(s.reminder_time!).getTime() > Date.now(),
  ).length;

  const masked =
    key.length > 8
      ? `${key.slice(0, 4)}${"·".repeat(Math.min(key.length - 8, 16))}${key.slice(-4)}`
      : key;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-950">设置</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          通知与 AI 配置。所有数据仅存储在本地。
        </p>
      </div>

      {/* 账户 */}
      {isSupabaseConfigured && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
          <p className="text-sm font-semibold text-slate-900">账户</p>
          {userId ? (
            <>
              <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                <span className="text-sm text-slate-600">{userEmail ?? "已登录"}</span>
                <span className="text-xs text-emerald-700 font-medium">已同步</span>
              </div>
              {userId && <DataMigration userId={userId} />}
              <button
                type="button"
                onClick={async () => { await sb.auth.signOut(); window.location.href = "/login"; }}
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-600 hover:bg-slate-50"
              >
                退出登录
              </button>
            </>
          ) : (
            <a
              href="/login"
              className="block w-full rounded-xl bg-slate-900 py-2.5 text-center text-sm font-medium text-white hover:bg-slate-700"
            >
              登录 / 注册
            </a>
          )}
        </div>
      )}

      {/* 通知权限 */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">念头提醒通知</p>
          <p className="mt-0.5 text-xs text-slate-400">
            到达提醒时间时，弹出系统通知。浏览器进程需保持运行。
          </p>
        </div>

        <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
          <span className="text-sm text-slate-700">通知权限</span>
          <span className={`text-sm font-medium ${PERMISSION_COLOR[permission]}`}>
            {PERMISSION_LABEL[permission]}
          </span>
        </div>

        {permission === "default" && (
          <button
            type="button"
            onClick={handleRequestPermission}
            disabled={requesting}
            className="w-full rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
          >
            {requesting ? "请求中…" : "开启通知权限"}
          </button>
        )}

        {permission === "granted" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-600">待触发的念头提醒</span>
              <span className="font-semibold text-slate-900">{pendingWithTime} 条</span>
            </div>
            {scheduledCount !== null && (
              <p className="text-xs text-emerald-700">
                已向 Service Worker 调度 {scheduledCount} 条提醒。
              </p>
            )}
            <button
              type="button"
              onClick={handleReschedule}
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 text-sm text-slate-600 hover:bg-slate-50"
            >
              重新调度提醒
            </button>
          </div>
        )}

        {permission === "denied" && (
          <p className="text-xs text-red-500">
            已被拒绝。请在浏览器地址栏左侧点击锁形图标 → 通知 → 允许，然后刷新页面。
          </p>
        )}
      </div>

      {/* DeepSeek API Key */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
        <div>
          <p className="text-sm font-semibold text-slate-900">DeepSeek API Key</p>
          <p className="mt-0.5 text-xs text-slate-400">
            前往 platform.deepseek.com → API Keys → 创建
          </p>
        </div>

        <input
          type="password"
          value={key}
          onChange={(e) => {
            setKey(e.target.value);
            setSaved(false);
            setTestResult(null);
          }}
          placeholder="sk-..."
          className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
        />

        {key.length > 8 && <p className="text-xs text-slate-400">{masked}</p>}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 rounded-xl bg-slate-900 py-2.5 text-sm font-medium text-white hover:bg-slate-700"
          >
            {saved ? "已保存 ✓" : "保存"}
          </button>
          <button
            type="button"
            onClick={handleTest}
            disabled={!key.trim() || testing}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            {testing ? "测试中…" : "测试连接"}
          </button>
        </div>

        {testResult === "ok" && (
          <p className="text-sm font-medium text-emerald-700">连接正常，AI 功能已就绪。</p>
        )}
        {testResult === "fail" && (
          <p className="text-sm text-red-600">连接失败，请检查 Key 是否正确。</p>
        )}
      </div>

      <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 space-y-3">
        <p className="text-xs font-medium uppercase tracking-wider text-slate-400">AI 功能覆盖范围</p>
        <ul className="space-y-1.5 text-sm text-slate-600">
          <li>· 偏移识别 — 识别偏移类型 + 生成建议动作</li>
          <li>· 复盘追问 — 根据你写的内容生成一个追问</li>
          <li>· 念头分类 — 判断念头提醒时机</li>
          <li>· 今日总结 — 按需生成当日数据解读</li>
        </ul>
        <p className="text-xs text-slate-400">未配置 Key 时，以上功能自动回退到规则模式。</p>
      </div>
    </div>
  );
}
