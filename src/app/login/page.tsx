"use client";

import { useState } from "react";

import { createClient } from "@/lib/supabase";

type Mode = "magic" | "password";
type Step = "form" | "sent";

export default function LoginPage() {
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("magic");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleMagicLink() {
    if (!email.trim()) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: window.location.origin + "/anchor" },
    });
    if (err) setError(err.message);
    else setStep("sent");
    setLoading(false);
  }

  async function handlePassword() {
    if (!email.trim() || !password) return;
    setLoading(true);
    setError("");
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      // 账号不存在时尝试注册
      if (err.message.includes("Invalid login credentials")) {
        const { error: signUpErr } = await supabase.auth.signUp({
          email: email.trim(),
          password,
        });
        if (signUpErr) setError(signUpErr.message);
        else window.location.href = "/anchor";
      } else {
        setError(err.message);
      }
    } else {
      window.location.href = "/anchor";
    }
    setLoading(false);
  }

  if (step === "sent") {
    return (
      <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-white px-6">
        <div className="w-full space-y-6 text-center">
          <div className="space-y-2">
            <p className="text-4xl">📬</p>
            <h1 className="text-xl font-semibold text-slate-900">邮件已发送</h1>
            <p className="text-sm leading-6 text-slate-500">
              打开发送到 <span className="font-medium text-slate-800">{email}</span> 的邮件，
              点击链接即可登录。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setStep("form")}
            className="text-sm text-slate-400 hover:text-slate-600"
          >
            重新发送
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center bg-white px-6">
      <div className="w-full space-y-8">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            锚点 OS
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-950">登录</h1>
          <p className="mt-1 text-sm text-slate-500">登录后数据自动同步到云端。</p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-800">邮箱</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") mode === "magic" ? handleMagicLink() : undefined;
              }}
              placeholder="you@example.com"
              autoComplete="email"
              className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
            />
          </div>

          {mode === "password" && (
            <div>
              <label className="text-sm font-medium text-slate-800">密码</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePassword()}
                placeholder="首次登录将自动注册"
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-4 focus:ring-slate-100"
              />
            </div>
          )}

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">{error}</p>
          )}

          {mode === "magic" ? (
            <button
              type="button"
              onClick={handleMagicLink}
              disabled={!email.trim() || loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              {loading ? "发送中…" : "发送登录链接"}
            </button>
          ) : (
            <button
              type="button"
              onClick={handlePassword}
              disabled={!email.trim() || !password || loading}
              className="w-full rounded-xl bg-slate-900 py-3 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-40"
            >
              {loading ? "登录中…" : "登录 / 注册"}
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              setMode(mode === "magic" ? "password" : "magic");
              setError("");
            }}
            className="w-full text-center text-sm text-slate-400 hover:text-slate-600"
          >
            {mode === "magic" ? "改用密码登录" : "改用邮件链接登录"}
          </button>
        </div>
      </div>
    </div>
  );
}
