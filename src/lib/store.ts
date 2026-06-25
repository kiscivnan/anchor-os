"use client";

import { useCallback, useEffect, useState } from "react";

import { computeAllocationSuggestion } from "@/lib/suggest-allocation";
import { createClient } from "@/lib/supabase";
import {
  NTRACK_STATUS,
  SPARK_REMINDER_TYPE,
  SPARK_STATUS,
  SUGGESTION_STATUS,
  TRACK_STATUS,
  type ActionResponseRecord,
  type AllocationSuggestion,
  type AppState,
  type DailyReview,
  type NTrackDailyLog,
  type NTrackItem,
  type NTrackSession,
  type NTrackVerdict,
  type RecoveryPointRecord,
  type Spark,
  type TimeStructureReview,
  type Track,
  type TrackLog,
} from "@/types";

// ── 是否已配置 Supabase ────────────────────────────────────────
const isSupabaseConfigured =
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

const defaultState: AppState = {
  tracks: [
    { id: "system-design", name: "学习系统设计", weight: 3, today_action: "阅读 + 做一个小笔记", status: TRACK_STATUS.ACTIVE },
    { id: "body-recovery", name: "身体恢复", weight: 2, today_action: "轻运动 + 拉伸", status: TRACK_STATUS.ACTIVE },
    { id: "information-organizing", name: "信息整理", weight: 1, today_action: "清理待办 + 归档", status: TRACK_STATUS.PAUSED },
  ],
  total_budget_minutes: 50,
  sparks: [],
  recovery_points: [],
  reviews: [],
  daily_reviews: [],
  allocation_suggestion: null,
  action_responses: [],
  track_logs: [],
  ntrack_sessions: [],
  ntrack_logs: [],
};

// ── localStorage 回退 ──────────────────────────────────────────
const STORAGE_KEY = "anchor-os-state";

function loadLocal(): AppState {
  if (typeof window === "undefined") return defaultState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    return { ...defaultState, ...JSON.parse(raw) };
  } catch { return defaultState; }
}

function saveLocal(state: AppState): void {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch { /* ignore */ }
}

