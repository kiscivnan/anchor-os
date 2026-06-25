-- 锚点 OS · Supabase Schema
-- 在 Supabase Dashboard > SQL Editor 中执行

-- ── 启用 RLS helper ───────────────────────────────────────────
-- 所有表均使用 user_id = auth.uid() 作为行级安全策略

-- ── user_settings ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_settings (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_budget_minutes integer NOT NULL DEFAULT 50,
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_settings" ON user_settings USING (user_id = auth.uid());

-- ── tracks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name          text NOT NULL,
  weight        integer NOT NULL DEFAULT 1,
  manual_minutes integer,
  today_action  text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'active',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE tracks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_tracks" ON tracks USING (user_id = auth.uid());

-- ── track_logs ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS track_logs (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id      text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  note          text NOT NULL DEFAULT '',
  source        text NOT NULL DEFAULT 'manual',
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE track_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_track_logs" ON track_logs USING (user_id = auth.uid());

-- ── sparks ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sparks (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content       text NOT NULL,
  reminder_type text NOT NULL DEFAULT 'ai_judged',
  reminder_time text,
  status        text NOT NULL DEFAULT 'pending',
  is_user_corrected boolean NOT NULL DEFAULT false,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE sparks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_sparks" ON sparks USING (user_id = auth.uid());

-- ── daily_reviews ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_reviews (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  raw_input     text NOT NULL,
  triggered_tags text[] NOT NULL DEFAULT '{}',
  follow_up_response text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE daily_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_daily_reviews" ON daily_reviews USING (user_id = auth.uid());

-- ── recovery_points ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS recovery_points (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  from_state    text,
  action_taken  text NOT NULL,
  note          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE recovery_points ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_recovery_points" ON recovery_points USING (user_id = auth.uid());

-- ── action_responses ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS action_responses (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  track_id      text NOT NULL,
  action        text NOT NULL,
  response      text NOT NULL,
  system_reply  text NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE action_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_action_responses" ON action_responses USING (user_id = auth.uid());

-- ── allocation_suggestion ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocation_suggestion (
  user_id       uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  suggested_budget integer NOT NULL DEFAULT 50,
  suggested_weights jsonb NOT NULL DEFAULT '[]',
  suggestion_reason text NOT NULL DEFAULT '',
  suggestion_status text NOT NULL DEFAULT 'pending',
  generated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE allocation_suggestion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_allocation_suggestion" ON allocation_suggestion USING (user_id = auth.uid());

-- ── ntrack_sessions ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ntrack_sessions (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title         text NOT NULL,
  status        text NOT NULL DEFAULT 'setup',
  duration_days integer NOT NULL DEFAULT 7,
  end_date      text NOT NULL,
  tracks        jsonb NOT NULL DEFAULT '[]',
  verdict       jsonb,
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ntrack_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ntrack_sessions" ON ntrack_sessions USING (user_id = auth.uid());

-- ── ntrack_logs ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ntrack_logs (
  id            text PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id    text NOT NULL,
  track_id      text NOT NULL,
  date          text NOT NULL,
  action_done   text NOT NULL DEFAULT '',
  duration_minutes integer NOT NULL DEFAULT 0,
  external_feedback text NOT NULL DEFAULT '',
  resistance_level integer NOT NULL DEFAULT 3,
  mood_after    text NOT NULL DEFAULT 'neutral',
  created_at    timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE ntrack_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_ntrack_logs" ON ntrack_logs USING (user_id = auth.uid());
