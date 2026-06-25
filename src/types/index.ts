export const TRACK_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
  DONE: "done",
} as const;

export type TrackStatus = (typeof TRACK_STATUS)[keyof typeof TRACK_STATUS];

export const TRACK_STATUS_LABELS: Record<TrackStatus, string> = {
  [TRACK_STATUS.ACTIVE]: "正在进入",
  [TRACK_STATUS.PAUSED]: "等待重新进入",
  [TRACK_STATUS.DONE]: "本次已收束",
};

export interface Track {
  id: string;
  name: string;
  weight: number;
  manual_minutes?: number;
  today_action: string;
  status: TrackStatus;
}

export interface DailyBudget {
  today_budget_minutes: number;
}

export interface TrackSchedulerConfig {
  tracks: Track[];
  total_budget_minutes: number;
}

export const ALLOCATION_REASON = {
  MANUAL: "manual",
  WEIGHT: "weight",
} as const;

export type AllocationReason =
  (typeof ALLOCATION_REASON)[keyof typeof ALLOCATION_REASON];

export interface TrackAllocation {
  track_id: string;
  allocated_minutes: number;
  reason: AllocationReason;
}

export const INPUT_STATE = {
  TIME_LOSS: "time_loss",
  PLAN_HYPE: "plan_hype",
  AI_SPIRAL: "ai_spiral",
  MULTI_TRACK: "multi_track",
  UNCLASSIFIED: "unclassified",
} as const;

export type InputState = (typeof INPUT_STATE)[keyof typeof INPUT_STATE];

export const INPUT_STATE_LABELS: Record<InputState, string> = {
  [INPUT_STATE.TIME_LOSS]: "时间出现偏移",
  [INPUT_STATE.PLAN_HYPE]: "计划正在扩张",
  [INPUT_STATE.AI_SPIRAL]: "信息形成循环",
  [INPUT_STATE.MULTI_TRACK]: "多轨分配拥挤",
  [INPUT_STATE.UNCLASSIFIED]: "偏移尚待确认",
};

export type InputResult = {
  state: InputState;
  suggestion: string;
  next_action: string;
};

export interface RecoveryPoint {
  id: string;
  name: string;
  description: string;
  estimated_minutes: number;
}

export const SPARK_REMINDER_TYPE = {
  MANUAL_TIME: "manual_time",
  AI_JUDGED: "ai_judged",
} as const;

export type SparkReminderType =
  (typeof SPARK_REMINDER_TYPE)[keyof typeof SPARK_REMINDER_TYPE];

export const SPARK_REMINDER_TYPE_LABELS: Record<SparkReminderType, string> = {
  [SPARK_REMINDER_TYPE.MANUAL_TIME]: "计划任务型",
  [SPARK_REMINDER_TYPE.AI_JUDGED]: "待提醒念头型",
};

export const SPARK_STATUS = {
  PENDING: "pending",
  REMINDED: "reminded",
  RESOLVED: "resolved",
} as const;

export type SparkStatus = (typeof SPARK_STATUS)[keyof typeof SPARK_STATUS];

export interface Spark {
  id: string;
  content: string;
  created_at: string;
  reminder_type: SparkReminderType;
  reminder_time: string | null;
  status: SparkStatus;
  is_user_corrected: boolean;
}

export interface SparkClassification {
  reminder_type: SparkReminderType;
  suggested_reminder_time: string | null;
  timing_note: string;
}

export interface TimeStructureReview {
  time_enough: string;
  ignored_tracks: string;
  recovery_point: string;
  anchor_deviation: string;
  weight_adjustment: string;
}

export interface DailyReview {
  id: string;
  created_at: string;
  raw_input: string;
  triggered_tags: string[];
  follow_up_response: string | null;
}

export interface RecoveryPointRecord {
  id: string;
  created_at: string;
  from_state: InputState | null;
  action_taken: string;
  note: string | null;
}

// ─── N 轨锚点 ───────────────────────────────────────────────

export const NTRACK_STATUS = {
  SETUP: "setup",
  ACTIVE: "active",
  COMPLETED: "completed",
} as const;
export type NTrackStatus = (typeof NTRACK_STATUS)[keyof typeof NTRACK_STATUS];

export interface NTrackItem {
  id: string;
  name: string;
  description: string;
  fears: string[];
  criteria: string[];
  min_action: string;
}

