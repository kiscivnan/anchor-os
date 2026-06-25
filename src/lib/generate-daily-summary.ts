import {
  ACTION_RESPONSE,
  type ActionResponseRecord,
  type AppState,
  type RecoveryPointRecord,
  type Track,
  type TrackLog,
} from "@/types";

export interface DailySummary {
  facts: string;
  growth_evidence: string | null;
  resistance: string | null;
  emotional_signal: string | null;
  tomorrow_note: string;
  has_data: boolean;
}

function todayStr() {
  return new Date().toDateString();
}

function isToday(dateStr: string) {
  return new Date(dateStr).toDateString() === todayStr();
}

function buildFacts(
  logs: TrackLog[],
  tracks: Track[],
  recoveryPoints: RecoveryPointRecord[],
): string {
  if (logs.length === 0 && recoveryPoints.length === 0) {
    return "今天暂时没有执行记录或恢复点。";
  }

  const parts: string[] = [];

  if (logs.length > 0) {
    const byTrack = new Map<string, number>();
    for (const l of logs) {
      byTrack.set(l.track_id, (byTrack.get(l.track_id) ?? 0) + l.duration_minutes);
    }
    const trackSummaries = Array.from(byTrack.entries())
      .map(([id, mins]) => {
        const name = tracks.find((t) => t.id === id)?.name ?? id;
        return `${name} ${mins} 分钟`;
      })
      .join("、");
    parts.push(`执行了：${trackSummaries}。`);
  }

  if (recoveryPoints.length > 0) {
    parts.push(`出现了 ${recoveryPoints.length} 个恢复点。`);
  }

  return parts.join("") || "今天暂时没有记录。";
}

function buildGrowthEvidence(
  recoveryPoints: RecoveryPointRecord[],
  responses: ActionResponseRecord[],
): string | null {
  const doneCount = responses.filter(
    (r) => r.response === ACTION_RESPONSE.DONE,
  ).length;

  const evidences: string[] = [];

  if (recoveryPoints.length >= 2) {
    evidences.push(
      `你今天从断线状态回来了 ${recoveryPoints.length} 次，说明恢复能力在运作。`,
    );
  } else if (recoveryPoints.length === 1) {
    evidences.push(
      `今天有一次恢复点：${recoveryPoints[0].action_taken}。从停下来到重新启动，这件事本身就是证据。`,
    );
  }

  if (doneCount >= 3) {
    evidences.push(`完成了 ${doneCount} 次行动回报，启动能力今天比较稳。`);
  } else if (doneCount >= 1) {
    evidences.push(`完成了 ${doneCount} 次行动回报。`);
  }

  return evidences.length > 0 ? evidences.join(" ") : null;
}

function buildResistance(
  responses: ActionResponseRecord[],
  logs: TrackLog[],
  tracks: Track[],
): string | null {
  const skipped = responses.filter((r) => r.response === ACTION_RESPONSE.SKIPPED);
  const swapped = responses.filter((r) => r.response === ACTION_RESPONSE.SWAP);
  const researching = responses.filter(
    (r) => r.response === ACTION_RESPONSE.RESEARCHING,
  );

  const parts: string[] = [];

  if (skipped.length > 0) {
    const trackName =
      tracks.find((t) => t.id === skipped[0].track_id)?.name ?? "某轨道";
    parts.push(`${trackName} 今天没有做（跳过了 ${skipped.length} 次）。`);
  }

  if (researching.length >= 2) {
    parts.push(`"查资料"信号出现了 ${researching.length} 次，注意是否在用搜索代替行动。`);
  }

  if (swapped.length >= 2) {
    parts.push(`换了 ${swapped.length} 次任务，可能启动门槛偏高。`);
  }

  if (logs.length > 0) {
    const byTrack = new Map<string, number>();
    for (const l of logs) byTrack.set(l.track_id, (byTrack.get(l.track_id) ?? 0) + l.duration_minutes);
    const heaviest = Array.from(byTrack.entries()).sort((a, b) => b[1] - a[1])[0];
    if (heaviest) {
      const lightest = tracks
        .filter((t) => t.status === "active" && !byTrack.has(t.id))
        .map((t) => t.name);
      if (lightest.length > 0) {
        parts.push(`${lightest.join("、")} 今天没有执行记录。`);
      }
    }
  }

  return parts.length > 0 ? parts.join(" ") : null;
}

function buildEmotionalSignal(responses: ActionResponseRecord[]): string | null {
  const numb = responses.filter((r) => r.response === ACTION_RESPONSE.NUMB).length;
  const selfBlame = responses.filter(
    (r) => r.response === ACTION_RESPONSE.SELF_BLAME,
  ).length;

  if (numb + selfBlame === 0) return null;

  const parts: string[] = [];
  if (numb >= 2) parts.push(`出现了 ${numb} 次"很麻木"信号`);
  else if (numb === 1) parts.push(`出现了 1 次麻木信号`);
  if (selfBlame >= 1) parts.push(`${selfBlame} 次自责信号`);

  const combined = parts.join("，") + "。";

  if (numb + selfBlame >= 3) {
    return combined + "今天的情绪压力偏高，明天分配时建议调轻。";
  }
  return combined + "已经识别出来，这本身就是回来的一步。";
}

function buildTomorrowNote(
  logs: TrackLog[],
  responses: ActionResponseRecord[],
  recoveryPoints: RecoveryPointRecord[],
  reviewTags: string[],
): string {
  const fatigueFromReview = reviewTags.includes("mode:fatigue_check");
  const numb = responses.filter((r) => r.response === ACTION_RESPONSE.NUMB).length;
  const selfBlame = responses.filter(
    (r) => r.response === ACTION_RESPONSE.SELF_BLAME,
  ).length;
  const totalMinutes = logs.reduce((s, l) => s + l.duration_minutes, 0);
  const doneCount = responses.filter(
    (r) => r.response === ACTION_RESPONSE.DONE,
  ).length;

  if (fatigueFromReview || numb + selfBlame >= 2) {
    return "明天建议把预算调轻，只保留一个主任务，不追求全面推进。";
  }

  if (doneCount >= 3 && totalMinutes >= 60) {
    return "今天完成感不错。明天可以维持节奏，不需要大幅调整。";
  }

  if (recoveryPoints.length >= 1 && totalMinutes < 30) {
    return "今天执行时间偏短，但有恢复点，说明启动机制在工作。明天找一个门槛更低的动作开始。";
  }

  return "明天先做今天没完成的那一个动作，不用补救整天。";
}

export function generateDailySummary(state: AppState): DailySummary {
  const todayLogs = state.track_logs.filter((l) => isToday(l.created_at));
  const todayRecovery = state.recovery_points.filter((r) => isToday(r.created_at));
  const todayResponses = state.action_responses.filter((r) =>
    isToday(r.created_at),
  );
  const todayReviews = state.daily_reviews.filter((r) => isToday(r.created_at));
  const todayTags = todayReviews.flatMap((r) => r.triggered_tags);

  const has_data =
    todayLogs.length > 0 ||
    todayRecovery.length > 0 ||
    todayResponses.length > 0 ||
    todayReviews.length > 0;

  return {
    has_data,
    facts: buildFacts(todayLogs, state.tracks, todayRecovery),
    growth_evidence: buildGrowthEvidence(todayRecovery, todayResponses),
    resistance: buildResistance(todayResponses, todayLogs, state.tracks),
    emotional_signal: buildEmotionalSignal(todayResponses),
    tomorrow_note: buildTomorrowNote(
      todayLogs,
      todayResponses,
      todayRecovery,
      todayTags,
    ),
  };
}
