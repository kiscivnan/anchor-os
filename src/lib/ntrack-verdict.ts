import {
  VERDICT_RESULT,
  type NTrackDailyLog,
  type NTrackItem,
  type NTrackVerdict,
  type VerdictResult,
} from "@/types";

function avg(nums: number[]): number {
  if (nums.length === 0) return 3;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function generateVerdict(
  tracks: NTrackItem[],
  logs: NTrackDailyLog[],
): NTrackVerdict {
  const [trackA, trackB] = tracks;

  const logsA = logs.filter((l) => l.track_id === trackA.id);
  const logsB = logs.filter((l) => l.track_id === (trackB?.id ?? ""));

  const daysA = new Set(logsA.map((l) => l.date)).size;
  const daysB = new Set(logsB.map((l) => l.date)).size;

  const resistA = avg(logsA.map((l) => l.resistance_level));
  const resistB = avg(logsB.map((l) => l.resistance_level));

  const energizedA = logsA.filter((l) => l.mood_after === "energized").length;
  const energizedB = logsB.filter((l) => l.mood_after === "energized").length;

  const drainedA = logsA.filter((l) => l.mood_after === "drained").length;
  const drainedB = logsB.filter((l) => l.mood_after === "drained").length;

  const minutesA = logsA.reduce((s, l) => s + l.duration_minutes, 0);
  const minutesB = logsB.reduce((s, l) => s + l.duration_minutes, 0);

  // 裁决规则
  let result: VerdictResult = VERDICT_RESULT.CONTINUE_BOTH;
  let reason = "";
  let nextStrategy = "";

  const aClear =
    daysA >= daysB + 2 && resistA < resistB && energizedA >= energizedB;
  const bClear =
    daysB >= daysA + 2 && resistB < resistA && energizedB >= energizedA;

  const aCollapsed = daysA <= 1 && minutesA < 10;
  const bCollapsed = daysB <= 1 && minutesB < 10;

  if (aCollapsed && !bCollapsed) {
    result = VERDICT_RESULT.PRIMARY_B;
    reason = `${trackA.name} 这 7 天几乎没有实际行动（执行天数 ${daysA} 天，合计 ${minutesA} 分钟），${trackB.name} 有更多现实数据支撑。`;
    nextStrategy = `下一阶段以 ${trackB.name} 为主轨，${trackA.name} 暂时搁置，不重新分析，等待具体触发条件再重开。`;
  } else if (bCollapsed && !aCollapsed) {
    result = VERDICT_RESULT.PRIMARY_A;
    reason = `${trackB.name} 这 7 天几乎没有实际行动（执行天数 ${daysB} 天，合计 ${minutesB} 分钟），${trackA.name} 有更多现实数据支撑。`;
    nextStrategy = `下一阶段以 ${trackA.name} 为主轨，${trackB.name} 暂时搁置，不重新分析，等待具体触发条件再重开。`;
  } else if (aClear) {
    result = VERDICT_RESULT.PRIMARY_A;
    reason = `${trackA.name} 启动阻力更低（平均 ${resistA.toFixed(1)} vs ${resistB.toFixed(1)}），执行了 ${daysA} 天，做完后更有能量的次数更多。`;
    nextStrategy = `主推 ${trackA.name}，${trackB.name} 降为每周一次验证动作，不放弃但不占主要精力。`;
  } else if (bClear) {
    result = VERDICT_RESULT.PRIMARY_B;
    reason = `${trackB.name} 启动阻力更低（平均 ${resistB.toFixed(1)} vs ${resistA.toFixed(1)}），执行了 ${daysB} 天，做完后更有能量的次数更多。`;
    nextStrategy = `主推 ${trackB.name}，${trackA.name} 降为每周一次验证动作，不放弃但不占主要精力。`;
  } else if (drainedA >= 3 && drainedB < 2) {
    result = VERDICT_RESULT.PRIMARY_B;
    reason = `${trackA.name} 做完后感到疲惫的次数偏多（${drainedA} 次），${trackB.name} 更稳定。`;
    nextStrategy = `暂时把 ${trackA.name} 移入观察区，以 ${trackB.name} 为主继续积累现实反馈。`;
  } else if (drainedB >= 3 && drainedA < 2) {
    result = VERDICT_RESULT.PRIMARY_A;
    reason = `${trackB.name} 做完后感到疲惫的次数偏多（${drainedB} 次），${trackA.name} 更稳定。`;
    nextStrategy = `暂时把 ${trackB.name} 移入观察区，以 ${trackA.name} 为主继续积累现实反馈。`;
  } else {
    result = VERDICT_RESULT.CONTINUE_BOTH;
    reason = `两条轨道都有执行记录（${trackA.name} ${daysA} 天 / ${trackB.name} ${daysB} 天），差异还不够明显，无法做出清晰裁决。`;
    nextStrategy = `继续双轨再验证 7 天，重点收集：哪条轨道做完后你更容易主动延续？`;
  }

  return {
    created_at: new Date().toISOString(),
    result,
    reason,
    next_strategy: nextStrategy,
    closed_questions: [
      "不在本阶段重新打开「到底选哪条路」的讨论。",
      "当前裁决是下一阶段策略，不是终局选择。",
      "最大风险不是选错，而是重回悬空分析导致两边都没有现实反馈。",
    ],
  };
}