// ── Supabase 批量拉取 ──────────────────────────────────────────
async function fetchAllFromSupabase(userId: string): Promise<AppState> {
  const sb = createClient();
  const [
    { data: tracks },
    { data: trackLogs },
    { data: sparks },
    { data: dailyReviews },
    { data: recoveryPoints },
    { data: actionResponses },
    { data: allocationRow },
    { data: ntSessions },
    { data: ntLogs },
    { data: settings },
  ] = await Promise.all([
    sb.from("tracks").select("*").eq("user_id", userId).order("created_at"),
    sb.from("track_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("sparks").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("daily_reviews").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("recovery_points").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("action_responses").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("allocation_suggestion").select("*").eq("user_id", userId).maybeSingle(),
    sb.from("ntrack_sessions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("ntrack_logs").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    sb.from("user_settings").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const allocation: AllocationSuggestion | null = allocationRow
    ? {
        suggested_budget: allocationRow.suggested_budget,
        suggested_weights: allocationRow.suggested_weights,
        suggestion_reason: allocationRow.suggestion_reason,
        suggestion_status: allocationRow.suggestion_status,
        generated_at: allocationRow.generated_at,
      }
    : null;

  return {
    tracks: (tracks ?? []) as Track[],
    total_budget_minutes: settings?.total_budget_minutes ?? 50,
    sparks: (sparks ?? []) as Spark[],
    recovery_points: (recoveryPoints ?? []) as RecoveryPointRecord[],
    reviews: [],
    daily_reviews: (dailyReviews ?? []) as DailyReview[],
    allocation_suggestion: allocation,
    action_responses: (actionResponses ?? []) as ActionResponseRecord[],
    track_logs: (trackLogs ?? []) as TrackLog[],
    ntrack_sessions: (ntSessions ?? []) as NTrackSession[],
    ntrack_logs: (ntLogs ?? []) as NTrackDailyLog[],
  };
}

// ── Main hook ───────────────────────────────────────────────────
export function useAppStore() {
  const [state, setState] = useState<AppState>(defaultState);
  const [hydrated, setHydrated] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const sb = createClient();

  // 监听 Auth
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    sb.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: { subscription } } = sb.auth.onAuthStateChange((_, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hydration
  useEffect(() => {
    if (!isSupabaseConfigured) {
      const loaded = loadLocal();
      const suggestion = computeAllocationSuggestion(loaded.daily_reviews, loaded.tracks, loaded.total_budget_minutes);
      const hasPending = loaded.allocation_suggestion?.suggestion_status === SUGGESTION_STATUS.PENDING;
      const next = hasPending ? loaded : { ...loaded, allocation_suggestion: suggestion };
      setState(next);
      saveLocal(next);
      setHydrated(true);
      return;
    }

    if (userId === null) {
      // 未登录：用本地数据
      const loaded = loadLocal();
      setState(loaded);
      setHydrated(true);
      return;
    }

    fetchAllFromSupabase(userId).then((data) => {
      const hasPending = data.allocation_suggestion?.suggestion_status === SUGGESTION_STATUS.PENDING;
      if (!hasPending) {
        const suggestion = computeAllocationSuggestion(data.daily_reviews, data.tracks, data.total_budget_minutes);
        if (suggestion) {
          data.allocation_suggestion = suggestion;
          sb.from("allocation_suggestion").upsert({
            user_id: userId,
            suggested_budget: suggestion.suggested_budget,
            suggested_weights: suggestion.suggested_weights,
            suggestion_reason: suggestion.suggestion_reason,
            suggestion_status: suggestion.suggestion_status,
            generated_at: suggestion.generated_at,
          }).then();
        }
      }
      setState(data);
      setHydrated(true);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // 通用更新（isSupabaseConfigured 为 false 时同时写 localStorage）
  const updateState = useCallback((updater: (prev: AppState) => AppState) => {
    setState((prev) => {
      const next = updater(prev);
      if (!isSupabaseConfigured) saveLocal(next);
      return next;
    });
  }, []);

  // ── Sparks ─────────────────────────────────────────────────
  const addSpark = useCallback(
    (spark: Omit<Spark, "id" | "created_at" | "status" | "is_user_corrected">) => {
      const newSpark: Spark = {
        ...spark,
        id: `spark-${Date.now()}`,
        created_at: new Date().toISOString(),
        status: SPARK_STATUS.PENDING,
        is_user_corrected: false,
      };
      updateState((prev) => ({ ...prev, sparks: [newSpark, ...prev.sparks] }));
      if (userId) sb.from("sparks").insert({ ...newSpark, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  const updateSpark = useCallback(
    (id: string, changes: Partial<Spark>) => {
      updateState((prev) => ({ ...prev, sparks: prev.sparks.map((s) => s.id === id ? { ...s, ...changes } : s) }));
      if (userId) sb.from("sparks").update(changes).eq("id", id).eq("user_id", userId).then();
    },
    [updateState, userId, sb],
  );

  const dismissSpark = useCallback(
    (id: string) => updateSpark(id, { status: SPARK_STATUS.RESOLVED }),
    [updateSpark],
  );

  // ── Recovery points ─────────────────────────────────────────
  const addRecoveryPoint = useCallback(
    (record: Omit<RecoveryPointRecord, "id" | "created_at">) => {
      const newRp: RecoveryPointRecord = { ...record, id: `rp-${Date.now()}`, created_at: new Date().toISOString() };
      updateState((prev) => ({ ...prev, recovery_points: [newRp, ...prev.recovery_points] }));
      if (userId) sb.from("recovery_points").insert({ ...newRp, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  // ── Tracks ──────────────────────────────────────────────────
  const updateTracks = useCallback(
    (tracks: Track[]) => {
      updateState((prev) => ({ ...prev, tracks }));
      if (userId) sb.from("tracks").upsert(tracks.map((t) => ({ ...t, user_id: userId }))).then();
    },
    [updateState, userId, sb],
  );

  const addTrack = useCallback(
    (track: Omit<Track, "id">) => {
      const newTrack: Track = { ...track, id: `track-${Date.now()}` };
      updateState((prev) => ({ ...prev, tracks: [...prev.tracks, newTrack] }));
      if (userId) sb.from("tracks").insert({ ...newTrack, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  const editTrack = useCallback(
    (id: string, changes: Partial<Omit<Track, "id">>) => {
      updateState((prev) => ({ ...prev, tracks: prev.tracks.map((t) => t.id === id ? { ...t, ...changes } : t) }));
      if (userId) sb.from("tracks").update({ ...changes, updated_at: new Date().toISOString() }).eq("id", id).eq("user_id", userId).then();
    },
    [updateState, userId, sb],
  );

  const deleteTrack = useCallback(
    (id: string) => {
      updateState((prev) => ({ ...prev, tracks: prev.tracks.filter((t) => t.id !== id) }));
      if (userId) sb.from("tracks").delete().eq("id", id).eq("user_id", userId).then();
    },
    [updateState, userId, sb],
  );

  const addTrackLog = useCallback(
    (log: Omit<TrackLog, "id" | "created_at">) => {
      const newLog: TrackLog = { ...log, id: `tl-${Date.now()}`, created_at: new Date().toISOString() };
      updateState((prev) => ({ ...prev, track_logs: [newLog, ...prev.track_logs] }));
      if (userId) sb.from("track_logs").insert({ ...newLog, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  // ── Budget ──────────────────────────────────────────────────
  const setBudget = useCallback(
    (minutes: number) => {
      updateState((prev) => ({ ...prev, total_budget_minutes: minutes }));
      if (userId) sb.from("user_settings").upsert({ user_id: userId, total_budget_minutes: minutes, updated_at: new Date().toISOString() }).then();
    },
    [updateState, userId, sb],
  );

  // ── Allocation suggestion ───────────────────────────────────
  const acceptSuggestion = useCallback(() => {
    updateState((prev) => {
      const s = prev.allocation_suggestion;
      if (!s) return prev;
      const updatedTracks = prev.tracks.map((t) => {
        const sw = s.suggested_weights.find((w) => w.track_id === t.id);
        return sw ? { ...t, weight: sw.weight } : t;
      });
      const next = {
        ...prev,
        total_budget_minutes: s.suggested_budget,
        tracks: updatedTracks,
        allocation_suggestion: { ...s, suggestion_status: SUGGESTION_STATUS.ACCEPTED },
      };
      if (userId) {
        sb.from("tracks").upsert(updatedTracks.map((t) => ({ ...t, user_id: userId }))).then();
        sb.from("user_settings").upsert({ user_id: userId, total_budget_minutes: s.suggested_budget, updated_at: new Date().toISOString() }).then();
        sb.from("allocation_suggestion").upsert({ user_id: userId, ...next.allocation_suggestion }).then();
      }
      return next;
    });
  }, [updateState, userId, sb]);

  const rejectSuggestion = useCallback(() => {
    updateState((prev) => {
      if (!prev.allocation_suggestion) return prev;
      const next = { ...prev, allocation_suggestion: { ...prev.allocation_suggestion, suggestion_status: SUGGESTION_STATUS.REJECTED } };
      if (userId) sb.from("allocation_suggestion").upsert({ user_id: userId, ...next.allocation_suggestion }).then();
      return next;
    });
  }, [updateState, userId, sb]);

  // ── Reviews ─────────────────────────────────────────────────
  const addReview = useCallback(
    (review: TimeStructureReview) => {
      updateState((prev) => ({ ...prev, reviews: [...prev.reviews, review] }));
    },
    [updateState],
  );

  const addDailyReview = useCallback(
    (review: Omit<DailyReview, "id" | "created_at">) => {
      const newReview: DailyReview = { ...review, id: `dr-${Date.now()}`, created_at: new Date().toISOString() };
      updateState((prev) => ({ ...prev, daily_reviews: [newReview, ...prev.daily_reviews] }));
      if (userId) sb.from("daily_reviews").insert({ ...newReview, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  // ── Action responses ────────────────────────────────────────
  const addActionResponse = useCallback(
    (record: Omit<ActionResponseRecord, "id" | "created_at">) => {
      const newRecord: ActionResponseRecord = { ...record, id: `ar-${Date.now()}`, created_at: new Date().toISOString() };
      updateState((prev) => ({ ...prev, action_responses: [newRecord, ...prev.action_responses] }));
      if (userId) sb.from("action_responses").insert({ ...newRecord, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  // ── N轨 ─────────────────────────────────────────────────────
  const createNTrackSession = useCallback(
    (title: string, tracks: NTrackItem[], durationDays = 7) => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + durationDays);
      const session: NTrackSession = {
        id: `nts-${Date.now()}`,
        title,
        created_at: new Date().toISOString(),
        status: NTRACK_STATUS.SETUP,
        duration_days: durationDays,
        end_date: endDate.toISOString(),
        tracks,
        verdict: null,
      };
      updateState((prev) => ({ ...prev, ntrack_sessions: [session, ...prev.ntrack_sessions] }));
      if (userId) sb.from("ntrack_sessions").insert({ ...session, user_id: userId }).then();
      return session.id;
    },
    [updateState, userId, sb],
  );

  const updateNTrackSession = useCallback(
    (id: string, changes: Partial<NTrackSession>) => {
      updateState((prev) => ({ ...prev, ntrack_sessions: prev.ntrack_sessions.map((s) => s.id === id ? { ...s, ...changes } : s) }));
      if (userId) sb.from("ntrack_sessions").update(changes).eq("id", id).eq("user_id", userId).then();
    },
    [updateState, userId, sb],
  );

  const addNTrackLog = useCallback(
    (log: Omit<NTrackDailyLog, "id" | "created_at">) => {
      const newLog: NTrackDailyLog = { ...log, id: `ntl-${Date.now()}`, created_at: new Date().toISOString() };
      updateState((prev) => ({ ...prev, ntrack_logs: [newLog, ...prev.ntrack_logs] }));
      if (userId) sb.from("ntrack_logs").insert({ ...newLog, user_id: userId }).then();
    },
    [updateState, userId, sb],
  );

  const setNTrackVerdict = useCallback(
    (sessionId: string, verdict: NTrackVerdict) => {
      const changes = { verdict, status: NTRACK_STATUS.COMPLETED };
      updateState((prev) => ({ ...prev, ntrack_sessions: prev.ntrack_sessions.map((s) => s.id === sessionId ? { ...s, ...changes } : s) }));
      if (userId) sb.from("ntrack_sessions").update(changes).eq("id", sessionId).eq("user_id", userId).then();
    },
    [updateState, userId, sb],
  );

  // ── Derived ──────────────────────────────────────────────────
  const todayRecoveryPoints = state.recovery_points.filter(
    (rp) => new Date(rp.created_at).toDateString() === new Date().toDateString(),
  );
  const pendingSparks = state.sparks.filter((s) => s.status === SPARK_STATUS.PENDING);
  const manualTimeSparks = pendingSparks.filter((s) => s.reminder_type === SPARK_REMINDER_TYPE.MANUAL_TIME);
  const pendingSuggestion =
    state.allocation_suggestion?.suggestion_status === SUGGESTION_STATUS.PENDING
      ? state.allocation_suggestion
      : null;

  return {
    state,
    hydrated,
    userId,
    isSupabaseConfigured,
    addSpark,
    updateSpark,
    dismissSpark,
    addRecoveryPoint,
    updateTracks,
    addTrack,
    editTrack,
    deleteTrack,
    setBudget,
    acceptSuggestion,
    rejectSuggestion,
    addReview,
    addDailyReview,
    addTrackLog,
    createNTrackSession,
    updateNTrackSession,
    addNTrackLog,
    setNTrackVerdict,
    addActionResponse,
    todayRecoveryPoints,
    pendingSparks,
    manualTimeSparks,
    pendingSuggestion,
  };
}
