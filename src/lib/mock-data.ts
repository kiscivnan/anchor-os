import {
  SPARK_REMINDER_TYPE,
  SPARK_STATUS,
  TRACK_STATUS,
  type DailyBudget,
  type RecoveryPoint,
  type Spark,
  type Track,
  type TrackSchedulerConfig,
} from "@/types";

export const mockDailyBudget: DailyBudget = {
  today_budget_minutes: 50,
};

export const mockTracks: Track[] = [
  {
    id: "system-design",
    name: "学习系统设计",
    weight: 3,
    today_action: "阅读 + 做一个小笔记",
    status: TRACK_STATUS.ACTIVE,
  },
  {
    id: "body-recovery",
    name: "身体恢复",
    weight: 2,
    today_action: "轻运动 + 拉伸",
    status: TRACK_STATUS.ACTIVE,
  },
  {
    id: "information-organizing",
    name: "信息整理",
    weight: 1,
    today_action: "清理待办 + 归档",
    status: TRACK_STATUS.PAUSED,
  },
];

export const mockTrackSchedulerConfig: TrackSchedulerConfig = {
  tracks: mockTracks,
  total_budget_minutes: mockDailyBudget.today_budget_minutes,
};

export const mockRecoveryPoints: RecoveryPoint[] = [
  {
    id: "leave-screen",
    name: "离开屏幕",
    description: "把注意力从当前页面移开一会儿。",
    estimated_minutes: 2,
  },
  {
    id: "drink-water",
    name: "喝一杯水",
    description: "不补救整天，只照顾此刻的身体。",
    estimated_minutes: 3,
  },
];

export const mockSparks: Spark[] = [
  {
    id: "spark-language",
    content: "突然想学一门新语言",
    created_at: "2026-06-24T10:30:00+08:00",
    reminder_type: SPARK_REMINDER_TYPE.AI_JUDGED,
    reminder_time: null,
    status: SPARK_STATUS.PENDING,
    is_user_corrected: false,
  },
];