export interface NTrackSession {
  id: string;
  title: string;
  created_at: string;
  status: NTrackStatus;
  duration_days: number;
  end_date: string;
  tracks: NTrackItem[];
  verdict: NTrackVerdict | null;
}

export const NTRACK_LOG_FIELD = {
  RESISTANCE: "resistance",
  MOOD_AFTER: "mood_after",
} as const;

export interface NTrackDailyLog {
  id: string;
  session_id: string;
  track_id: string;
  date: string;
  action_done: string;
  duration_minutes: number;
  external_feedback: string;
  resistance_level: 1 | 2 | 3 | 4 | 5;
  mood_after: "drained" | "neutral" | "energized";
  created_at: string;
}

export const VERDICT_RESULT = {
  CONTINUE_BOTH: "continue_both",
  PRIMARY_A: "primary_a",
  PRIMARY_B: "primary_b",
  PAUSE_ONE: "pause_one",
} as const;
export type VerdictResult = (typeof VERDICT_RESULT)[keyof typeof VERDICT_RESULT];

export const VERDICT_RESULT_LABELS: Record<VerdictResult, string> = {
  [VERDICT_RESULT.CONTINUE_BOTH]: "继续双轨 7 天",
  [VERDICT_RESULT.PRIMARY_A]: "主 A 轨，副 B 轨验证",
  [VERDICT_RESULT.PRIMARY_B]: "主 B 轨，副 A 轨维持",
  [VERDICT_RESULT.PAUSE_ONE]: "暂停某一轨",
};

export interface NTrackVerdict {
  created_at: string;
  result: VerdictResult;
  reason: string;
  next_strategy: string;
  closed_questions: string[];
}

// ────────────────────────────────────────────────────────────

export const TRACK_LOG_SOURCE = {
  TIMER: "timer",
  MANUAL: "manual",
} as const;

export type TrackLogSource =
  (typeof TRACK_LOG_SOURCE)[keyof typeof TRACK_LOG_SOURCE];

export interface TrackLog {
  id: string;
  track_id: string;
  duration_minutes: number;
  note: string;
  source: TrackLogSource;
  created_at: string;
}

export const ACTION_RESPONSE = {
  DONE: "done",
  SWAP: "swap",
  SKIPPED: "skipped",
  RESEARCHING: "researching",
  NUMB: "numb",
  SELF_BLAME: "self_blame",
} as const;

export type ActionResponse = (typeof ACTION_RESPONSE)[keyof typeof ACTION_RESPONSE];

export const ACTION_RESPONSE_LABELS: Record<ActionResponse, string> = {
  [ACTION_RESPONSE.DONE]: "完成了",
  [ACTION_RESPONSE.SWAP]: "换一个",
  [ACTION_RESPONSE.SKIPPED]: "没做",
  [ACTION_RESPONSE.RESEARCHING]: "我在查资料",
  [ACTION_RESPONSE.NUMB]: "我现在很麻木",
  [ACTION_RESPONSE.SELF_BLAME]: "我开始自责了",
};

export interface ActionResponseRecord {
  id: string;
  created_at: string;
  track_id: string;
  action: string;
  response: ActionResponse;
  system_reply: string;
}

export const SUGGESTION_STATUS = {
  PENDING: "pending",
  ACCEPTED: "accepted",
  REJECTED: "rejected",
} as const;

export type SuggestionStatus =
  (typeof SUGGESTION_STATUS)[keyof typeof SUGGESTION_STATUS];

export interface SuggestedTrackWeight {
  track_id: string;
  weight: number;
}

export interface AllocationSuggestion {
  suggested_budget: number;
  suggested_weights: SuggestedTrackWeight[];
  suggestion_reason: string;
  suggestion_status: SuggestionStatus;
  generated_at: string;
}

export interface AppState {
  tracks: Track[];
  total_budget_minutes: number;
  sparks: Spark[];
  recovery_points: RecoveryPointRecord[];
  reviews: TimeStructureReview[];
  daily_reviews: DailyReview[];
  allocation_suggestion: AllocationSuggestion | null;
  action_responses: ActionResponseRecord[];
  track_logs: TrackLog[];
  ntrack_sessions: NTrackSession[];
  ntrack_logs: NTrackDailyLog[];
}
